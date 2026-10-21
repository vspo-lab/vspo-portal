---
name: Dependency Triage
description: Daily triage of Renovate dependency PRs. Repairs failing CI, triages security findings, prunes stale pins, and refreshes the develop -> main release PR. Used by the scheduled routine and for manual runs.
user_invocable: true
---

# Overview

Covers two repositories:

| Repository | What it holds |
|------------|---------------|
| `vspo-lab/vspo-portal` | The application. Full check suite |
| `vspo-lab/config` | Shared Renovate presets. Validated by `validate-config.yml` |

Handles the dependency updates that automation cannot decide on its own. Grouping
and cooldown are handled by `renovate.json`. Merging is handled by
`dep-auto-merge.yaml`, which merges a PR once it is approved and the checks are
green. This skill is what supplies that approval: it reads each diff, approves
the ones that are sound, repairs what is red, triages security findings, and
reports what is waiting.

# Modes

The invocation states the mode. Default to `report` when it is not given.

| Mode | Behavior |
|------|-----------|
| `report` | Perform the full analysis and post the summary. Push nothing, merge nothing, create no issues |
| `apply` | Perform the analysis and carry out the actions within the permission boundary below |

# Trigger Conditions

- The daily routine fires (09:00 JST)
- A dependency PR is red and needs repair
- A new Trivy, OSV, or CodeQL finding needs a decision
- The `develop -> main` release PR needs a refreshed summary

# Execution Steps

## Step 1: Collect

List open PRs labelled `dependencies` with their check status. Classify each as
green, red, stale-conflicted, or awaiting cooldown.

Renovate never merges anything: `automerge` is off everywhere. Merges are performed
by `dep-auto-merge.yaml`, on approved and green PRs only.

## Step 2a: Review and approve

The rule is one line: **a pull request merges when its current head commit is
approved and every required check has passed.**

**You approve; you do not merge.** `.github/workflows/dep-auto-merge.yaml`
performs the merge by executing the output of `scripts/dep-triage-report.py`.
Run the evaluator to see the current state, approve what deserves it, and leave
the merging to the workflow.

There is deliberately no second path. An earlier design added one for changes
whose class "cannot affect the product", and it cost more than it was worth: it
collided with `CODEOWNERS`, collided again with the branch protection approval
requirement, and admitted a PR that edited deploy workflows because Renovate
applies labels per rule while the label lands on the whole PR. Reviewing is
cheap; a second gate that merges without anyone looking was not.

### What approving requires

Read the diff. An approval states that you read the change and found nothing
wrong, so it has to be true. For each PR:

- Every changed file is a manifest, a lockfile, or a config the update needs. A
  dependency PR that touches application source, a workflow, or a deploy config
  is not a dependency PR: escalate it. The one exception is a digest-pin PR,
  below
- The version movement matches what the title claims, and the lockfile moves
  with the manifest rather than lagging behind it
- The release notes carry no breaking change relevant to how the package is used
  here. For a major, or anything with a migration note, escalate
- Every check is green. A check that is absent or pending is not a pass

Write what you checked and what you concluded into the review body, so the
approval carries its own reasoning. Say plainly that Claude Code produced it on
the maintainer's behalf; an approval must never read as if a person reviewed the
diff by hand.

### Digest-pin pull requests

`pinGitHubActionDigests` raises a PR whenever a third-party action publishes, so
this shape recurs forever. It always edits workflows, which the rule above would
otherwise send to a human every time.

Approve one only when **all** of these hold, checked against the diff rather than
the title:

- Every changed file is under `.github/`
- Every changed line is a `uses:` line
- Each one only replaces a tag with a `@<40-hex-sha> # <tag>`, or moves an
  existing digest, and the trailing comment names the **same** tag as before
- No `with:`, `env:`, `run:`, `if:` or input value changes anywhere in the diff
- No version moves. `@v5` to `@<sha> # v5` is a pin; `@v5` to `@<sha> # v6` is an
  upgrade wearing a pin's clothes, and goes to a human

Fail any one of them and the PR is not a digest pin: escalate it whole, do not
approve the part that qualifies. This carve-out is deliberately mechanical
because #1122 was the opposite case -- a pnpm bump that also edited
`setup-pnpm/action.yml` and a deploy workflow, and changed versions while doing
it. The version-move condition is what separates the two.

### What you do not approve

- Anything labelled `major` or `high-risk`. `high-risk` marks a major of a core
  framework, so both mean the same thing: behaviour can change. Escalate them
  (below) so the maintainer decides with the release notes in front of them
- A repair that touched anything beyond a manifest or the lockfile, in the run
  that wrote it. A merge of `develop`, a lockfile regeneration or a re-run leaves
  the PR's diff against `develop` exactly what Renovate proposed, so review that
  diff (`git diff origin/develop...HEAD --stat` must list only manifests and
  `pnpm-lock.yaml`) and approve in the same run once the checks on the new head
  are green. A repair that changed application source, tests or config waits
  for the next run, which reviews it fresh
- Anything you do not understand. A green check suite is a necessary condition,
  never a sufficient one, and never a substitute for reading the change

### Reading the evaluator

