# tfaction Workflow

## Overview

> **Note:** The Terraform workflows (`terraform-plan-*.yml`, `terraform-apply-*.yml`) and `infrastructure/terraform/` directory are not yet implemented. This document describes the intended tfaction-based workflow design.

**tfaction** is a framework developed by [suzuki-shunsuke](https://github.com/suzuki-shunsuke/tfaction) for building advanced Terraform workflows with GitHub Actions.

### Key Features

- **Plan on PR, apply on merge**: Execute `terraform plan` on Pull Requests and automatically run `terraform apply` on merge
- **Monorepo support**: Dynamic build matrix that runs CI only for changed directories
- **Safe apply**: Plan-file-based apply to prevent unintended changes
- **PR comment notifications**: tfcmt automatically comments plan results on PRs
- **Drift detection**: Periodically detect drift and manage it as GitHub Issues

```
+-------------------------------------------------------------+
|                    tfaction Workflow                           |
+-------------------------------------------------------------+
|                                                                |
|  +----------+    +----------+    +----------+    +----------+ |
|  | Create   | -> |  Plan    | -> |  Review  | -> |  Merge   | |
|  | PR       |    |          |    |          |    |          | |
|  +----------+    +----------+    +----------+    +----------+ |
|                       |                               |        |
|                       v                               v        |
|               [Comment plan results         [Auto-execute      |
|                on PR]                        terraform apply]   |
|                                                                |
+-------------------------------------------------------------+
```

---

## Configuration Files

### tfaction.yaml (Root Configuration)

The tfaction configuration file placed at the project root.

```yaml
# infrastructure/terraform/tfaction.yaml
---
plan_workflow_name: Terraform Plan  # GitHub Actions workflow name (required)

# Update callers when local modules are updated
update_local_path_module_caller:
  enabled: true

# Security scanning
trivy:
  enabled: true

# Linting
tflint:
  enabled: true
  fix: true  # Auto-fix

# Target group definitions
target_groups:
  - working_directory: terraform/env/dev/
    target: my-app/dev/
```

### Key Configuration Items

| Item | Description | Default |
|-----|------|-----------|
| `plan_workflow_name` | Plan workflow file name (required) | - |
| `base_working_directory` | Base path for working directories | `""` |
| `working_directory_file` | Per-directory configuration file name | `tfaction.yaml` |
| `terraform_command` | Terraform command (OpenTofu compatible) | `terraform` |
| `draft_pr` | Create PRs as drafts | `false` |

### target_groups Configuration

```yaml
target_groups:
  - working_directory: terraform/env/dev/
    target: project-name/dev/

    # GCP authentication settings
    gcp_service_account: sa@project.iam.gserviceaccount.com
    gcp_workload_identity_provider: projects/123/locations/global/...

    # Environment variables
    env:
      TF_VAR_environment: dev

    # For AWS
    # aws_region: ap-northeast-1
    # terraform_plan_config:
    #   aws_assume_role_arn: arn:aws:iam::123:role/terraform-plan
```

### tfaction.yaml (Working Directory)

Placed in each environment's directory to override root configuration.

```yaml
# infrastructure/terraform/env/dev/backend/tfaction.yaml
---
# Per-directory settings (optional)
# terraform_command: tofu  # When using OpenTofu
# env:
#   TF_VAR_custom: value
```

---

## Target and Working Directory

### Concepts

- **Target**: A unique identifier for a working directory. Used in PR labels and comments
- **Working Directory**: The actual directory path where Terraform is executed

```yaml
target_groups:
  - target: my-app/dev/        # Target (identifier)
    working_directory: terraform/env/dev/   # Working Directory (path)
```

### Matching Rules

tfaction determines the target group by prefix-matching on `working_directory`.

```yaml
# Example: when terraform/env/dev/backend/ is changed
target_groups:
  - working_directory: terraform/env/dev/    # Matches
    target: project/dev/
  - working_directory: terraform/env/prod/   # Does not match
    target: project/prod/
```

---

## GitHub Actions Workflows

### Terraform Plan Workflow

```yaml
# .github/workflows/terraform-plan-dev.yml
name: Terraform Plan Dev

on:
  pull_request:
    branches:
      - develop
    paths:
      - 'infrastructure/terraform/env/dev/**'
      - 'infrastructure/terraform/modules/**'
      - .github/workflows/terraform-plan-dev.yml

concurrency:
  group: my-app
  cancel-in-progress: false

permissions:
  id-token: write      # Required for OIDC authentication
  contents: write      # Required for pushing code changes
  pull-requests: write # Required for PR comments

env:
  AQUA_CONFIG: "${{ github.workspace }}/aqua.yaml"
  TFACTION_CONFIG: "${{ github.workspace }}/infrastructure/terraform/tfaction.yaml"

jobs:
  setup:
    name: Set up
    runs-on: ubuntu-latest
    outputs:
      targets: ${{ steps.list-targets.outputs.targets }}
    steps:
      - uses: actions/checkout@v4
      - uses: aquaproj/aqua-installer@v3
        with:
          aqua_version: v2.55.0
      - uses: suzuki-shunsuke/tfaction/list-targets@v1
        id: list-targets

  plan:
    name: Plan (${{ matrix.target.target }})
    needs: setup
    if: join(fromJSON(needs.setup.outputs.targets), '') != ''
    runs-on: ubuntu-latest
    strategy:
      fail-fast: false
      matrix:
        target: ${{ fromJSON(needs.setup.outputs.targets) }}
    env:
      TFACTION_TARGET: ${{ matrix.target.target }}
      TFACTION_WORKING_DIR: ${{ matrix.target.working_directory }}
      TFACTION_JOB_TYPE: ${{ matrix.target.job_type }}
    steps:
      - uses: actions/checkout@v4

      # Obtain GitHub App token
      - uses: actions/create-github-app-token@v2
        id: app-token
        with:
          app-id: ${{ secrets.MY_APP_GITHUB_APP_ID }}
          private-key: ${{ secrets.MY_APP_GITHUB_APP_PRIVATE_KEY }}

      # Install tools
      - uses: aquaproj/aqua-installer@v3
        with:
          aqua_version: v2.55.0

      # GCP authentication
      - uses: google-github-actions/auth@v2
        with:
          project_id: ${{ secrets.GCP_PROJECT_ID }}
          workload_identity_provider: ${{ secrets.GCP_WORKLOAD_IDENTITY_PROVIDER }}
          service_account: ${{ secrets.GCP_SERVICE_ACCOUNT }}

      # tfaction setup
      - uses: suzuki-shunsuke/tfaction/setup@v1
        with:
          github_token: ${{ steps.app-token.outputs.token }}

      # Test (tflint, trivy, etc.)
      - uses: suzuki-shunsuke/tfaction/test@v1
        continue-on-error: true
        with:
          github_token: ${{ steps.app-token.outputs.token }}

      # Execute plan
      - uses: suzuki-shunsuke/tfaction/plan@v1
        with:
          github_token: ${{ steps.app-token.outputs.token }}
```

### Terraform Apply Workflow

```yaml
# .github/workflows/terraform-apply-dev.yml
name: Terraform Apply Dev

on:
  push:
    branches:
      - develop
    paths:
      - 'infrastructure/terraform/env/dev/**'
      - 'infrastructure/terraform/modules/**'

jobs:
  # ... setup job (same as plan)

  apply:
    name: Apply (${{ matrix.target.target }})
    needs: setup
    env:
      TFACTION_IS_APPLY: "true"  # Enable apply mode
    steps:
      # ... checkout, auth steps

      - uses: suzuki-shunsuke/tfaction/apply@v1
        with:
          github_token: ${{ steps.app-token.outputs.token }}

      # Create follow-up PR on apply failure
      - uses: suzuki-shunsuke/tfaction/create-follow-up-pr@v1
        if: failure()
        with:
          github_token: ${{ steps.app-token.outputs.token }}
```

---

## GCP Authentication Setup

### Workload Identity Federation

Authenticate from GitHub Actions to GCP without secrets.

```hcl
# Workload Identity Pool
resource "google_iam_workload_identity_pool" "gha_pool" {
  workload_identity_pool_id = "github-actions-pool"
}

# OIDC Provider
resource "google_iam_workload_identity_pool_provider" "gha_provider" {
  workload_identity_pool_id          = google_iam_workload_identity_pool.gha_pool.workload_identity_pool_id
  workload_identity_pool_provider_id = "github-actions"

  attribute_mapping = {
    "google.subject"       = "assertion.sub"
    "attribute.repository" = "assertion.repository"
  }

  # Repository restriction (important)
  attribute_condition = "assertion.repository == 'owner/repo'"

  oidc {
    issuer_uri = "https://token.actions.githubusercontent.com"
  }
}
```

### GitHub Secrets Configuration

| Secret | Description |
|--------|------|
| `GCP_PROJECT_ID` | GCP project ID |
| `GCP_WORKLOAD_IDENTITY_PROVIDER` | Full path to the Workload Identity Provider |
| `GCP_SERVICE_ACCOUNT` | Service account email address |
| `MY_APP_GITHUB_APP_ID` | GitHub App ID |
| `MY_APP_GITHUB_APP_PRIVATE_KEY` | GitHub App private key |

---

## Drift Detection

### Configuration

```yaml
# tfaction.yaml
drift_detection:
  enabled: true
  issue_repo_owner: owner
  issue_repo_name: repo
  num_of_issues: 3              # Maximum concurrent issues
  minimum_detection_interval: 1  # Minimum detection interval (days)
```

### Behavior

1. Periodically (scheduled) run `terraform plan`
2. If differences are detected, create a GitHub Issue
3. The issue includes drift details and remediation steps

---

## Module Management

### tfaction_module.yaml

Placed in module directories to make them recognized by tfaction.

```yaml
# infrastructure/terraform/modules/terraform_backend/tfaction_module.yaml
---
# Can be empty. Placing the file registers it as a module
```

### Version Management

Instead of local modules, tagged GitHub Sources are recommended.

```hcl
# Local path (during development)
module "vpc" {
  source = "../../../modules/vpc"
}

# GitHub Source (recommended for production)
module "vpc" {
  source = "git::https://github.com/owner/repo.git//modules/vpc?ref=v1.0.0"
}
```

---

## Best Practices

### Authentication

| Recommendation | Reason |
|-----|------|
| Use GitHub App | Safer than PAT, fine-grained permission control |
| Workload Identity | No secrets needed, automatic rotation |

### Tool Management

```yaml
# aqua.yaml
registries:
  - type: standard
    ref: v4.300.0

packages:
  - name: hashicorp/terraform@v1.14.2
  - name: terraform-linters/tflint@v0.54.0
  - name: aquasecurity/trivy@v0.67.2
```

### Security

1. **trivy**: Vulnerability scanning for infrastructure configurations
2. **tflint**: Terraform best practices checking
3. **attribute_condition**: Repository restriction via OIDC

### Operations

| Practice | Description |
|------------|------|
| Confirm plan in PR | Review changes before apply |
| Auto-apply on merge | Eliminate manual apply |
| Follow-up PR | Automatic repair PR on apply failure |
| Drift Detection | Detect and fix manual changes |

---

## Reference Links

- [tfaction Official Documentation](https://suzuki-shunsuke.github.io/tfaction/docs/)
- [tfaction GitHub Repository](https://github.com/suzuki-shunsuke/tfaction)
- [tfaction Getting Started](https://github.com/suzuki-shunsuke/tfaction-getting-started)
