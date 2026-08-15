#!/usr/bin/env python3
"""Evaluate the dep-triage merge gates against open pull requests.

Preconditions:
    - The repository is public, or GITHUB_TOKEN is set in the environment.
      Reads only; nothing is written to GitHub.
Postconditions:
    - Prints one block per open pull request with the gate evaluation and the
      resulting decision, then a one-line verdict. Exit 0 when every PR was
      evaluated, 1 when any API call failed.
Idempotency:
    - Pure read. Running it twice against unchanged state prints the same thing.

Why this exists: the merge gates are policy, and policy re-derived from prose on
every run drifts. This makes the decision reproducible and reviewable, and it is
the mechanism that caught `no-runtime-impact` leaking onto a PR that also edited
workflow files.

Usage:
    python3 scripts/dep-triage-report.py [owner/repo ...]
"""

import json
import os
import sys
import urllib.error
import urllib.request

DEFAULT_REPOS = ["vspo-lab/vspo-portal", "vspo-lab/config"]

NO_IMPACT = "no-runtime-impact"
BLOCKING_LABELS = ("major", "high-risk")

# Gate B requires the diff to stay inside the dependency manifests. Anything
# under .github/, any source file and any config file closes the gate, because
# those can change what is built or how it is built.
GATE_B_PATHS = ("package.json", "pnpm-lock.yaml", "pnpm-workspace.yaml")

# A check in one of these states has produced no evidence, so it is not a pass.
PASSING_CONCLUSIONS = ("success", "skipped", "neutral")


def api(repo: str, path: str):
    """Fetch a GitHub REST endpoint, returning parsed JSON."""
    req = urllib.request.Request(f"https://api.github.com/repos/{repo}{path}")
    token = os.environ.get("GITHUB_TOKEN")
    if token:
        req.add_header("Authorization", f"Bearer {token}")
    with urllib.request.urlopen(req) as response:
        return json.load(response)


def evaluate(repo: str, pr: dict) -> dict:
    """Apply both merge gates to a single pull request."""
    number = pr["number"]
    head = pr["head"]["sha"]
    labels = [label["name"] for label in pr["labels"]]

    files = [f["filename"] for f in api(repo, f"/pulls/{number}/files?per_page=100")]
    manifest_only = bool(files) and all(f.endswith(GATE_B_PATHS) for f in files)

    reviews = api(repo, f"/pulls/{number}/reviews?per_page=100")
    # An approval on a superseded commit is stale and does not count.
    approvals = [
        r for r in reviews if r["state"] == "APPROVED" and r.get("commit_id") == head
    ]
    changes_requested = [r for r in reviews if r["state"] == "CHANGES_REQUESTED"]

    runs = api(repo, f"/commits/{head}/check-runs")["check_runs"]
    pending = [c["name"] for c in runs if c["status"] != "completed"]
    failed = [
        c["name"]
        for c in runs
        if c["status"] == "completed" and c["conclusion"] not in PASSING_CONCLUSIONS
    ]
    green = bool(runs) and not pending and not failed

    blocked_by = [label for label in labels if label in BLOCKING_LABELS]
    gate_a = bool(approvals) and not changes_requested
    gate_b = NO_IMPACT in labels and not blocked_by and manifest_only

    if not green:
        detail = []
        if failed:
            detail.append(f"failed: {', '.join(failed)}")
        if pending:
            detail.append(f"pending: {', '.join(pending)}")
        if not runs:
            detail.append("no checks ran at all")
        decision, why = "HOLD", "checks not green (" + "; ".join(detail) + ")"
    elif gate_a:
        decision, why = "MERGE", "Gate A: approved on the current head commit"
    elif gate_b:
        decision, why = "MERGE", "Gate B: no-runtime-impact, manifests only"
    elif NO_IMPACT not in labels:
        decision, why = "HOLD", "no gate open: not approved, and not labelled no-runtime-impact"
    elif blocked_by:
        decision, why = "HOLD", f"labelled {NO_IMPACT} but also {'/'.join(blocked_by)}"
    else:
        outside = [f for f in files if not f.endswith(GATE_B_PATHS)]
        decision, why = "HOLD", f"labelled {NO_IMPACT} but the diff touches {', '.join(outside[:3])}"

    return {
        "repo": repo,
        "number": number,
        "title": pr["title"],
        "base": pr["base"]["ref"],
        "labels": labels,
        "files": files,
        "checks": (len(runs), len(failed), len(pending)),
        "gate_a": gate_a,
        "gate_b": gate_b,
        "decision": decision,
        "why": why,
    }


def main() -> int:
    repos = sys.argv[1:] or DEFAULT_REPOS
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

    for r in sorted(results, key=lambda r: (r["repo"], -r["number"])):
        total, failed, pending = r["checks"]
        print(f"{r['repo']}#{r['number']}  base={r['base']}")
        print(f"    {r['title'][:78]}")
        print(f"    labels : {', '.join(r['labels']) or '-'}")
        print(f"    files  : {len(r['files'])} ({'manifests only' if all(f.endswith(GATE_B_PATHS) for f in r['files']) else 'touches more than manifests'})")
        print(f"    checks : {total} total, {failed} failed, {pending} pending")
        print(f"    gates  : A={r['gate_a']}  B={r['gate_b']}")
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
