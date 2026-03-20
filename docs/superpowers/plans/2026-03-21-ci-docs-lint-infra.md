# CI / Documentation / Lint Infrastructure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring vspo-portal's CI, linting, and documentation infrastructure to OSS-grade quality.

**Architecture:** Three-phase rollout — Phase 1 adds local lint tools and configs, Phase 2 adds new CI workflows, Phase 3 refactors existing CI. Each phase is independently deployable and testable.

**Tech Stack:** GitHub Actions, Biome, textlint, markdownlint-cli2, cspell, Lighthouse CI, CodeQL, Trivy, gitleaks, Codecov

**Spec:** `docs/superpowers/specs/2026-03-21-ci-docs-lint-infra-design.md`

---

## Phase 1: Lint Expansion + docs/plan

### Task 1: Create docs/plan/ directory

**Files:**
- Create: `docs/plan/README.md`

Note: The spec mentions `.gitkeep` but `README.md` makes it unnecessary since git tracks directories with files.

- [ ] **Step 1: Create docs/plan/README.md**

````markdown
# Feature Plans

This directory contains specification documents for feature development.

## Workflow

1. Define spec: `/plan-feature` skill
2. Generate checklist: `/init-impl` skill
3. Implement: Follow the generated checklist

## Structure

```
docs/plan/
└── <feature-name>/
    ├── spec.md          # Feature specification
    ├── checklist.md     # Implementation checklist
    └── decisions.md     # Design decisions (optional)
```
````

- [ ] **Step 2: Commit**

```bash
git add docs/plan/README.md
git commit -m "docs: create docs/plan/ directory for spec-driven development"
```

---

### Task 2: textlint rule expansion

**Files:**
- Modify: `.textlintrc.json`
- Modify: `package.json` (add `textlint-rule-common-misspellings`)

- [ ] **Step 1: Install new textlint rule**

```bash
pnpm add -Dw textlint-rule-common-misspellings
```

- [ ] **Step 2: Update `.textlintrc.json`**

Replace the entire file with:

```json
{
  "plugins": {
    "@textlint/markdown": true
  },
  "rules": {
    "preset-ja-technical-writing": {
      "max-comma": false,
      "sentence-length": false,
      "max-kanji-continuous-len": false,
      "ja-no-mixed-period": false,
      "no-exclamation-question-mark": false,
      "no-mix-dearu-desumasu": false,
      "ja-no-successive-word": false,
      "no-doubled-joshi": true,
      "ja-no-redundant-expression": true,
      "no-double-negative-ja": true,
      "no-dropping-the-ra": true,
      "no-hankaku-kana": true
    },
    "common-misspellings": true
  }
}
```

Key changes from current config:
- `no-doubled-joshi`: `false` → `true` (duplicated particles)
- `ja-no-redundant-expression`: `false` → `true` (redundant expressions)
- `no-double-negative-ja`: added as `true` (double negation)
- `no-dropping-the-ra`: added as `true` (ら抜き言葉)
- `no-hankaku-kana`: added as `true` (half-width katakana)
- `common-misspellings`: added as `true` (English spelling)

Note: `textlint:fix` script already exists in `package.json`, no change needed.

- [ ] **Step 3: Run textlint auto-fix on existing docs**

```bash
pnpm textlint:fix
```

Review the changes. Some fixes will be automatic, others will need manual attention.

- [ ] **Step 4: Fix any remaining textlint violations manually**

```bash
pnpm textlint
```

Fix any remaining errors reported. If some rules produce too many false positives on specific files, add those files to `.textlintignore` rather than disabling the rule globally.

- [ ] **Step 5: Verify clean run**

```bash
pnpm textlint
```

Expected: No errors (exit code 0).

- [ ] **Step 6: Commit**

```bash
git add .textlintrc.json package.json pnpm-lock.yaml docs/ README.md .textlintignore
git commit -m "chore: expand textlint rules and fix existing violations

Enable no-doubled-joshi, ja-no-redundant-expression, no-double-negative-ja,
no-dropping-the-ra, no-hankaku-kana. Add common-misspellings rule."
```

---

### Task 3: markdownlint setup

**Files:**
- Create: `.markdownlint-cli2.jsonc`
- Modify: `package.json` (add devDependency + scripts)

- [ ] **Step 1: Install markdownlint-cli2**

