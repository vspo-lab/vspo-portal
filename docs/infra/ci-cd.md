# Infrastructure CI/CD

## Overview

This project uses GitHub Actions and tfaction to build the infrastructure CI/CD pipeline.
All infrastructure changes are reviewed through Pull Requests and automatically deployed upon merge.

```text
+---------------------------------------------------------------------------+
|                     Infrastructure CI/CD Pipeline                          |
+---------------------------------------------------------------------------+
|                                                                            |
|  +----------+    +---------------+    +----------+    +--------------+    |
|  | Create   | -> |  CI (Plan)    | -> | Review   | -> | Merge        |    |
|  | PR       |    |               |    |          |    |              |    |
|  +----------+    +---------------+    +----------+    +--------------+    |
|                         |                                    |             |
|                         v                                    v             |
|              +---------------------+              +-----------------+     |
|              | - terraform plan    |              | CD (Apply)      |     |
|              | - tflint            |              | - terraform     |     |
|              | - trivy scan        |              |   apply         |     |
|              | - PR comment        |              | - follow-up PR  |     |
|              +---------------------+              +-----------------+     |
|                                                                            |
+---------------------------------------------------------------------------+
```

---

## Workflow Structure

### Active Workflows

| File | Trigger | Purpose |
|---------|---------|------|
| `deploy-web-workers.yaml` | Push to `main`/`develop`, paths `service/vspo-schedule/v2/web/**` | Build and deploy web frontend to Cloudflare Workers |
| `deploy-bot-dashboard.yaml` | Push to `main`/`develop`, paths `service/bot-dashboard/**` | Build and deploy bot dashboard to Cloudflare Workers |
| `pr-check.yaml` | PR with web/packages/docs changes | Biome, TypeScript, Knip, Textlint, Markdownlint, cspell, and bundle size checks |
| `security-scan.yaml` | PR, push to `main`/`develop`, weekly (Mon 00:00 UTC) | CodeQL, Trivy filesystem scan, gitleaks secret detection |
| `lighthouse.yaml` | PR with web/packages changes | Lighthouse performance audits |
| `autofix.yaml` | PR (opened/synchronize/reopened) | Auto-fix lint and format with Biome, auto-commit |
| `bundle-size-main.yaml` | Push to `main`/`develop`, paths web/packages | Save bundle size baseline for PR comparison |

### Planned Terraform Workflows (Not Yet Implemented)

> **Note:** The following Terraform workflows and `infrastructure/terraform/` directory do not exist yet. This section describes the intended design for when Terraform IaC is introduced.

| File | Trigger | Purpose |
|---------|---------|------|
| `terraform-plan-dev.yml` | PR to `develop` | Plan for dev environment |
| `terraform-apply-dev.yml` | Push to `develop` | Apply for dev environment |
| `terraform-plan-prod.yml` | PR to `main` | Plan for prod environment |
| `terraform-apply-prod.yml` | Push to `main` | Apply for prod environment |

### Trigger Conditions

```yaml
# Plan workflow
on:
  pull_request:
    branches:
      - develop
    paths:
      - 'infrastructure/terraform/env/dev/**'
      - 'infrastructure/terraform/modules/**'
      - .github/workflows/terraform-plan-dev.yml

# Apply workflow
on:
  push:
    branches:
      - develop
    paths:
      - 'infrastructure/terraform/env/dev/**'
      - 'infrastructure/terraform/modules/**'
```

---

## CI Workflow (Plan)

### Job Structure

```text
+-------------------------------------------------------------+
|                    terraform-plan-dev.yml                      |
+-------------------------------------------------------------+
|                                                                |
|  +--------------+                                             |
|  |   setup      |  Detect changed targets                     |
|  +------+-------+                                             |
|         |                                                      |
|         v                                                      |
|  +--------------+  +--------------+  +--------------+         |
|  |  plan (dev1) |  |  plan (dev2) |  |  plan (devN) |         |
|  +--------------+  +--------------+  +--------------+         |
|   Parallel execution (Matrix Strategy)                         |
|                                                                |
+-------------------------------------------------------------+
```

