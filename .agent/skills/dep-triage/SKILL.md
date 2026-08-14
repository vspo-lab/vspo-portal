---
name: Dependency Triage
description: Daily triage of Renovate dependency PRs. Repairs failing CI, triages security findings, prunes stale pins, and refreshes the develop -> main release PR. Used by the scheduled routine and for manual runs.
user_invocable: true
---

# Overview

Handles the dependency updates that automation cannot decide on its own. Grouping,
cooldown and merging are already handled by `renovate.json` and GitHub auto-merge;
this skill covers only the exceptions: failures, security findings, and the release
PR summary.

# Modes

The invocation states the mode. Default to `report` when it is not given.

| Mode | Behaviour |
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
green, red, stale-conflicted, or awaiting cooldown. Green PRs need no action:
`platformAutomerge` merges them on GitHub's own schedule.

## Step 2: Repair failures

For each red PR, find the first failing check and classify the cause:

| Cause | Repair |
|-------|--------|
| Biome lint or format | `pnpm biome check --fix --unsafe` then `pnpm biome format --write .` |
| TypeScript error | Update call sites for changed signatures. Type-level only, no behaviour change |
| Knip unused export | Remove the unused export, or update `knip.json` when the dependency is genuinely required at runtime |
| Test failure caused by intended library behaviour change | Update the test to the new correct behaviour |
| Test failure indicating a real regression | Do not repair. Close the PR, open an issue, escalate |
| Build or bundle failure | Investigate. Escalate if an application change is required |
| Trivy or OSV finding | Apply the decision tree in Step 3 |
| Conflict with `develop` | Request a Renovate rebase, or rebase directly if Renovate has released the branch |

Verify locally with `./scripts/post-edit-check.sh` before pushing. Do not wait for
CI afterwards: auto-merge takes over once the checks turn green.

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

- Push repair commits to `renovate/**` branches
- Merge dependency PRs into `develop` once every check is green
- Edit `.trivyignore.yaml`, `pnpm.overrides`, `docs/security/dependency-policy.md`
- Create or update the `develop -> main` PR, open issues, comment

Never:

- Merge into `main`
- Merge while any required check is failing, pending, or absent
- Merge a PR labelled `major` or `high-risk`
- Edit files under `.github/workflows/`
- Change application source beyond what the upgrade requires
- Widen a suppression to a whole package or path instead of a specific advisory

# Rules

- An absent check is not a passing check. If a PR shows no checks at all, treat it
  as red and investigate why the trigger did not fire
- Never disable or weaken a check to make a PR green
- Every push must leave the PR in a consistent state; revert rather than leaving a
  partial repair
- In `report` mode, describe the action that would be taken instead of taking it

# Reference Documents

- `docs/security/dependency-policy.md` - triage rules, reachability criteria, decision ledger
- `docs/infra/dependency-auto-flow.md` - the flow this skill runs inside
- `docs/infra/ci-cd.md` - workflow reference