```bash
pnpm add -Dw markdownlint-cli2
```

- [ ] **Step 2: Create `.markdownlint-cli2.jsonc`**

```jsonc
{
  // markdownlint configuration for vspo-portal
  // https://github.com/DavidAnson/markdownlint/blob/main/doc/Rules.md
  "config": {
    "default": true,
    // Disable line length — incompatible with Japanese text
    "MD013": false,
    // Allow inline HTML for specific tags
    "MD033": {
      "allowed_elements": ["details", "summary", "br", "sub", "sup"]
    },
    // Allow duplicate headings in different sections
    "MD024": {
      "siblings_only": true
    },
    // Allow trailing punctuation in headings (Japanese uses "？" etc.)
    "MD026": false
  },
  "globs": [
    "docs/**/*.md",
    "README.md",
    ".github/**/*.md"
  ],
  "ignores": [
    "node_modules",
    "**/node_modules",
    "docs/superpowers/plans/**",
    "docs/superpowers/specs/**"
  ]
}
```

Note: `docs/superpowers/plans/**` and `docs/superpowers/specs/**` are ignored because they are auto-generated by AI agents and may not conform to strict markdownlint rules.

- [ ] **Step 3: Add scripts to root `package.json`**

Add to the `"scripts"` section:

```json
"markdownlint": "markdownlint-cli2",
"markdownlint:fix": "markdownlint-cli2 --fix"
```

Note: Unlike the spec which uses explicit file globs in the script, the plan uses bare `markdownlint-cli2` because file targeting is handled by the config's `globs` field in `.markdownlint-cli2.jsonc`. This is cleaner and avoids duplication.

- [ ] **Step 4: Run markdownlint to see initial violations**

```bash
pnpm markdownlint
```

Review the output. Fix violations or adjust the config if specific rules are too noisy.

- [ ] **Step 5: Fix violations**

```bash
pnpm markdownlint:fix
```

Then manually fix any remaining issues that auto-fix can't handle.

- [ ] **Step 6: Verify clean run**

```bash
pnpm markdownlint
```

Expected: No errors (exit code 0).

- [ ] **Step 7: Commit**

```bash
git add .markdownlint-cli2.jsonc package.json pnpm-lock.yaml docs/ README.md .github/
git commit -m "chore: add markdownlint-cli2 and fix existing violations"
```

---

### Task 4: cspell setup

**Files:**
- Create: `cspell.json`
- Create: `.cspell/project-words.txt`
- Modify: `package.json` (add devDependency + script)

- [ ] **Step 1: Install cspell**

```bash
pnpm add -Dw cspell
```

- [ ] **Step 2: Create `.cspell/project-words.txt`**

```
vspo
vspo-lab
vtuber
twitch
twitcasting
cloudflare
wrangler
turborepo
pnpm
biome
biomejs
knip
lefthook
orval
dayjs
tsup
tsconfig
textlint
markdownlint
cspell
codecov
trivy
gitleaks
codeql
semgrep
vitejs
vitest
monorepo
opennextjs
mui
preact
astro
starlight
middlewares
postconditions
preconditions
idempotency
serializable
desumasu
dearu
hankaku
joshi
katakana
reduxjs
zustand
tanstack
nextjs
vercel
signup
signin
datetime
timestamp
timestamps
endregion
nonempty
rehype
remark
shiki
frontmatter
middleware
middlewares
hotkey
hotkeys
breakpoint
breakpoints
scrollbar
fullscreen
touchscreen
unmount
unmounted
rerender
rerenders
compat
typedoc
oxlint
oxfmt
tfaction
tflint
aquasecurity
devcontainer
tfvars
```

This list will grow over time. Run `cspell` to discover additional project-specific words that need adding.

- [ ] **Step 3: Create `cspell.json`**

```json
{
  "version": "0.2",
  "language": "en",
  "dictionaries": ["project-words"],
  "dictionaryDefinitions": [
    {
      "name": "project-words",
      "path": ".cspell/project-words.txt",
      "addWords": true
    }
  ],
  "ignorePaths": [
    "node_modules",
    "dist",
    ".next",
    ".turbo",
    ".wrangler",
    ".open-next",
    "coverage",
    "pnpm-lock.yaml",
    "packages/api/src/generated/**",
    "**/*.snap",
    "**/.git/**",
    ".pnpm-store",
    "meta/**",
    ".astro"
  ],
  "files": [
    "**/*.{ts,tsx,js,jsx,md,json}"
  ],
  "allowCompoundWords": true
}
```

