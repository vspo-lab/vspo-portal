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

Merging is performed by `.github/workflows/dep-auto-merge.yaml`, never by Renovate
and never by GitHub auto-merge. The workflow decides nothing: it runs
`scripts/dep-triage-report.py` and executes the result.

Renovate's automerge was rejected because it merges on "CI green" alone. These
gates are strictly stronger, so that concern is met without giving Renovate the
merge button.

The workflow holds the credentials; the routine holds the judgement. A routine
session has no GitHub write access, so putting the merge there would have meant
inventing a way to grant it. Keeping the decision in one script also means the
policy is reviewed as code rather than reconstructed from prose each morning.

Every required check must be green, and one of two gates must be open:

| Gate | Condition | Covers |
|------|-----------|--------|
| A | A human with write access approved the current head commit | Anything. The approval is the human's judgement, taken at face value |
| B | The PR carries `no-runtime-impact`, carries neither `major` nor `high-risk`, and the diff touches only `package.json`, `pnpm-lock.yaml` and `pnpm-workspace.yaml` | Updates nobody needs to look at |

An approval on a superseded commit is stale and does not open Gate A, and a
`CHANGES_REQUESTED` review closes it. Neither gate permits merging past a failing,
pending or absent check.

Opening a gate is necessary but not sufficient: GitHub still applies branch
protection. `CODEOWNERS` originally assigned every file to a single owner, so the
first Gate B merge was refused with `Waiting on code owner review` even though the
gate was open and all seventeen checks were green. The dependency manifests
therefore carry no code owner, which is exactly the set Gate B is allowed to touch.

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

### Lockfile sync (`lockfile-sync.yaml`)

A dependency PR that changes a manifest without regenerating `pnpm-lock.yaml`
fails at install. Because every job installs first, a one-line bump turns six
checks red with an error that names none of them.

Renovate produced exactly that on #1125: `package.json` moved
`markdownlint-cli2` to `^0.23.0` with no lockfile change, `CI=true` made the
install frozen, and the PR sat unmergeable for twelve days. It was the only PR
that had ever opened Gate B, so the whole flow had nothing to merge.

The workflow runs frozen install and judges by exit code. On `renovate/**` and
`dependabot/**` it regenerates the lockfile and pushes; anywhere else it fails
with a single legible message instead of six opaque ones. The push retriggers
CI, where the frozen install now succeeds and the workflow does nothing, so it
terminates.

Pushing to a Renovate branch does make Renovate stop rebasing it. That is worth
accepting here: without the push the PR is unmergeable regardless, so there is
nothing left for a rebase to preserve.

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

### Auto merge (`dep-auto-merge.yaml`)

Runs on `pull_request_review` (so an approval acts within the minute), hourly on a
schedule (so Gate B PRs merge once their checks land), and on demand. It checks out
the default branch rather than the PR's version of the script, so a pull request
cannot rewrite the policy that admits it.

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

The routine may push repair commits to `renovate/**`, edit `.trivyignore.yaml`,
`pnpm.overrides` and the security ledger, and create or update the release PR.

It may not merge anything, approve anything, or edit labels to change a gate's
outcome. Merging belongs to `dep-auto-merge.yaml`; approving belongs to a human.

### Rollout

The routine ships in `report` mode, performing the full analysis and posting the
summary without pushing or merging. It is switched to `apply` mode once its output
has matched human judgement for one to two weeks.

## References

- [Dependency Security Policy](../security/dependency-policy.md) - triage rules, reachability criteria, decision ledger
- [Infrastructure CI/CD](./ci-cd.md) - workflow reference
