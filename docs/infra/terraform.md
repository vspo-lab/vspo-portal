# Terraform Best Practices

## Overview

> **Note:** The `infrastructure/terraform/` directory and associated workflows are not yet implemented. This document describes the intended conventions and design for when Terraform IaC is introduced.

This project uses **Terraform** to manage Google Cloud Platform (GCP) infrastructure.
Infrastructure as Code (IaC) enables tracking infrastructure changes in Git and deploying safely through a review process.

For tfaction-based operational standards and design decisions, see:

- `docs/infra/terraform-tfaction-guidelines.md`

## Directory Structure

```text
infrastructure/terraform/
+-- tfaction.yaml              # tfaction root configuration
+-- .tflint.hcl                # TFLint configuration
+-- env/                       # Per-environment configuration
|   +-- dev/                   # Development environment
|   |   +-- backend/           # Terraform backend configuration
|   |       +-- main.tf        # Module invocations
|   |       +-- provider.tf    # Provider configuration
|   |       +-- variable.tf    # Variable definitions
|   |       +-- outputs.tf     # Output definitions
|   |       +-- tfaction.yaml  # tfaction per-directory configuration
|   +-- staging/               # Staging environment
|   +-- prod/                  # Production environment
+-- modules/                   # Reusable modules
    +-- terraform_backend/     # Terraform backend module
        +-- terraform.tf       # Service account configuration
        +-- github_oidc.tf     # GitHub OIDC configuration
        +-- state_bucket.tf    # State bucket configuration
        +-- variable.tf        # Variable definitions
        +-- outputs.tf         # Output definitions
        +-- tfaction_module.yaml
```

### Structural Principles