- [ ] **Step 4: Add script to root `package.json`**

Add to the `"scripts"` section:

```json
"cspell": "cspell lint ."
```

Note: The spec uses explicit globs in the script, but the plan uses `cspell lint .` because file targeting is handled by the `files` field in `cspell.json`. JSON files are included in the config's `files` field for completeness.

- [ ] **Step 5: Run cspell and iterate on dictionary**

```bash
pnpm cspell
```

Review unknown words. For each:
- If it's a valid project term → add to `.cspell/project-words.txt`
- If it's a genuine typo → fix it in the source file
- If it's in a generated/vendor file → add the path to `ignorePaths`

Repeat until the output is clean. This may take several iterations.

- [ ] **Step 6: Verify clean run**

```bash
pnpm cspell
```

Expected: No errors (exit code 0).

- [ ] **Step 7: Commit**

```bash
git add cspell.json .cspell/ package.json pnpm-lock.yaml
git commit -m "chore: add cspell for spell checking with project dictionary"
```

---

### Task 5: Lefthook expansion

**Files:**
- Modify: `lefthook.yml`

- [ ] **Step 1: Update `lefthook.yml`**

Replace the entire file with:

```yaml
pre-commit:
  parallel: true
  commands:
    type-check:
      run: pnpm tsc
    biome:
      run: pnpm biome:check
    knip:
      run: pnpm knip
    textlint:
      glob: "*.md"
      run: pnpm textlint
    markdownlint:
      glob: "*.md"
      run: pnpm markdownlint
```

Notes:
- `textlint` and `markdownlint` use `glob: "*.md"` as a **trigger filter** — when any `.md` file is staged, the full lint command runs on all target files (not just staged ones). This is intentional: partial file linting can miss cross-file issues.
- `cspell` is intentionally excluded (too slow for pre-commit, CI-only)

- [ ] **Step 2: Test the hooks**

```bash
lefthook run pre-commit
```

Expected: All commands pass.

- [ ] **Step 3: Commit**

```bash
git add lefthook.yml
git commit -m "chore: add textlint and markdownlint to lefthook pre-commit"
```

---

## Phase 2: CI Workflow New Additions

### Task 6: setup-pnpm composite action — add `build` input

**Files:**
- Modify: `.github/actions/setup-pnpm/action.yml`

- [ ] **Step 1: Update `.github/actions/setup-pnpm/action.yml`**

Replace the entire file with:

```yaml
name: 'Setup PNPM'
description: 'Setup Node.js and PNPM with optional build step'
inputs:
  build:
    description: 'Run pnpm build after install'
    required: false
    default: 'true'
runs:
  using: 'composite'
  steps:
    - name: Set up Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '22'

    - name: Set up pnpm
      uses: pnpm/action-setup@v4
      with:
        version: 10.28.0
        run_install: false

    - name: Download deps
      shell: bash
      run: pnpm install

    - name: Package build
      if: inputs.build == 'true'
      shell: bash
      run: pnpm build
```

- [ ] **Step 2: Commit**

```bash
git add .github/actions/setup-pnpm/action.yml
git commit -m "ci: add build input parameter to setup-pnpm composite action

Lint-only CI jobs can now use build: false to skip the full
Turborepo build, reducing CI time significantly."
```

---

### Task 7: Security scan CI workflow

**Files:**
- Create: `.github/workflows/security-scan.yaml`
- Create: `.github/codeql/codeql-config.yml`
- Create: `.gitleaks.toml`

- [ ] **Step 1: Create `.github/codeql/codeql-config.yml`**

```yaml
name: "CodeQL Config"

paths-ignore:
  - "**/node_modules/**"
  - "**/*.test.ts"
  - "**/*.spec.ts"
  - "**/scripts/**"
  - "**/dist/**"
  - "**/.next/**"
  - "**/.open-next/**"
  - "**/coverage/**"
  - "**/meta/**"
  - "**/packages/api/src/generated/**"
```

- [ ] **Step 2: Create `.gitleaks.toml`**