- An approval on a superseded commit is stale. The approver never saw what would
  actually be merged, so it does not count
- `CHANGES_REQUESTED` blocks the merge regardless of other approvals
- A check that is absent or still pending is not a pass
- `skipped` and `neutral` do count as passing, because the path filters in
  `pr-check.yaml` skip jobs a given diff cannot affect and `lighthouse` is
  skipped for `dependencies` PRs deliberately. A PR showing *no* checks at all is
  still red: that means the trigger never fired, which is a different problem

If a check fails identically on the base branch, that is a base-branch defect.
Escalate it; it is not a licence to merge past a red check.

### After approving

Approval alone does not merge. `dep-auto-merge.yaml` runs on the review event
and every 15 minutes, but do not leave the outcome to the schedule: dispatch the
workflow (`workflow_dispatch` on `dep-auto-merge.yaml`, ref `develop`), wait for
the run to finish, then re-run the evaluator and confirm the PR is gone or
`MERGE`. A PR that is approved, green and still open at the end of the run is a
finding to report, not a normal state.

Everything left unapproved is either escalated (below) or reported in Step 6
with the reason, so the maintainer sees exactly what is waiting and why.

### Escalating to the maintainer

Some PRs are not yours to decide: a `major`, anything labelled `high-risk`, a
failure that needs an application change, or a third repair attempt. Do not
leave those as a line in the report. Escalate each one exactly once:

- Post **one comment on the PR, in English**, stating: which check fails and
  the reproduced error, what you tried, the release-notes assessment (breaking
  changes relevant to how the package is used here, quoted, not paraphrased into
  "may have changes"), the security context if the PR is a vulnerability fix,
  and the concrete decision the maintainer has to make
- Add the label `awaiting-maintainer-review`. Create it if it is missing
- Do not comment again on later runs while the label is present and the head
  commit is unchanged. A new head (Renovate rebase, a maintainer push) means a
  fresh evaluation: re-run the checks above, and remove the label only when the
  PR has become approvable under Step 2a

The label is a signal to a person, never an input to the merge gate. Nothing in
`scripts/dep-triage-report.py` reads it.

## Step 2: Repair failures

For each red PR, find the first failing check and classify the cause:

| Cause | Repair |
|-------|--------|
| Environmental failure, not caused by the diff | Re-run the failed jobs. See below |
| Biome lint or format | `pnpm biome check --fix --unsafe` then `pnpm biome format --write .` |
| TypeScript error | Update call sites for changed signatures. Type-level only, no behavior change |
| Knip unused export | Remove the unused export, or update `knip.json` when the dependency is genuinely required at runtime |
| Test failure caused by intended library behavior change | Update the test to the new correct behavior |
| Test failure indicating a real regression | Do not repair. Close the PR, open an issue, escalate |
| Build or bundle failure | Investigate. Escalate if an application change is required |
| Trivy or OSV finding | Apply the decision tree in Step 3 |
| Conflict with `develop` | Request a Renovate rebase, or rebase directly if Renovate has released the branch |
| Renovate config validation error (`config`) | Read the validator's `message` field: it names the rule index and the offending key. Fix the rule, then re-validate by exit code |
| Dangling preset reference (`config`) | `scripts/check-preset-references.sh` names the missing preset. Add the file, or drop the reference from the `extends` list |
| A field Renovate removed | Migrate to the replacement. A wildcard cannot be combined with a negation in `matchPackageNames`: express "all except X" as two rules, the later one narrowing the earlier |

### Environmental failures

Some failures are the runner's, not the diff's. `astro build` fetches every
Google Font file it needs over the network, so `bot-dashboard#build` fails with
`[CannotFetchFontFile] ... Caused by: fetch failed` whenever one of those
requests is dropped. That surfaces as a red `knip-check`, which is misleading:
the job runs a build first.

Re-run the failed jobs when, and only when, the log shows a cause outside the
diff: a network fetch, a runner timeout, a registry 5xx, a cancelled job. State
in the report which check failed and what the log said.

An unexplained failure is not environmental. Re-running until something passes
is how a real regression gets merged, so if the log does not name an external
cause, treat it as a genuine failure and diagnose it.

### Reproducing a failure

Before proposing any repair, reproduce the failure the way CI produces it.

- Run the **exact command from the workflow file**, not an approximation of it
- Judge the result by **exit code**. Never conclude "fixed" from grepping the
  output for error strings: a tool can change its wording, print an error the
  grep does not match, or fail for a reason the pattern never anticipated
- Use the **same tool version CI resolves**. A workflow running `npx --package
  renovate` gets the latest release; a stale local cache can be several versions
  behind and miss the very rule that failed
- Reproduce the failure first, then fix it, then confirm the command passes. A
  repair that was never seen failing locally is a guess

This is not hypothetical: an invalid `matchPackageNames` pattern once reached CI
because the local check grepped output instead of using the exit code, and ran
against a cached older Renovate.

Verify locally with `./scripts/post-edit-check.sh` for `vspo-portal`, or
`scripts/check-preset-references.sh` plus `renovate-config-validator` for
`config`, before pushing. Then wait for the checks on the new head and finish
Step 2a in the same run, as described under "After a repair push" below.