### Execution Steps

1. **Checkout**: Check out the repository
2. **Tool Install**: Install Terraform, TFLint, and Trivy with aqua
3. **GCP Auth**: Authenticate with GCP using Workload Identity
4. **Setup**: Set up tfaction
5. **Test**: Run TFLint and Trivy checks
6. **Plan**: Execute `terraform plan` and comment the results on the PR

### Required Permissions

```yaml
permissions:
  id-token: write      # OIDC authentication
  contents: write      # Auto-commit (format fixes, etc.)
  pull-requests: write # PR comments
```

### Concurrency Control

```yaml
concurrency:
  group: my-app
  cancel-in-progress: false  # Do not cancel in-progress jobs
```

---

## CD Workflow (Apply)

### Execution Steps

1. **Checkout**: Check out the repository
2. **Tool Install**: Install tools with aqua
3. **GCP Auth**: Authenticate with GCP using Workload Identity
4. **Setup**: Set up tfaction
5. **Apply**: Execute `terraform apply`
6. **Follow-up PR**: Automatically create a repair PR on apply failure

### Apply Flag

```yaml
env:
  TFACTION_IS_APPLY: "true"  # Enable apply mode
```

### Automatic Recovery on Failure

```yaml
- name: Follow up PR
  uses: suzuki-shunsuke/tfaction/create-follow-up-pr@v1
  if: failure()
  with:
    github_token: ${{ steps.app-token.outputs.token }}
```

---

## Environment Separation

### Branch Strategy

```text
main (production)
  ^
  +-- PR (terraform-plan-prod -> terraform-apply-prod)

develop (development)
  ^
  +-- PR (terraform-plan-dev -> terraform-apply-dev)

feature/*
  +-- Development branches
```

### Directory Structure

```text
infrastructure/terraform/
+-- env/
|   +-- dev/           # Development environment -> develop branch
|   +-- staging/       # Staging environment -> staging branch
|   +-- prod/          # Production environment -> main branch
+-- modules/           # Shared modules (used across all environments)
```

### State Separation

Each environment uses an independent GCS bucket prefix.

```hcl
# dev environment
backend "gcs" {
  bucket = "project-tfstate"
  prefix = "env/dev/terraform_backend"
}

# prod environment
backend "gcs" {
  bucket = "project-tfstate"
  prefix = "env/prod/terraform_backend"
}
```

---

## Security Scanning

### Automated CI Security Scanning (`security-scan.yaml`)

The `security-scan.yaml` workflow runs automatically on PRs, pushes to `main`/`develop`, and weekly (Monday 00:00 UTC). It performs three independent scans:

| Job | Tool | What it detects |
|-----|------|-----------------|
| `codeql` | CodeQL (`github/codeql-action@v3`) | Static analysis for JavaScript/TypeScript security issues |
| `trivy` | Trivy (`aquasecurity/trivy-action@0.35.0`) | CRITICAL/HIGH severity CVEs in filesystem dependencies |
| `gitleaks` | gitleaks (`v8.24.3`) | Hardcoded secrets and credentials |

### Trivy

Scans both infrastructure configurations and application filesystem for vulnerabilities.

```yaml
# CI (security-scan.yaml)
- uses: aquasecurity/trivy-action@0.35.0
  with:
    scan-type: 'fs'
    severity: 'CRITICAL,HIGH'
    trivyignores: '.trivyignore'
    exit-code: '1'
```

### gitleaks

Runs automatically in CI on every PR and push. Can also be run locally.

```bash
# Run locally
gitleaks detect --source . --config=.gitleaks.toml --verbose
```

### Planned: Terraform Security Scanning (Not Yet Implemented)

> **Note:** The following scanning tools are planned for when Terraform IaC is introduced.

