#!/usr/bin/env python3
"""Decide which open pull requests may be merged automatically.

A pull request qualifies when its current head commit is approved and every
required check has passed. Nothing else qualifies. The approval comes from the
maintainer, or from the daily dep-triage run acting on their behalf within the
limits in .agent/skills/dep-triage/SKILL.md.

Preconditions:
    - The repository is public, or GITHUB_TOKEN is set in the environment.
      Reads only; nothing is written to GitHub.
    - SELF_CHECK_SUITE_ID, when the caller is itself a check on the commits being
      evaluated, holds that caller's check suite id. Omitting it is safe only for
      a caller that registers no check of its own: a caller that does register one
      and omits this will find every pull request held, because the gate counts
      its own in-progress check and waits for itself.
Postconditions:
    - Prints one block per open pull request with the decision and its reason,
      then a one-line verdict. Exit 0 when every PR was evaluated, 1 when any
      API call failed.
Idempotency:
    - Pure read. Running it twice against unchanged state prints the same thing.

This script never writes to GitHub. It only decides. Acting on its decisions is
the caller's job: `.github/workflows/dep-auto-merge.yaml` consumes `--json` and
performs the merges with a token, so the policy and the action that applies it
stay separable and separately reviewable.

Usage:
    python3 scripts/dep-triage-report.py [owner/repo ...]
    python3 scripts/dep-triage-report.py --json [owner/repo ...]

Environment:
    GITHUB_TOKEN          Authenticates the reads. Optional for a public repo.
    SELF_CHECK_SUITE_ID   Check suite to ignore; see Preconditions.
"""

import json
import os
import sys
import urllib.error
import urllib.request

DEFAULT_REPOS = ["vspo-lab/vspo-portal", "vspo-lab/config"]

# Conclusions that count as passing. `skipped` and `neutral` belong here: the
# path filters in pr-check.yaml deliberately skip jobs a given diff cannot affect,
# and lighthouse is skipped for `dependencies` PRs on purpose, so treating a skip
# as a failure would hold every pull request this gate exists to merge. A check in
# any other completed state has produced no evidence of a pass and blocks. So does
# a check still running, and so does a commit with no checks at all.
PASSING_CONCLUSIONS = ("success", "skipped", "neutral")

# The workflow that runs this script registers its own check run against the head
# commit of the pull request under review, and that check is necessarily still in
# progress while this script decides. Counting it makes the gate wait for itself:
# every PR is held as "not green" and nothing ever merges.
#
# The caller passes the id of its own check suite so those checks can be skipped.
# Matching on the suite rather than on a job name keeps the two files from having
# to agree about a string. Unset means no suite to skip, which is right for a
# local run: it creates no check of its own.
SELF_CHECK_SUITE_ID = os.environ.get("SELF_CHECK_SUITE_ID") or None


def api(repo: str, path: str):
    """Fetch a GitHub REST endpoint, returning parsed JSON."""
    req = urllib.request.Request(f"https://api.github.com/repos/{repo}{path}")
    token = os.environ.get("GITHUB_TOKEN")
    if token:
        req.add_header("Authorization", f"Bearer {token}")
    with urllib.request.urlopen(req) as response:
        return json.load(response)


def evaluate(repo: str, pr: dict) -> dict:
    """Decide whether one pull request may be merged."""
    number = pr["number"]
    head = pr["head"]["sha"]

    reviews = api(repo, f"/pulls/{number}/reviews?per_page=100")
    # An approval on a superseded commit is stale: the approver never saw what
    # would actually be merged.
    approvals = [
        r for r in reviews if r["state"] == "APPROVED" and r.get("commit_id") == head
    ]
    changes_requested = [r for r in reviews if r["state"] == "CHANGES_REQUESTED"]

    runs = [
        c
        for c in api(repo, f"/commits/{head}/check-runs")["check_runs"]
        if str(c.get("check_suite", {}).get("id")) != SELF_CHECK_SUITE_ID
    ]
    pending = [c["name"] for c in runs if c["status"] != "completed"]
    failed = [
        c["name"]
        for c in runs
        if c["status"] == "completed" and c["conclusion"] not in PASSING_CONCLUSIONS
    ]
    green = bool(runs) and not pending and not failed

    if not green:
        detail = []
        if failed:
            detail.append(f"failed: {', '.join(failed)}")
        if pending:
            detail.append(f"pending: {', '.join(pending)}")
        if not runs:
            detail.append("no checks ran at all")
        decision, why = "HOLD", "checks not green (" + "; ".join(detail) + ")"
    elif changes_requested:
        decision, why = "HOLD", "changes requested"
    elif approvals:
        approver = approvals[0]["user"]["login"]
        decision, why = "MERGE", f"approved by {approver} on the current head commit"
    else:
        stale = [r for r in reviews if r["state"] == "APPROVED"]
        why = "not approved"
        if stale:
            why = "the only approval is on a superseded commit"
        decision = "HOLD"

    return {
        "repo": repo,
        "number": number,
        "title": pr["title"],
        "base": pr["base"]["ref"],
        "labels": [label["name"] for label in pr["labels"]],
        "checks": (len(runs), len(failed), len(pending)),
        "decision": decision,
        "why": why,
    }


def main() -> int:
    args = sys.argv[1:]
    as_json = "--json" in args
    repos = [a for a in args if not a.startswith("--")] or DEFAULT_REPOS
    results, failures = [], []

    for repo in repos:
        try:
            pulls = api(repo, "/pulls?state=open&per_page=50")
        except urllib.error.URLError as exc:
            failures.append(f"{repo}: {exc}")
            continue
        for pr in pulls:
            try:
                results.append(evaluate(repo, pr))
            except urllib.error.URLError as exc:
                failures.append(f"{repo}#{pr['number']}: {exc}")

    if as_json:
        # Emit only what the merge step needs to act, so a change to the human
        # readable output cannot alter what gets merged.
        print(json.dumps([
            {"repo": r["repo"], "number": r["number"], "decision": r["decision"],
             "why": r["why"], "title": r["title"], "base": r["base"]}
            for r in results
        ]))
        for f in failures:
            print(f"ERROR {f}", file=sys.stderr)
        return 1 if failures else 0

    for r in sorted(results, key=lambda r: (r["repo"], -r["number"])):
        total, failed, pending = r["checks"]
        print(f"{r['repo']}#{r['number']}  base={r['base']}")
        print(f"    {r['title'][:78]}")
        print(f"    labels : {', '.join(r['labels']) or '-'}")
        print(f"    checks : {total} total, {failed} failed, {pending} pending")
        print(f"    => {r['decision']}: {r['why']}")
        # Reaching main directly skips develop, and merging there deploys.
        if r["base"] == "main" and r["repo"].endswith("vspo-portal"):
            print("    !! base is main: this bypasses develop and deploys on merge")
        print()

    merge = sum(1 for r in results if r["decision"] == "MERGE")
    hold = sum(1 for r in results if r["decision"] == "HOLD")
    print(f"verdict: {merge} would merge, {hold} held, {len(results)} evaluated")

    for f in failures:
        print(f"ERROR {f}", file=sys.stderr)
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
