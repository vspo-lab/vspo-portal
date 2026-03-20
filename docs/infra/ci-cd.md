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
| `pr-check.yaml` | PR with web/packages changes | Biome, TypeScript, Knip, and Textlint checks |

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

### Trivy

Scans infrastructure configurations for vulnerabilities.

```yaml
env:
  TRIVY_SEVERITY: HIGH,CRITICAL
  TRIVY_SKIP_DIRS: ".terraform"
```

#### Detection Targets

- Terraform configuration vulnerabilities
- Cloud resource misconfigurations
- Secret exposure

### TFLint

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

### gitleaks (Manual Scan)

Checks for secret leaks.

```bash
# Run locally
gitleaks detect --source . --verbose
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

## Web Deployment

The web frontend has a separate deployment pipeline via `deploy-web-workers.yaml`.

### Trigger

```yaml
on:
  push:
    branches: [main, develop]
    paths: ['service/vspo-schedule/v2/web/**']
  workflow_dispatch:
```

### Pipeline

1. Checkout code
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

## Summary

| Phase | Action | Tools |
|---------|----------|--------|
| CI (Plan) | Change detection -> Lint -> Scan -> Plan | tfaction, tflint, trivy |
| Review | Review plan results -> Approve | GitHub PR |
| CD (Apply) | Apply -> Follow-up PR | tfaction |
| Web Deploy | Build -> Wrangler deploy | OpenNextJS, Wrangler |
| Monitoring | Drift Detection | tfaction |