#### TFLint

Checks Terraform best practices.

```hcl
# .tflint.hcl
plugin "terraform" {
  enabled = true
  preset  = "recommended"
}

plugin "google" {
  enabled = true
  version = "0.30.0"
  source  = "github.com/terraform-linters/tflint-ruleset-google"
}

rule "terraform_naming_convention" {
  enabled = true
}
```

---

## Tool Management

### aqua.yaml

All CI tools are managed with aqua with pinned versions.

```yaml
# aqua.yaml
registries:
  - type: standard
    ref: v4.284.1

packages:
  - name: hashicorp/terraform@v1.14.2
  - name: terraform-linters/tflint@v0.54.0
  - name: aquasecurity/trivy@v0.67.2
  - name: terraform-docs/terraform-docs@v0.20.0
  - name: twistedpair/google-cloud-sdk@534.0.0
  - name: reviewdog/reviewdog@v0.21.0
  - name: suzuki-shunsuke/github-comment@v6.3.5
  - name: int128/ghcp@v1.15.0
  - name: evilmartians/lefthook@v2.1.1
```

### Version Updates

Managed via automatic updates with Renovate or Dependabot.

```json
// renovate.json
{
  "extends": ["config:base"],
  "packageRules": [
    {
      "matchManagers": ["terraform"],
      "groupName": "terraform"
    }
  ]
}
```

---

## Secrets Management

### Required GitHub Secrets

| Secret | Description | How to Configure |
|--------|------|---------|
| `GCP_PROJECT_ID` | GCP project ID | Settings > Secrets |
| `GCP_WORKLOAD_IDENTITY_PROVIDER` | WIF provider path | Obtain from Terraform output |
| `GCP_SERVICE_ACCOUNT` | Service account | Obtain from Terraform output |
| `MY_APP_GITHUB_APP_ID` | GitHub App ID | Obtain from GitHub App settings |
| `MY_APP_GITHUB_APP_PRIVATE_KEY` | GitHub App private key | Obtain from GitHub App settings |

### Environment Configuration

```yaml
jobs:
  plan:
    environment: production  # Use GitHub Environment
```

By using GitHub Environments:

- Apply deployment protection rules
- Manage environment-specific secrets
- Add approval workflows

---

## Troubleshooting

### When Plan Fails

1. **Authentication error**: Verify GCP secrets are configured correctly
2. **Permission error**: Check service account permissions
3. **State lock**: Verify no other jobs are locking the state

### When Apply Fails

1. **Check follow-up PR**: Review the automatically created PR
2. **Diff from plan**: Verify no other changes were merged after the plan
3. **Resource limits**: Check if quotas or limits have been reached

### When Drift Is Detected

1. **Check issue**: Review drift details in the GitHub Issue
2. **Investigate cause**: Identify manual changes or console operations
3. **Create fix PR**: Fix the Terraform code and create a PR

---

## PR Check (`pr-check.yaml`)

Runs on PRs touching `service/vspo-schedule/v2/web/**`, `service/bot-dashboard/**`, `packages/**`, `docs/**`, or `README.md`. Uses `dorny/paths-filter@v3` to selectively run only the relevant checks.

### Jobs

| Job | Condition | Tool |
|-----|-----------|------|
| `biome-check` | Code changes (`*.ts`, `*.tsx`, `*.js`, `*.jsx`, `*.json`) | `pnpm biome:check` |
| `typescript-check` | Code changes | `pnpm tsc` |
| `knip-check` | Code changes | `pnpm knip` |
| `textlint-check` | Docs changes (`docs/**`, `README.md`) | `pnpm textlint` |
| `markdownlint-check` | Docs changes | `pnpm markdownlint` |
| `cspell-check` | Code or docs changes | `pnpm cspell` |
| `bundle-size` | Web or packages changes | `hashicorp/nextjs-bundle-analysis@v0.5.0` |

> **Future:** A `test` job (Vitest + Codecov) is prepared but commented out until Vitest is introduced.

