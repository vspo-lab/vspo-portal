# Dependency Auto Flow

How Renovate updates reach `develop`, and how the `develop` -> `main` release PR
stays current. The working specification lives in `docs/plan/dependency-auto-flow/`,
which is local only; this document is the committed reference.

## Design

Work is split into three layers so that the deterministic steps never depend on the
routine being alive. If the routine stops, updates still flow into `develop` and the
release PR is still maintained; only failure repair and security triage stop.

```text
+--------------------------------------------------------------------------+
|  L0  Intake control - renovate.json                                       |
|      Grouping, cooldown, scheduling, concurrency limits                   |
+--------------------------------------------------------------------------+
                                    |
                                    v
+--------------------------------------------------------------------------+
|  L1  Deterministic automation - GitHub Actions                            |
|      release-pr.yaml, concurrency groups                                  |
+--------------------------------------------------------------------------+
                                    |
                                    v
+--------------------------------------------------------------------------+
|  L2  Judgement - dep-triage skill, run daily by a scheduled routine       |
|      Repair red CI, triage security findings, refresh the release PR      |
+--------------------------------------------------------------------------+
                                    |
                                    v
                      Human action: merge the dev -> prd PR
```

## L0. Intake Control (`renovate.json`)

Renovate is the only update bot. Dependabot security updates are disabled, since
running both produces two PRs per advisory and Renovate can additionally generate
transitive `pnpm.overrides` pins.

| Setting | Value | Reason |
|---------|-------|--------|
| `baseBranches` | `develop` | Updates never target `main` directly |
| `schedule` | `* 0-3 * * *` (JST) | PRs open overnight, so CI has settled before the routine runs |
| `minimumReleaseAge` | 7 days for npm, from the shared preset | Supply-chain cooldown. Removes the "should I wait?" judgement |
| `prConcurrentLimit` / `prHourlyLimit` | 5 / 2 | Caps simultaneous CI usage |
| `internalChecksFilter` | `strict` | No PR is raised until the cooldown has elapsed |
| `osvVulnerabilityAlerts` | `true` | Advisory source, replacing Dependabot |
| `lockFileMaintenance` | weekly | Keeps transitive dependencies fresh; merged like any other PR |

### Grouping and merge eligibility

Renovate has `automerge` disabled everywhere and never merges. Grouping exists to
batch PRs, and the `no-runtime-impact` label marks the only classes the routine is
permitted to merge.

| Group | Matches | `no-runtime-impact` |
|-------|---------|---------------------|
| `type-definitions` | `@types/**`, patch + minor | Yes |
| `github-actions` | github-actions manager, patch + minor + digest | Yes |
| `lint-tooling` | Biome, cspell, knip, textlint, markdownlint, lefthook | Yes |
| `test-tooling` | Vitest, Testing Library, jsdom | Yes |
| `build-tooling` | TypeScript, tsup, turbo, Storybook, Vite, Tailwind, Wrangler, OpenNext, Astro | No, changes emitted output |
| `dev-dependencies` | remaining devDependencies, patch + minor | No |
| `production-patch` / `production-minor` | dependencies | No, runtime behavior can change |
| high-risk | `next`, `react`, `react-dom`, `wrangler`, `@opennextjs/cloudflare`, `@cloudflare/workers-types`, `typescript`, `@biomejs/biome`, `astro` | No, ungrouped |
| major | any major | No, requires dashboard approval |

`vulnerabilityAlerts` overrides the cooldown with `minimumReleaseAge: null`, so a
fix for a known CVE is never delayed.

## L1. Deterministic Automation

### Merge criterion

Merging is performed only by the `dep-triage` routine, never by Renovate or by
GitHub auto-merge. Every required check must be green, and one of two gates must
be open:

| Gate | Condition | Covers |
|------|-----------|--------|
| A | A human with write access approved the current head commit | Anything. The approval is the human's judgement, taken at face value |
| B | The PR carries `no-runtime-impact`, carries neither `major` nor `high-risk`, and the diff touches only `package.json`, `pnpm-lock.yaml` and `pnpm-workspace.yaml` | Updates nobody needs to look at |

