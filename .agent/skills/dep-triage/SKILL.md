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
  is not a dependency PR: escalate it
- The version movement matches what the title claims, and the lockfile moves
  with the manifest rather than lagging behind it
- The release notes carry no breaking change relevant to how the package is used
  here. For a major, or anything with a migration note, escalate
- Every check is green. A check that is absent or pending is not a pass

Write what you checked and what you concluded into the review body, so the
approval carries its own reasoning. Say plainly that Claude Code produced it on
the maintainer's behalf; an approval must never read as if a person reviewed the
diff by hand.

### What you do not approve

- Anything labelled `major` or `high-risk`. Those change behaviour by
  definition. Report them and let the maintainer decide
- Anything you repaired in this same run. A diff you wrote is not a diff you
  reviewed independently
- Anything you do not understand. A green check suite is a necessary condition,
  never a sufficient one, and never a substitute for reading the change

### Reading the evaluator

- An approval on a superseded commit is stale. The approver never saw what would
  actually be merged, so it does not count
- `CHANGES_REQUESTED` blocks the merge regardless of other approvals
- A check that is absent, pending or skipped is not a pass

If a check fails identically on the base branch, that is a base-branch defect.
Escalate it; it is not a licence to merge past a red check.

Everything left unapproved is reported in Step 6 with the reason, so the
maintainer sees exactly what is waiting and why.

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
`config`, before pushing. Do not wait for CI afterwards: the PR is re-evaluated
against Step 2a on the next run, once the checks have settled.

Cap repairs at **two attempts per PR**. On a third failure, stop, label the PR
`needs-human`, and escalate.

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

Post one summary comment for the whole run covering merged, repaired, escalated,
suppressed, and awaiting-human items. One comment per run, never one per PR.

# Permission Boundary

Allowed:

- Approve a dependency PR you have read and found sound, within the limits set
  out in Step 2a
- Re-run failed jobs when the log shows the failure was environmental
- Push repair commits to `renovate/**` branches
- Edit `.trivyignore.yaml`, `pnpm.overrides`, `docs/security/dependency-policy.md`
- Create or update the `develop -> main` PR, open issues, comment

Never:

- Merge any pull request. That is the workflow's job, not yours
- Approve without reading the diff, or approve a PR you repaired in this run
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