---

## Lighthouse CI (`lighthouse.yaml`)

Runs on PRs touching web or packages changes. Performs automated Lighthouse audits using `treosh/lighthouse-ci-action@v12` with config from `lighthouserc.json`.

> **Note:** Currently runs with `continue-on-error: true` while environment variables and server startup are being tuned.

---

## Autofix (`autofix.yaml`)

Runs on PRs (opened/synchronize/reopened) from the same repository (not forks). Automatically fixes lint and format issues with Biome and auto-commits the changes via `stefanzweifel/git-auto-commit-action@v5`.

---

## Bundle Size Tracking

### Baseline (`bundle-size-main.yaml`)

Saves the bundle size baseline on pushes to `main`/`develop` for web/packages changes. Uses `hashicorp/nextjs-bundle-analysis@v0.5.0`.

### PR Comparison

The `bundle-size` job in `pr-check.yaml` compares the PR's bundle size against the baseline saved by `bundle-size-main.yaml`.

---

## Web Deployment (`deploy-web-workers.yaml`)

### Trigger

```yaml
on:
  push:
    branches: [main, develop]
    paths: ['service/vspo-schedule/v2/web/**']
  workflow_dispatch:
```

### Pipeline

1. Checkout code (`actions/checkout@v6`)
2. Setup pnpm (via composite action `.github/actions/setup-pnpm`)
3. Deploy via `cloudflare/wrangler-action@v3.14.1` (Wrangler CLI v4.6.0)
   - The action runs from the env-specific wrangler config directory
   - Build (`pnpm cf:build`) is triggered by the wrangler config's `build.command`
   - Secrets are injected as Wrangler secrets via the action's `secrets` input

### Environment Mapping

| Branch | Environment | Wrangler Config |
|--------|-------------|-----------------|
| `develop` | dev | `config/wrangler/dev/wrangler.jsonc` |
| `main` | prd | `config/wrangler/prd/wrangler.jsonc` |

See [Cloudflare Workers](./cloudflare-workers.md) for deployment architecture details.

---

## Bot Dashboard Deployment (`deploy-bot-dashboard.yaml`)

### Trigger

```yaml
on:
  push:
    branches: [main, develop]
    paths: ['service/bot-dashboard/**']
  workflow_dispatch:
```

### Pipeline

1. Checkout code (`actions/checkout@v6`)
2. Setup Node.js 22 and pnpm 10.28.0
3. Install dependencies and build via Turbo (`pnpm turbo build --filter=bot-dashboard...`)
4. Upload Discord secrets via `wrangler secret bulk`
5. Deploy via `cloudflare/wrangler-action@v3.14.1` (Wrangler CLI v4.76.0)

### Environment Mapping

| Branch | Environment | Wrangler Config |
|--------|-------------|-----------------|
| `develop` | bot-dashboard-development | `wrangler.jsonc` |
| `main` | bot-dashboard-production | `wrangler.prd.jsonc` |

---

## Summary

| Phase | Action | Tools |
|---------|----------|--------|
| PR Check | Lint, type check, spell check, bundle analysis | Biome, tsc, Knip, Textlint, Markdownlint, cspell |
| Security | CodeQL, filesystem scan, secret detection | CodeQL, Trivy, gitleaks |
| Performance | Lighthouse audit, bundle size tracking | Lighthouse CI, nextjs-bundle-analysis |
| Autofix | Auto-fix lint/format on PRs | Biome, git-auto-commit |
| Web Deploy | Build and deploy to Cloudflare Workers | OpenNextJS, Wrangler v4.6.0 |
| Bot Dashboard Deploy | Build and deploy to Cloudflare Workers | Turbo, Wrangler v4.76.0 |
| CI (Plan) | Change detection, lint, scan, plan (planned) | tfaction, tflint, trivy |
| CD (Apply) | Apply, follow-up PR (planned) | tfaction |