An approval on a superseded commit is stale and does not open Gate A, and a
`CHANGES_REQUESTED` review closes it. Neither gate permits merging past a failing,
pending or absent check.

Gate B never trusts the label on its own. Renovate applies `addLabels` per matching
rule but the label lands on the whole PR, so a PR spanning two managers can arrive
labelled from a rule that covers only half of it. A pnpm bump did exactly that: it
matched the `github-actions` rule, arrived `no-runtime-impact`, and also edited
`.github/actions/setup-pnpm/action.yml`, a deploy workflow and `package.json`. The
label check, the `major`/`high-risk` exclusion and the diff check are three
independent conditions for that reason.

`scripts/dep-triage-report.py` evaluates the gates against the live API and prints
a decision per PR, so the policy is machine-checked rather than re-derived by hand.

Gate B exists so routine noise (type definitions, CI tooling) never reaches a
human. Everything else, production dependencies and build-chain tooling included,
waits for an approval. A green check suite alone is not sufficient, because a
green suite does not prove that emitted output is unchanged.

For that criterion to mean anything, the checks must actually run. `pr-check.yaml`
therefore triggers on the root `package.json`, `pnpm-lock.yaml` and
`pnpm-workspace.yaml`, and carries a `deps` path filter that pulls in the `knip`,
`bundle-size` and `test` jobs. Without it, a lockfile-only PR would run no jobs at
all and "every check green" would be vacuously true.

### Release PR (`release-pr.yaml`)

On every push to `develop`, the workflow creates the `develop` -> `main` PR or
updates the body of the existing one. The body is generated by
`scripts/release-pr-body.sh` from the `main..develop` range, so the operation is
idempotent.

A PR opened with the default `GITHUB_TOKEN` does not trigger other workflows. The
workflow prefers a `RELEASE_PR_TOKEN` secret (GitHub App installation token or PAT);
without it the PR is still created and kept current, but its checks must be started
manually.

### CI cost control

| Change | Effect |
|--------|--------|
| `concurrency` with `cancel-in-progress: true` on `pr-check`, `lighthouse`, `autofix` | Renovate rebases no longer leave superseded runs going |
| `concurrency` with `cancel-in-progress: false` on `security-scan`, `release-pr` | Serialized but never cancelled, since they publish results |
| `lighthouse` skipped for PRs labelled `dependencies` | The most expensive job, already `continue-on-error`, and it adds no signal to a lockfile bump |
| `autofix` excludes `renovate/**` | A commit from another author makes Renovate stop rebasing its own branch |

## L2. Daily Routine

The procedure is the `dep-triage` skill (`.agent/skills/dep-triage/SKILL.md`), run
by a scheduled routine at 09:00 JST. It covers this repository and
`vspo-lab/config`, which holds the shared Renovate presets. Keeping it in the repository means it is
reviewed through pull requests and can also be run by hand with `/dep-triage`.

Steps: collect open dependency PRs, repair red CI, triage security findings, prune
stale `pnpm.overrides` pins, refresh the release PR, and post one summary comment
per run.

Repairs are capped at two attempts per PR; a third failure is escalated and the PR
is labelled `needs-human`.

### Permission boundary

The routine may push repair commits to `renovate/**`, merge dependency PRs into
`develop` once every check is green, edit `.trivyignore.yaml`, `pnpm.overrides` and
the security ledger, and create or update the release PR.

It may never merge into `main`, merge while any required check is failing, pending
or absent, merge a `major` or `high-risk` PR, or edit files under
`.github/workflows/`.

### Rollout

The routine ships in `report` mode, performing the full analysis and posting the
summary without pushing or merging. It is switched to `apply` mode once its output
has matched human judgement for one to two weeks.

## References

- [Dependency Security Policy](../security/dependency-policy.md) - triage rules, reachability criteria, decision ledger
- [Infrastructure CI/CD](./ci-cd.md) - workflow reference
