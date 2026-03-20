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

Three parallel jobs:

| Job | Tool | Purpose |
|-----|------|---------|
| CodeQL | `github/codeql-action` | JS/TS SAST (exclude test/script files via `.github/codeql/codeql-config.yml`) |
| Trivy | `aquasecurity/trivy-action` | Dependency vulnerability scan (CRITICAL/HIGH severity), uses existing `.trivyignore` |
| gitleaks | `gitleaks/gitleaks-action` | Secret detection in git history, config at `.gitleaks.toml` |

### 1-2. Lighthouse CI (New)

**File**: `.github/workflows/lighthouse.yaml`
**Trigger**: PR (paths: `service/vspo-schedule/v2/web/**`, `packages/**`)
**Config**: `lighthouserc.json` at repo root

Process:
1. Setup pnpm + install deps
2. Build Next.js app
3. Run `@lhci/cli` against built app
4. Post results as PR comment

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
1. Checkout with token that has write access
2. Run `biome check --fix --unsafe` + `biome format --write`
3. If files changed, commit with message `style: auto-fix lint and format`

Permissions: `contents: write`

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
- `textlint-rule-no-dead-link` — Broken link detection (warning-only in CI, not blocking)

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

### 2-3. cspell (New)

**Package**: `cspell`
**Config**: `cspell.json`
**Custom dictionary**: `.cspell/project-words.txt`

Project-specific words to register: vspo, vtuber, twitch, twitcasting, cloudflare, wrangler, turborepo, pnpm, biome, knip, lefthook, orval, dayjs, tsup, etc.

Target: `**/*.{ts,tsx,js,jsx,md,json}`
Exclude: node_modules, dist, .next, coverage, lock files, generated files

CI integration: New `cspell-check` job in `pr-check.yaml`

### 2-4. Lefthook Expansion

Current hooks: tsc, biome:check, knip (parallel)

Add to pre-commit (parallel):
- `textlint` (staged .md files only)
- `markdownlint-cli2` (staged .md files only)

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

Since vspo-portal is an app (not a library), use `@next/bundle-analyzer` approach:

**Workflow**: `.github/workflows/bundle-size-main.yaml`
- Trigger: push to main/develop (web paths)
- Build Next.js with `ANALYZE=true`
- Save `.next/analyze/` as artifact (90-day retention)

**PR comparison**: Add bundle size comparison step to `pr-check.yaml`
- Compare against main baseline
- Post sticky PR comment with size diff

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

### Phase 1: Lint Expansion (Low risk, immediate value)
- textlint rule expansion
- markdownlint setup
- cspell setup
- Lefthook expansion

### Phase 2: CI Workflow New Additions
- Security scan workflow
- Autofix workflow
- Lighthouse CI workflow
- Bundle size tracking

### Phase 3: Existing CI Improvements + Quality
- pr-check.yaml refactor (path filtering, dead code removal, bot-dashboard)
- Codecov config
- docs/plan/ directory
- gitleaks + CodeQL configs
