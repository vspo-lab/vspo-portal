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

### Grouping

Renovate has `automerge` disabled everywhere and never merges. Grouping exists
only to keep the PR count down.

| Group | Matches |
|-------|---------|
| `type-definitions` | `@types/**`, patch + minor |
| `github-actions` | github-actions manager, patch + minor + digest |
| `dev-dependencies` | all devDependencies below major |
| `production-patch` / `production-minor` | dependencies |
| high-risk | `next`, `react`, `react-dom`, `wrangler`, `@opennextjs/cloudflare`, `@cloudflare/workers-types`, `typescript`, `@biomejs/biome`, `astro`. Ungrouped and labelled, so they are obvious when deciding whether to approve |
| major | any major. Requires dashboard approval |

`vulnerabilityAlerts` overrides the cooldown with `minimumReleaseAge: null`, so a
fix for a known CVE is never delayed.

## L1. Deterministic Automation

### Merge criterion

A pull request merges when its current head commit is approved and every required
check has passed. That is the whole rule.

Merging is performed by `.github/workflows/dep-auto-merge.yaml`, never by Renovate
and never by GitHub auto-merge. The workflow decides nothing: it runs
`scripts/dep-triage-report.py` and executes the result, so the policy lives in one
reviewable place instead of being re-derived from prose on every run.

Renovate's own automerge is disabled because it merges on "CI green" alone. The
approval is what makes a merge deliberate.

The approval comes from the maintainer, or from the daily `dep-triage` run acting
on their behalf after reading the diff. What that run may and may not approve is
set out in `.agent/skills/dep-triage/SKILL.md`; in short, it never approves a
`major`, anything labelled `high-risk`, or, in the same run, a repair that
changed more than the manifests and the lockfile.

- An approval on a superseded commit is stale: the approver never saw what would
  actually be merged
- `CHANGES_REQUESTED` blocks the merge regardless of other approvals
- A check that is absent or still pending is not a pass
- `skipped` and `neutral` do count as passing. The path filters in
  `pr-check.yaml` deliberately skip jobs a given diff cannot affect, and
  `lighthouse` is skipped for `dependencies` PRs on purpose. Treating a skip as a
  failure would block every dependency PR the flow exists to merge

#### The gate must not count itself

The workflow's own job registers a check run against the head commit of the pull
request under review, and that check is in progress while the evaluator reads it.
Counting it makes the gate wait for itself: every PR is held as "not green" and
nothing ever merges through the `pull_request_review` path.

This is not hypothetical. It is why no approval-triggered merge succeeded between
2026-08-14 and 2026-08-28; the hourly schedule was doing all the merging, because
a scheduled run attaches its check to `develop` rather than to the PR.

The workflow now resolves its own `check_suite_id` and passes it to the evaluator
as `SELF_CHECK_SUITE_ID`, and every check in that suite is skipped. Matching on
the suite rather than on a job name means the workflow and the script never have
to agree about a string, so there is nothing to keep in step and nothing that can
silently drift. An unset value skips nothing, which is correct for a local run:
it creates no check of its own.

#### Why there is no approval-free path

An earlier design had a second gate that merged changes whose class "cannot affect
the product" — type definitions, CI tooling — without anyone approving. It was
removed, because it cost more than it saved:

- It required a `CODEOWNERS` carve-out, since a repository-wide code owner blocks
  any merge the owner has not reviewed
- It then hit the branch protection approval requirement anyway, which the human
  maintainer routinely bypasses as an admin but a bot cannot
- It admitted a PR that edited `.github/actions/setup-pnpm/action.yml` and a deploy
  workflow, because Renovate applies `addLabels` per matching rule while the label
  lands on the whole PR

Approving a dependency PR is cheap. A path that merges without anyone looking was
not, and every incident above came from it.

For the criterion to mean anything, the checks must actually run. `pr-check.yaml`
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
eligible to merge at the time, so the whole flow had nothing to act on.

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

Runs on `pull_request_review` (so an approval acts within the minute), every 15
minutes on a schedule (so a PR approved while its checks were still running still
merges, without waiting up to an hour for it), and on demand. It checks out the
default branch rather than the PR's version of the script, so a pull request
cannot rewrite the policy that admits it.

## L2. Daily Routine

The procedure is the `dep-triage` skill (`.agent/skills/dep-triage/SKILL.md`), run
by a scheduled routine at 09:00 JST. It covers this repository, and
`vspo-lab/config` (which holds the shared Renovate presets) when the run can
reach it; a run that cannot says so and skips it rather than guessing. Keeping
the procedure in the repository means it is reviewed through pull requests and
can also be run by hand with `/dep-triage`.

Steps: collect open dependency PRs, repair red CI, triage security findings, prune
stale `pnpm.overrides` pins, refresh the release PR, and post one summary comment
per run on the `dep-triage run log` issue (#1151), so every run is auditable
without opening the routine's session.

Repairs are capped at two attempts per PR. Anything the routine may not decide
(a `major`, a `high-risk` update, a failure that needs an application change, a
third repair attempt) is escalated once: an English comment on the PR with the
reproduced failure, the release-notes assessment and the decision required, plus
the label `awaiting-maintainer-review`. The label is for a person; the merge gate
does not read it.

After a repair push Renovate stops rebasing the branch, so the routine keeps it
mergeable itself: it waits for the checks on the new head and approves in the
same run when the diff against `develop` is still only manifests plus lockfile,
and merges `develop` in when the branch falls behind. Leaving a repaired PR to
the next day is what left #1138 and #1148 green and unmerged.

### Permission boundary

The routine may approve a dependency PR whose diff it has read and found sound,
re-run failed jobs when the log names an external cause, push repair commits to
`renovate/**`, edit `.trivyignore.yaml`, `pnpm.overrides` and the security
ledger, and create or update the release PR.

It may not merge anything, or edit labels to change a gate's outcome. Merging
belongs to `dep-auto-merge.yaml`.

Approval is bounded rather than open: never a `major`, never anything labelled
`high-risk`, and never, in the same run, a repair that changed application
source, tests or config, since a diff the routine wrote is not a diff it
reviewed. A merge of `develop` or a lockfile regeneration leaves Renovate's diff
intact and may be approved once its checks are green. The full conditions are in
`.agent/skills/dep-triage/SKILL.md`, which is the operative text; this is a
summary of it.

### Rollout

The routine ran in `report` mode from 2026-08-14, and in `apply` mode from
2026-08-28. Reverting the approval step alone is enough to put it back: the merge
criterion does not change, only who supplies the approval.

## References

- [Dependency Security Policy](../security/dependency-policy.md) - triage rules, reachability criteria, decision ledger
- [Infrastructure CI/CD](./ci-cd.md) - workflow reference
