# CI / Documentation / Lint Infrastructure Design

**Date**: 2026-03-21
**Status**: Approved
**Scope**: Infrastructure only (no test implementation)
**Reference**: https://github.com/sugar-cat7/unified-live

## Goals

Bring vspo-portal's CI, linting, and documentation infrastructure to OSS-grade quality, inspired by unified-live's patterns. Test implementation (Vitest + test code) is explicitly out of scope and will be built on this foundation later.

## Out of Scope

- Test implementation (Vitest setup + test code)
- Documentation site generation (Starlight etc.)
- Terraform CI (tfaction)
- Deploy preview for PRs

---

## 1. CI Workflow Improvements

### 1-1. Security Scan CI (New)

**File**: `.github/workflows/security-scan.yaml`
**Triggers**: PR, push to main/develop, weekly schedule (Monday 00:00 UTC)
**Config files**: `.github/codeql/codeql-config.yml`, `.gitleaks.toml` (created together with this workflow)

Three parallel jobs:

| Job | Tool | Purpose |
|-----|------|---------|
| CodeQL | `github/codeql-action` | JS/TS SAST (exclude test/script files via `.github/codeql/codeql-config.yml`) |
| Trivy | `aquasecurity/trivy-action` | Dependency vulnerability scan (CRITICAL/HIGH severity), uses existing `.trivyignore` |
| gitleaks | `gitleaks/gitleaks-action` | Secret detection in git history, config at `.gitleaks.toml` |

**Relationship with existing `scripts/security-scan.sh`**: The local script runs Trivy, gitleaks, and Semgrep. The CI workflow uses CodeQL instead of Semgrep (CodeQL is GitHub-native and free for public repos, avoiding Docker dependency). The local script is kept as-is for developer use. Both tools coexist: CodeQL for CI, Semgrep for local deep analysis.

### 1-2. Lighthouse CI (New)

**File**: `.github/workflows/lighthouse.yaml`
**Trigger**: PR (paths: `service/vspo-schedule/v2/web/**`, `packages/**`)
**Config**: `lighthouserc.json` at repo root

**Note**: The web app deploys to Cloudflare Workers via `@opennextjs/cloudflare`, but Lighthouse CI runs against `next build` + `next start` (standard Node.js server). This tests the HTML/CSS/JS output quality (performance, accessibility, SEO) rather than Cloudflare-specific runtime behavior. If deploy previews are introduced in the future, Lighthouse can be pointed at the preview URL instead.

Process:
1. Setup pnpm + install deps (install-only, no full monorepo build — see section 1-5)
2. Build only the web app: `pnpm --filter @vspo-lab/web build`
3. Run `@lhci/cli` with `startServerCommand: "npx next start"` and `url` targeting key pages
4. Post results as PR comment via `treosh/lighthouse-ci-action`

Performance budgets:
- Performance: 0.8
- Accessibility: 0.9
- Best Practices: 0.9
- SEO: 0.9

### 1-3. pr-check.yaml Improvements

Current issues to fix:
- **Dead code**: `changes` job produces `web` output but no downstream job consumes it
- **Missing trigger**: bot-dashboard path changes don't trigger checks
- **No path filtering**: All jobs run regardless of what changed

Changes:
- Add `service/bot-dashboard/**` to trigger paths
- Wire `changes` job outputs to downstream jobs via `needs` + `if` conditions
- Add `markdownlint-check` and `cspell-check` jobs
- Add commented-out `test` job skeleton for future Vitest integration
- Add Codecov upload step (commented out, ready for activation)

### 1-4. Autofix Workflow (New)

**File**: `.github/workflows/autofix.yaml`
**Trigger**: PR (opened, synchronize, reopened) — same-repo PRs only (not forks)

Process:
1. Checkout with `GITHUB_TOKEN` (default token — does NOT trigger recursive workflow runs)
2. Run `biome check --fix --unsafe` + `biome format --write`
3. If files changed, commit using `stefanzweifel/git-auto-commit-action` with message `style: auto-fix lint and format`

**Infinite loop prevention**: Using `GITHUB_TOKEN` (not a PAT) ensures the auto-commit does not trigger another workflow run. The `stefanzweifel/git-auto-commit-action` handles this correctly.

Permissions: `contents: write`

### 1-5. setup-pnpm Composite Action Split

**Problem**: The current `.github/actions/setup-pnpm/action.yml` runs `pnpm install` AND `pnpm build` (full Turborepo build). Lint-only jobs (markdownlint, cspell, textlint) don't need the build step, wasting CI time.

**Solution**: Add a `build` input parameter (default: `true`) to the composite action. When `false`, only `pnpm install` runs. Lint-only jobs set `build: false`.

```yaml
inputs:
  build:
    description: 'Run pnpm build after install'
    required: false
    default: 'true'
```

---

## 2. Lint Expansion

### 2-1. textlint Rule Expansion

Incrementally enable rules from the already-installed `preset-ja-technical-writing`:

**Enable**:
- `no-doubled-joshi` (duplicated particles)
- `no-double-negative-ja` (double negation)
- `no-dropping-the-ra` (ra-nuki words)
- `no-hankaku-kana` (half-width katakana)
- `ja-no-redundant-expression` (redundant expressions)

**Keep disabled**: sentence-length, max-comma, period, mixed-dearu-desumasu (existing conservative choices)

**New packages**:
- `textlint-rule-common-misspellings` — English spelling mistakes