- **modules/**: Reusable infrastructure components
- **env/**: Root modules per environment (dev/staging/prod)
- Each environment has independent state and does not affect others

---

## File Naming Conventions

### Standard File Structure

| File Name | Purpose |
|-----------|------|
| `main.tf` | Resource definitions, module invocations |
| `provider.tf` | Provider and backend configuration |
| `variables.tf` | Variable declarations |
| `outputs.tf` | Output value definitions |
| `versions.tf` | Terraform/provider version constraints |

### Resource Naming

Use **underscore-separated** naming for resource names.

```hcl
# Good: underscore-separated
resource "google_storage_bucket" "terraform_state" {
  name = "my-project-tfstate"  # name argument can use hyphens
}

resource "google_service_account" "github_actions_sa" {
  account_id = "gha-terraform-sa"
}

# Bad: hyphen-separated (resource name)
resource "google_storage_bucket" "terraform-state" {  # Bad
  ...
}
```

### Keep Resource Names Concise

When the resource type already makes it clear, do not include redundant information in the name.

```hcl
# Good: simple name
resource "google_storage_bucket" "state" { ... }

# Bad: redundant
resource "google_storage_bucket" "state_bucket" { ... }  # Bad: bucket is redundant
```

---

## Module Design

### Module Structure

```text
modules/
+-- terraform_backend/
    +-- main.tf           # Main resources (or function-specific files)
    +-- variables.tf      # Input variables
    +-- outputs.tf        # Output values
    +-- README.md         # Module documentation (optional)
```

### Module Invocation

Use relative paths to invoke modules.

```hcl
# env/dev/backend/main.tf
module "terraform_backend" {
  source     = "../../../modules/terraform_backend"
  project_id = var.project_id
}
```

### Design Principles

1. **Single responsibility**: One module focuses on one function
2. **Input variables**: Parameterize all configurable values
3. **Output values**: Output values that other modules or resources reference
4. **Pin versions**: Pin versions for external modules

```hcl
# For external modules
module "vpc" {
  source  = "terraform-google-modules/network/google"
  version = "~> 9.0"  # Pin version
  ...
}
```

---

## State Management

### Remote State Configuration

Use GCS (Google Cloud Storage) to manage state.

```hcl
# provider.tf
terraform {
  required_version = "1.14.2"

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "7.13.0"
    }
  }

  backend "gcs" {
    bucket = "my-app-tfstate"
    prefix = "env/dev/terraform_backend"
  }
}
```

### State Bucket Configuration

```hcl
resource "google_storage_bucket" "state" {
  name          = "my-app-tfstate"
  force_destroy = false
  location      = "asia-northeast1"
  storage_class = "STANDARD"

  # Security settings
  uniform_bucket_level_access = true
  public_access_prevention    = "enforced"

  # Versioning (protection against accidental deletion)
  versioning {
    enabled = true
  }

  # Lifecycle (auto-delete old versions)
  lifecycle_rule {
    condition {
      num_newer_versions = 10
    }
    action {
      type = "Delete"
    }
  }
}
```

### State Separation Best Practices

| Rule | Reason |
|-------|------|
| Separate state per environment | dev changes do not affect prod |
| Keep under 100 resources | Fast refresh, reduced blast radius |
| Group related resources | Split state at logical boundaries |

---

## Variables and Outputs

### Variable Definitions

```hcl
# variables.tf
variable "project_id" {
  type        = string
  description = "The GCP project ID"
}

variable "region" {
  type        = string
  description = "The GCP region for resources"
  default     = "asia-northeast1"
}

variable "disk_size_gb" {
  type        = number
  description = "Disk size in gigabytes"
  default     = 100
}

variable "enable_public_access" {
  type        = bool
  description = "Whether to enable public access"
  default     = false
}
```

### Variable Naming Conventions

| Pattern | Example | Description |
|---------|-----|------|
| Unit suffix | `disk_size_gb`, `timeout_seconds` | Make units explicit |
| Positive boolean | `enable_*`, `is_*`, `has_*` | Avoid double negation |
| Description required | `description = "..."` | All variables must have a description |

### Output Definitions

```hcl
# outputs.tf
output "workload_identity_pool_name" {
  value       = google_iam_workload_identity_pool.gha_pool.name
  description = "Full resource name of the GitHub Actions Workload Identity Pool."
}

output "service_account_email" {
  value       = google_service_account.gha_terraform_sa.email
  description = "Email of the GitHub Actions Service Account."
}
```

---

## Security

### GitHub Actions OIDC Authentication

Use Workload Identity Federation for secret-free GCP authentication.

```hcl
# Workload Identity Pool
resource "google_iam_workload_identity_pool" "gha_pool" {
  workload_identity_pool_id = "github-actions-pool"
}

# OIDC Provider
resource "google_iam_workload_identity_pool_provider" "gha_provider" {
  workload_identity_pool_id          = google_iam_workload_identity_pool.gha_pool.workload_identity_pool_id
  workload_identity_pool_provider_id = "github-actions"
  display_name                       = "GitHub Actions"

  attribute_mapping = {
    "google.subject"       = "assertion.sub"
    "attribute.repository" = "assertion.repository"
  }

  # Restrict to repository
  attribute_condition = "assertion.repository == 'owner/repo'"

  oidc {
    issuer_uri = "https://token.actions.githubusercontent.com"
  }
}
```

### Principle of Least Privilege

Grant only the minimum required permissions to service accounts.

```hcl
# Service account for GitHub Actions
resource "google_service_account" "gha_terraform_sa" {
  account_id   = "gha-terraform-sa"
  display_name = "GitHub Actions Terraform SA"
}

# Grant only required permissions
resource "google_project_iam_member" "terraform_editor" {
  project = var.project_id
  role    = "roles/editor"
  member  = "serviceAccount:${google_service_account.gha_terraform_sa.email}"
}
```

### Data Protection

Set `prevent_destroy` for stateful resources.

```hcl
resource "google_sql_database_instance" "main" {
  name = "main-db"

  lifecycle {
    prevent_destroy = true  # Prevent accidental deletion
  }
}
```

---

## Linting & Validation

### TFLint Configuration

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

### How to Run

```bash
# TFLint
tflint --init
tflint

# Terraform Validate
terraform validate

# Trivy (security scan)
trivy config --severity HIGH,CRITICAL .
```

### Automated Checks in CI

The following are automatically executed in the tfaction workflow:

1. `terraform fmt` - Format check
2. `terraform validate` - Syntax check
3. `tflint` - Best practices check
4. `trivy` - Security scan

---

## Summary

| Category | Best Practice |
|---------|-------------------|
| Structure | Separate modules/ and env/ |
| Naming | Underscore-separated, concise names |
| State | Separate per environment, under 100 resources |
| Variables | Description required, unit suffixes |
| Security | OIDC authentication, least privilege, prevent_destroy |
| Quality | Automated checks with TFLint + Trivy |