```toml
title = "gitleaks config for vspo-portal"

[allowlist]
  description = "Allowlisted files and patterns"
  paths = [
    '''\.test\.ts$''',
    '''\.spec\.ts$''',
    '''pnpm-lock\.yaml$''',
    '''packages/api/src/generated/''',
    '''\.env\.example$''',
    '''\.env\.sample$''',
    '''\.env\.local\.example$''',
  ]
```

- [ ] **Step 3: Create `.github/workflows/security-scan.yaml`**

```yaml
name: Security Scan

on:
  pull_request:
  push:
    branches: [main, develop]
  schedule:
    - cron: '0 0 * * 1'  # Monday 00:00 UTC
  workflow_dispatch:

permissions:
  security-events: write
  contents: read

jobs:
  codeql:
    name: CodeQL Analysis
    runs-on: ubuntu-latest
    timeout-minutes: 15
    permissions:
      security-events: write
      contents: read
    steps:
      - uses: actions/checkout@v6

      - name: Initialize CodeQL
        uses: github/codeql-action/init@v3
        with:
          languages: javascript-typescript
          config-file: ./.github/codeql/codeql-config.yml

      - name: Perform CodeQL Analysis
        uses: github/codeql-action/analyze@v3

  trivy:
    name: Trivy Vulnerability Scan
    runs-on: ubuntu-latest
    timeout-minutes: 10
    steps:
      - uses: actions/checkout@v6

      - name: Run Trivy
        uses: aquasecurity/trivy-action@0.35.0
        with:
          scan-type: 'fs'
          scan-ref: '.'
          severity: 'CRITICAL,HIGH'
          trivyignores: '.trivyignore'
          exit-code: '1'

  gitleaks:
    name: Secret Detection
    runs-on: ubuntu-latest
    timeout-minutes: 10
    steps:
      - uses: actions/checkout@v6
        with:
          fetch-depth: 0

      - name: Run gitleaks
        uses: gitleaks/gitleaks-action@v2
        with:
          args: --config=.gitleaks.toml
        env:
          GITLEAKS_LICENSE: ${{ secrets.GITLEAKS_LICENSE }}
```

Notes:
- `GITLEAKS_LICENSE` secret is required for the gitleaks GitHub Action on private repos. For public repos it works without a license. If the repo is private and no license is available, replace with the free `gitleaks/gitleaks-action@v2` without args and it will use defaults.
- `.trivyignore` already exists in the repo (currently empty except comments). The Trivy action references it via `trivyignores` parameter.

- [ ] **Step 4: Commit**

```bash
git add .github/workflows/security-scan.yaml .github/codeql/codeql-config.yml .gitleaks.toml
git commit -m "ci: add security scan workflow with CodeQL, Trivy, and gitleaks

Three-layer security scanning:
- CodeQL: JS/TS SAST analysis
- Trivy: dependency vulnerability scan (CRITICAL/HIGH)
- gitleaks: secret detection in git history

Runs on PRs, pushes to main/develop, and weekly schedule."
```

---

### Task 8: Autofix workflow

**Files:**
- Create: `.github/workflows/autofix.yaml`

- [ ] **Step 1: Create `.github/workflows/autofix.yaml`**

```yaml
name: Autofix

on:
  pull_request:
    types: [opened, synchronize, reopened]

permissions:
  contents: write

jobs:
  autofix:
    name: Auto-fix lint and format
    runs-on: ubuntu-latest
    timeout-minutes: 10
    # Only run on same-repo PRs (not forks)
    if: github.event.pull_request.head.repo.full_name == github.repository
    steps:
      - uses: actions/checkout@v6
        with:
          ref: ${{ github.head_ref }}

      - name: Setup PNPM
        uses: ./.github/actions/setup-pnpm
        with:
          build: 'false'

      - name: Run Biome fix
        run: |
          pnpm biome check --fix --unsafe
          pnpm biome format --write .

      - name: Auto-commit fixes
        uses: stefanzweifel/git-auto-commit-action@v5
        with:
          commit_message: "style: auto-fix lint and format"
          commit_options: "--no-verify"
```

Uses `GITHUB_TOKEN` (implicit) which does NOT trigger recursive workflow runs.

- [ ] **Step 2: Commit**

