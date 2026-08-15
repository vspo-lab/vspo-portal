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
and cooldown are handled by `renovate.json`; merging is not. Renovate has
`automerge` disabled everywhere, so this skill is the only automated merger, and it
merges strictly the classes whose effect on product behavior is nil. Everything
else it repairs, triages, or hands to a human.

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

Renovate never merges anything: `automerge` is off everywhere. This skill is the
only automated merger, and it merges only what Step 2a proves safe.

## Step 2a: Decide what may be merged

Two gates, and a PR needs **one of them**, plus green checks in every case. If
neither gate is open, leave the PR alone and report it; never merge on a
judgement call of your own.

### Gate A - a human approved it

An approving review from someone with write access is the human saying "this is
fine to merge". Take it at face value and merge, whatever the change contains,
once the checks are green.

- The approval must be on the **current head commit**. If the PR was pushed to
  after the approval, the approval is stale and Gate A is closed
- `CHANGES_REQUESTED` from anyone closes Gate A regardless of other approvals
- An approval is not a licence to merge past a failing check. Green checks are
  required under both gates

### Gate B - the change cannot affect product behavior

For updates nobody needs to look at. Renovate labels the qualifying classes
`no-runtime-impact`:

| Class | Why behavior cannot change |
|-------|------------------------------|
| `@types/**` | Type declarations are erased at compile time; nothing reaches the bundle |
| GitHub Actions | CI configuration only, never part of a deployed artifact |
| Lint, format and docs tooling | Runs in CI only and emits no shipped code |
| Test tooling | Never imported by production code |

Everything else is out of scope for automated merging, including production
dependencies at any level, build-chain tooling (`typescript`, `tsup`, `wrangler`,
`@opennextjs/cloudflare`, Storybook, Vite, Astro), and lockfile-only transitive
bumps, because each of those can change emitted output.

**The label alone is not sufficient**, for a concrete reason. Renovate applies
`addLabels` per matching rule, but a label lands on the whole PR. A single PR can
span more than one manager, so a rule matching one part of it can put
`no-runtime-impact` on a PR whose other half is not covered by that rule at all.

This has already happened: a pnpm version bump matched the `github-actions` rule
and arrived labelled `no-runtime-impact`, while also editing
`.github/actions/setup-pnpm/action.yml`, a deploy workflow, and `package.json`.
Nothing about that change is free of build impact.

So Gate B opens only when **all** of these hold:

- The `no-runtime-impact` label is present
- The PR carries neither `major` nor `high-risk`
- The diff touches only `package.json`, `pnpm-lock.yaml` and `pnpm-workspace.yaml`.
  Anything under `.github/`, any source file, any config file closes the gate

Check the diff yourself; do not take the label's word for it.

### Required under both gates

- Every required check has run and passed. A check that is absent, pending or
  skipped is not a pass
- Under Gate B only: the diff restrictions above hold, and `bundle-size` reports
  no delta for anything that could reach the bundle

`scripts/dep-triage-report.py` evaluates both gates against the live API and
prints the decision per PR. Run it rather than judging by eye, and treat its
output as the answer. It exists so the gates are machine-checked instead of
re-derived from prose on every run.

If a check fails identically on the base branch, that is a base-branch defect.
Escalate it; it is not a licence to merge past a red check.

Everything left unmerged is reported in Step 6 with the reason, so a human sees
exactly what is waiting and why.

## Step 2: Repair failures

For each red PR, find the first failing check and classify the cause:

| Cause | Repair |
|-------|--------|
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

- Push repair commits to `renovate/**` branches
- Merge dependency PRs into `develop` that satisfy Step 2a, by approval or by class
- Edit `.trivyignore.yaml`, `pnpm.overrides`, `docs/security/dependency-policy.md`
- Create or update the `develop -> main` PR, open issues, comment

Never:

- Merge into `main`
- Merge while any required check is failing, pending, or absent
- Merge an unapproved PR lacking the `no-runtime-impact` label, however safe it looks
- Add the `no-runtime-impact` label to a PR in order to merge it
- Approve a PR yourself, or treat your own review as satisfying Gate A. The
  approval must come from a human
- Treat an approval on a superseded commit as current
- Merge a PR labelled `major` or `high-risk`
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