**Dropped**: `textlint-rule-no-dead-link` — Too slow (makes HTTP requests to every link) and causes flaky CI. Use `lychee` as a separate weekly scheduled workflow instead if link checking is desired in the future.

**Cleanup pass**: Enabling new rules may produce violations in existing `docs/**/*.md` (40+ files). An initial `pnpm textlint --fix` pass is included as part of this phase to auto-fix what it can, with manual fixes for the remainder.

**Package.json scripts**:
- `"textlint": "textlint \"README.md\" \"docs/**/*.md\""` (already exists)
- `"textlint:fix": "textlint --fix \"README.md\" \"docs/**/*.md\""` (add)

### 2-2. markdownlint (New)

**Package**: `markdownlint-cli2`
**Config**: `.markdownlint-cli2.jsonc`

Target files: `docs/**/*.md`, `README.md`, `.github/**/*.md`

Key rules:
- Default recommended ruleset
- `MD013` (line length) disabled — incompatible with Japanese text
- `MD033` (inline HTML) relaxed for `<details>`, `<summary>`, `<br>`

CI integration: New `markdownlint-check` job in `pr-check.yaml`
Local: Added to Lefthook pre-commit

**Package.json scripts**:
- `"markdownlint": "markdownlint-cli2 \"docs/**/*.md\" \"README.md\" \".github/**/*.md\""`
- `"markdownlint:fix": "markdownlint-cli2 --fix \"docs/**/*.md\" \"README.md\" \".github/**/*.md\""`

### 2-3. cspell (New)

**Package**: `cspell`
**Config**: `cspell.json`
**Custom dictionary**: `.cspell/project-words.txt`

Project-specific words to register: vspo, vtuber, twitch, twitcasting, cloudflare, wrangler, turborepo, pnpm, biome, knip, lefthook, orval, dayjs, tsup, etc.

Target: `**/*.{ts,tsx,js,jsx,md,json}`
Exclude: node_modules, dist, .next, coverage, lock files, generated files

CI integration: New `cspell-check` job in `pr-check.yaml`

**Package.json scripts**:
- `"cspell": "cspell lint \"**/*.{ts,tsx,js,jsx,md}\""`

### 2-4. Lefthook Expansion

Current hooks: tsc, biome:check, knip (parallel)

Add to pre-commit (parallel):
- `textlint` (staged .md files only via `glob: "*.md"`)
- `markdownlint-cli2` (staged .md files only via `glob: "*.md"`)

cspell is CI-only (too slow for pre-commit).

---

## 3. Documentation & Quality

### 3-1. docs/plan/ Directory

Create the directory referenced in CLAUDE.md for spec-driven development:
- `docs/plan/.gitkeep`
- `docs/plan/README.md` — Brief usage explanation

### 3-2. Codecov Preparation

**File**: `codecov.yml`

Pre-configure for future Vitest integration:
- Project target: 60% (threshold 1%, informational)
- Patch target: 50% (informational)
- Comment layout: condensed

The actual upload step in CI will be commented out until Vitest is introduced.

### 3-3. Bundle Size Tracking (New)

Since vspo-portal is an app (not a library), use `nextjs-bundle-analysis` for automated comparison:

**Tool**: `hashicorp/nextjs-bundle-analysis` GitHub Action
- Produces machine-readable size data from `.next/stats.json`
- Automatically compares against base branch
- Posts sticky PR comment with per-page size diff table

**Workflow**: Integrated into `pr-check.yaml` as a `bundle-size` job
- Trigger: PR (web paths changed)
- Uses `setup-pnpm` with `build: true` (needs full build)
- Runs `nextjs-bundle-analysis` action

**Baseline**: `.github/workflows/bundle-size-main.yaml`
- Trigger: push to main/develop (web paths)
- Builds and saves bundle stats as artifact (90-day retention)

### 3-4. gitleaks Configuration (New)

**File**: `.gitleaks.toml`

Allowlists:
- Test files (`**/*.test.ts`, `**/*.spec.ts`)
- Lock files (`pnpm-lock.yaml`)
- Generated files (`packages/api/src/generated/**`)
- Example env files (`.env.example`, `.env.sample`)

### 3-5. CodeQL Configuration (New)

**File**: `.github/codeql/codeql-config.yml`

Paths to ignore:
- `**/node_modules/**`
- `**/*.test.ts`
- `**/scripts/**`
- `**/dist/**`
- `**/.next/**`

---

## Implementation Phases

### Phase 1: Lint Expansion + docs/plan (Low risk, immediate value)
- docs/plan/ directory creation (trivial, unblocks spec-driven workflow)
- textlint rule expansion + cleanup pass on existing docs
- markdownlint setup + config
- cspell setup + project dictionary
- Lefthook expansion
- Package.json script definitions for all new tools

### Phase 2: CI Workflow New Additions (configs + workflows together)
- setup-pnpm composite action: add `build` input parameter
- gitleaks config (`.gitleaks.toml`) + CodeQL config (`.github/codeql/codeql-config.yml`)
- Security scan workflow (depends on above configs)
- Autofix workflow (uses `GITHUB_TOKEN` + `stefanzweifel/git-auto-commit-action`)
- Lighthouse CI workflow + `lighthouserc.json`
- Bundle size tracking (baseline workflow + PR comparison)

### Phase 3: Existing CI Improvements + Quality
- pr-check.yaml refactor (path filtering via `changes` job, dead code removal, bot-dashboard trigger, new lint jobs)
- Codecov config (`codecov.yml`)
- Commented-out test + coverage upload skeleton in pr-check.yaml