```bash
git add .github/workflows/autofix.yaml
git commit -m "ci: add autofix workflow for auto-committing lint/format fixes

Runs biome check --fix and biome format --write on PRs from the
same repo (not forks). Uses GITHUB_TOKEN to prevent infinite loops."
```

---

### Task 9: Lighthouse CI workflow

**Files:**
- Create: `lighthouserc.json`
- Create: `.github/workflows/lighthouse.yaml`

- [ ] **Step 1: Create `lighthouserc.json`**

```json
{
  "ci": {
    "collect": {
      "startServerCommand": "npx next start -p 3333",
      "startServerReadyPattern": "Ready in",
      "url": [
        "http://localhost:3333/",
        "http://localhost:3333/schedule"
      ],
      "numberOfRuns": 1,
      "settings": {
        "chromeFlags": "--no-sandbox --headless --disable-gpu",
        "onlyCategories": ["performance", "accessibility", "best-practices", "seo"]
      }
    },
    "assert": {
      "assertions": {
        "categories:performance": ["warn", { "minScore": 0.8 }],
        "categories:accessibility": ["error", { "minScore": 0.9 }],
        "categories:best-practices": ["error", { "minScore": 0.9 }],
        "categories:seo": ["error", { "minScore": 0.9 }]
      }
    },
    "upload": {
      "target": "temporary-public-storage"
    }
  }
}
```

Notes:
- `numberOfRuns: 1` to keep CI fast (increase to 3 for more stable scores if needed)
- Performance is `warn` only (Lighthouse performance scores are volatile in CI)
- Accessibility, Best Practices, SEO are `error` (more stable and important)
- `url` targets the home page and schedule page — adjust as key pages change

- [ ] **Step 2: Create `.github/workflows/lighthouse.yaml`**

```yaml
name: Lighthouse CI

on:
  pull_request:
    paths:
      - 'service/vspo-schedule/v2/web/**'
      - 'packages/**'

jobs:
  lighthouse:
    name: Lighthouse Audit
    runs-on: ubuntu-latest
    timeout-minutes: 15
    steps:
      - uses: actions/checkout@v6

      - name: Setup PNPM
        uses: ./.github/actions/setup-pnpm

      - name: Build web app
        run: pnpm --filter vspo-schedule-v2-web exec next build
        env:
          NEXT_PUBLIC_SITE_URL: "http://localhost:3333"

Note: Uses `exec next build` instead of the package's `build` script to skip `next-sitemap` (not needed for Lighthouse audits). The same approach is used in the bundle-size workflow.

      - name: Run Lighthouse CI
        uses: treosh/lighthouse-ci-action@v12
        with:
          configPath: ./lighthouserc.json
          uploadArtifacts: true
          temporaryPublicStorage: true
        env:
          LHCI_GITHUB_APP_TOKEN: ${{ secrets.LHCI_GITHUB_APP_TOKEN }}
```