Cap repairs at **two attempts per PR**. On a third failure, stop and escalate as
described in Step 2a: one comment, and the label `awaiting-maintainer-review`.

### After a repair push

The first commit from a non-Renovate author makes Renovate stop rebasing the
branch ("Edited/Blocked"). From then on the branch is yours to keep mergeable:

- Wait for the checks on the new head to finish (poll the check runs, up to 20
  minutes) and continue with Step 2a in the **same run**. A repaired PR left for
  the next day sits green and unmerged while `develop` moves on, which is how
  #1138 and #1148 stalled
- When the branch falls behind `develop` and a check depends on state that
  `develop` has since fixed, merge `develop` into the branch. Never rebase or
  force-push a Renovate branch
- If the repair leaves the diff against `develop` wider than manifests plus
  lockfile, say so in the report; the next run reviews it

## Step 3: Security triage

For each new finding, choose exactly one outcome. Never leave a finding open.

```text
Is a fixed version available?
  Yes -> direct dependency?  Yes -> bump it                   -> [FIX]
                             No  -> add a pnpm.overrides entry -> [FIX]
  No  -> reachable in production?
           Yes -> open an issue, label security                -> [ESCALATE]
           No  -> .trivyignore.yaml with statement +
                  expired_at (max 90 days)                     -> [SUPPRESS]

Fix requires a major upgrade or an API change -> [ESCALATE]
```

A finding is **not reachable** only when one of these holds, and the reason goes
into `statement`:

- The package is build-time or test-time only and does not ship in the Workers bundle
- The vulnerable API is called nowhere in the repository, verified by search
- The vulnerable path requires input the application never supplies

Anything reaching the Workers runtime with request-derived input is reachable, and
`[SUPPRESS]` is not available.

Also review `.trivyignore.yaml` entries expiring within 14 days. Never renew the
same entry twice in a row: escalate instead.

Append every `[SUPPRESS]` and `[ESCALATE]` to `docs/security/dependency-policy.md`.

## Step 4: Prune stale pins

Check whether any `pnpm.overrides` entry is already satisfied without the override.
Remove those that are, in a separate PR, verified with `pnpm tsc` and both test
suites. Never bundle a prune with a repair.

## Step 5: Refresh the release PR

Ensure the `develop -> main` PR exists and its body matches the current
`main..develop` range. `scripts/release-pr-body.sh` generates the body; run it
rather than writing one by hand.

## Step 6: Report

Post one summary comment for the whole run on the run-log issue
(`dep-triage run log`, vspo-lab/vspo-portal#1151). If it has been closed, an
`apply` run recreates it with that title; a `report` run creates no issues, so
it comments on the closed issue when that is possible and otherwise states in
its output that an `apply` run must recreate the log. Cover: which GitHub tools the run had, approved (with the
one-line reason), merged, repaired or re-run, escalated (PR link plus reason),
security findings and their outcome, and anything the maintainer must do. One
comment per run, never one per PR, and never edit an earlier run's comment. A
run with nothing to do posts one sentence.

# Permission Boundary

Allowed:

- Approve a dependency PR you have read and found sound, within the limits set
  out in Step 2a
- Approve a digest-pin PR that meets every condition in Step 2a. This is the only
  case where approving a diff that touches `.github/` is allowed
- Re-run failed jobs when the log shows the failure was environmental
- Push repair commits to `renovate/**` branches
- Edit `.trivyignore.yaml`, `pnpm.overrides`, `docs/security/dependency-policy.md`
- Create or update the `develop -> main` PR, open issues, comment
- Add or remove `awaiting-maintainer-review`, and post the escalation comment
  that goes with it
- Dispatch `dep-auto-merge.yaml` after approving, so the merge happens in this
  run rather than on the next schedule tick

Never:

- Merge any pull request directly. That is the workflow's job, not yours; you
  may only dispatch it
- Approve without reading the diff, or approve, in the same run, a repair that
  changed anything beyond manifests and `pnpm-lock.yaml`
- Approve anything labelled `major` or `high-risk`
- Re-run a failed job without first reading the log and establishing an external
  cause
- Edit `scripts/dep-triage-report.py` to make a specific PR mergeable. Change it
  only to fix a policy defect, in its own PR, explaining the defect
- Edit files under `.github/workflows/`
- Change application source beyond what the upgrade requires
- Widen a suppression to a whole package or path instead of a specific advisory

# Rules

- An absent check is not a passing check. If a PR shows no checks at all, treat it
  as red and investigate why the trigger did not fire
- Never disable or weaken a check to make a PR green
- A local verification that is weaker than CI is worse than none, because it
  produces confident wrong answers. Match the command, the version and the exit
  code, or state plainly that the failure was not reproduced locally
- Every push must leave the PR in a consistent state; revert rather than leaving a
  partial repair
- In `report` mode, describe the action that would be taken instead of taking it

# Reference Documents

- `docs/security/dependency-policy.md` - triage rules, reachability criteria, decision ledger
- `docs/infra/dependency-auto-flow.md` - the flow this skill runs inside
- `docs/infra/ci-cd.md` - workflow reference