Note: `LHCI_GITHUB_APP_TOKEN` enables PR status checks and comments. If not set, Lighthouse still runs but results are only in artifacts. To set up, install the [Lighthouse CI GitHub App](https://github.com/apps/lighthouse-ci).

- [ ] **Step 3: Commit**

```bash
git add lighthouserc.json .github/workflows/lighthouse.yaml
git commit -m "ci: add Lighthouse CI for web app performance audits

Runs against Next.js build on PRs touching web app or packages.
Budgets: Performance 0.8 (warn), Accessibility 0.9, Best Practices 0.9, SEO 0.9."
```

---

### Task 10: Bundle size tracking

**Files:**
- Create: `.github/workflows/bundle-size-main.yaml`

- [ ] **Step 1: Create `.github/workflows/bundle-size-main.yaml`**

```yaml
name: Bundle Size Baseline

on:
  push:
    branches: [main, develop]
    paths:
      - 'service/vspo-schedule/v2/web/**'
      - 'packages/**'
  workflow_dispatch:

jobs:
  baseline:
    name: Save bundle size baseline
    runs-on: ubuntu-latest
    timeout-minutes: 15
    steps:
      - uses: actions/checkout@v6

      - name: Setup PNPM
        uses: ./.github/actions/setup-pnpm

      - name: Build web app
        run: pnpm --filter vspo-schedule-v2-web exec next build
        env:
          NEXT_PUBLIC_SITE_URL: "https://www.vspo-portal.com"

      - name: Analyze bundle
        uses: hashicorp/nextjs-bundle-analysis@v0.2
        with:
          build-directory: service/vspo-schedule/v2/web/.next
          workflow-id: bundle-size-main.yaml
```

- [ ] **Step 2: Commit**

```bash
git add .github/workflows/bundle-size-main.yaml
git commit -m "ci: add bundle size baseline workflow for Next.js web app

Saves bundle size data on pushes to main/develop for PR comparison."
```

---

## Phase 3: Existing CI Improvements + Quality

### Task 11: pr-check.yaml refactor

**Files:**
- Modify: `.github/workflows/pr-check.yaml`

- [ ] **Step 1: Replace `.github/workflows/pr-check.yaml`**

```yaml
name: PR Check

on:
  pull_request:
    paths:
      - 'service/vspo-schedule/v2/web/**'
      - 'service/bot-dashboard/**'
      - 'packages/**'
      - 'docs/**'
      - 'README.md'
      - '.github/workflows/pr-check.yaml'

jobs:
  changes:
    runs-on: ubuntu-latest
    outputs:
      web: ${{ steps.filter.outputs.web }}
      bot-dashboard: ${{ steps.filter.outputs.bot-dashboard }}
      packages: ${{ steps.filter.outputs.packages }}
      docs: ${{ steps.filter.outputs.docs }}
      code: ${{ steps.filter.outputs.code }}
    steps:
      - uses: actions/checkout@v6
      - uses: dorny/paths-filter@v3
        id: filter
        with:
          filters: |
            web:
              - 'service/vspo-schedule/v2/web/**'
            bot-dashboard:
              - 'service/bot-dashboard/**'
            packages:
              - 'packages/**'
            docs:
              - 'docs/**'
              - 'README.md'
              - '.github/**/*.md'
            code:
              - '**/*.ts'
              - '**/*.tsx'
              - '**/*.js'
              - '**/*.jsx'
              - '**/*.json'

  biome-check:
    needs: changes
    if: needs.changes.outputs.code == 'true'
    runs-on: ubuntu-latest
    timeout-minutes: 10
    steps:
      - uses: actions/checkout@v6
      - name: Setup PNPM
        uses: ./.github/actions/setup-pnpm
      - name: Biome Check
        run: pnpm biome:check

  typescript-check:
    needs: changes
    if: needs.changes.outputs.code == 'true'
    runs-on: ubuntu-latest
    timeout-minutes: 10
    steps:
      - uses: actions/checkout@v6
      - name: Setup PNPM
        uses: ./.github/actions/setup-pnpm
      - name: TypeScript Check
        run: pnpm tsc

  knip-check:
    needs: changes
    if: needs.changes.outputs.code == 'true'
    runs-on: ubuntu-latest
    timeout-minutes: 10
    steps:
      - uses: actions/checkout@v6
      - name: Setup PNPM
        uses: ./.github/actions/setup-pnpm
      - name: Knip Check
        run: pnpm knip

  textlint-check:
    needs: changes
    if: needs.changes.outputs.docs == 'true'
    runs-on: ubuntu-latest
    timeout-minutes: 10
    steps:
      - uses: actions/checkout@v6
      - name: Setup PNPM
        uses: ./.github/actions/setup-pnpm
        with:
          build: 'false'
      - name: Textlint Check
        run: pnpm textlint

  markdownlint-check:
    needs: changes
    if: needs.changes.outputs.docs == 'true'
    runs-on: ubuntu-latest
    timeout-minutes: 10
    steps:
      - uses: actions/checkout@v6
      - name: Setup PNPM
        uses: ./.github/actions/setup-pnpm
        with:
          build: 'false'
      - name: Markdownlint Check
        run: pnpm markdownlint

  cspell-check:
    needs: changes
    if: needs.changes.outputs.code == 'true' || needs.changes.outputs.docs == 'true'
    runs-on: ubuntu-latest
    timeout-minutes: 10
    steps:
      - uses: actions/checkout@v6
      - name: Setup PNPM
        uses: ./.github/actions/setup-pnpm
        with:
          build: 'false'
      - name: Spell Check
        run: pnpm cspell

  bundle-size:
    needs: changes
    if: needs.changes.outputs.web == 'true' || needs.changes.outputs.packages == 'true'
    runs-on: ubuntu-latest
    timeout-minutes: 15
    steps:
      - uses: actions/checkout@v6
      - name: Setup PNPM
        uses: ./.github/actions/setup-pnpm
      - name: Build web app
        run: pnpm --filter vspo-schedule-v2-web exec next build
        env:
          NEXT_PUBLIC_SITE_URL: "https://www.vspo-portal.com"
      - name: Analyze bundle
        uses: hashicorp/nextjs-bundle-analysis@v0.2
        with:
          build-directory: service/vspo-schedule/v2/web/.next
          workflow-id: bundle-size-main.yaml

  # ----- Future: Uncomment when Vitest is introduced -----
  # test:
  #   needs: changes
  #   if: needs.changes.outputs.code == 'true'
  #   runs-on: ubuntu-latest
  #   timeout-minutes: 15
  #   steps:
  #     - uses: actions/checkout@v6
  #     - name: Setup PNPM
  #       uses: ./.github/actions/setup-pnpm
  #     - name: Run tests
  #       run: pnpm test
  #     - name: Upload coverage
  #       if: always()
  #       uses: codecov/codecov-action@v5
  #       with:
  #         token: ${{ secrets.CODECOV_TOKEN }}
  #         flags: unittests
  #         fail_ci_if_error: false
```

Key changes:
- `changes` job outputs are now consumed by all downstream jobs via `needs` + `if`
- Added `bot-dashboard`, `docs` path filters
- Lint-only jobs (`textlint`, `markdownlint`, `cspell`) use `build: 'false'`
- Added `markdownlint-check`, `cspell-check`, `bundle-size` jobs
- Added commented-out `test` job skeleton ready for Vitest

Note: `biome-check` keeps `build: 'true'` (default) because Biome checks JSON files that may reference built artifacts. `typescript-check` and `knip-check` also require built packages for cross-workspace type resolution. If CI time becomes a concern, `biome-check` could potentially use `build: 'false'` — test locally first.

- [ ] **Step 2: Commit**

```bash
git add .github/workflows/pr-check.yaml
git commit -m "ci: refactor pr-check with path filtering and new lint jobs

- Wire changes job outputs to all downstream jobs
- Add bot-dashboard and docs path triggers
- Add markdownlint-check, cspell-check, bundle-size jobs
- Lint-only jobs use build: false to skip Turborepo build
- Add commented-out test job skeleton for future Vitest"
```

---

### Task 12: Codecov configuration

**Files:**
- Create: `codecov.yml`

- [ ] **Step 1: Create `codecov.yml`**

```yaml
# Codecov configuration
# Pre-configured for future Vitest integration
# See: docs/testing/00-strategy.md for coverage targets

coverage:
  status:
    project:
      default:
        target: 60%
        threshold: 1%
        informational: true
    patch:
      default:
        target: 50%
        informational: true

comment:
  layout: "condensed_header, condensed_files, condensed_footer"
  require_changes: true
```

- [ ] **Step 2: Commit**

```bash
git add codecov.yml
git commit -m "ci: add Codecov config for future test coverage integration

Project target: 60%, patch target: 50% (informational).
Will be activated when Vitest is introduced."
```

---

### Task 13: Final verification

- [ ] **Step 1: Run all local checks**

```bash
pnpm biome:check && pnpm knip && pnpm tsc && pnpm textlint && pnpm markdownlint && pnpm cspell
```

Expected: All pass with exit code 0.

- [ ] **Step 2: Run lefthook**

```bash
lefthook run pre-commit
```

Expected: All hooks pass.

- [ ] **Step 3: Verify post-edit-check**

```bash
./scripts/post-edit-check.sh
```

Expected: Pass (this runs biome:check, knip, tsc).

- [ ] **Step 4: Review all new workflow files**

Verify the following files exist and are valid YAML:

```bash
ls -la .github/workflows/
```

Expected files:
- `pr-check.yaml` (modified)
- `deploy-web-workers.yaml` (unchanged)
- `deploy-bot-dashboard.yaml` (unchanged)
- `security-scan.yaml` (new)
- `autofix.yaml` (new)
- `lighthouse.yaml` (new)
- `bundle-size-main.yaml` (new)

- [ ] **Step 5: Create PR**

Use `/create-pr` skill to create the PR.
