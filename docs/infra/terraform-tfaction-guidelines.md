# Terraform Design Guidelines (tfaction-Based)

## Purpose

This document defines the **tfaction-centric operational standards** adopted in this template, building on the Terraform design guidelines.

- Target: `infrastructure/terraform/` and `.github/workflows/terraform-*.yml`
- Premise: `plan` on Pull Request, `apply` after merge
- Last updated: 2026-02-28

## Core Principles

1. Terraform execution uses GitHub Actions + tfaction as the standard path
2. `prod` requires IaC application; no manual drift is allowed
3. `state` is managed remotely and separated per environment
4. Modules maintain a flat structure; avoid over-abstraction
5. Authentication uses OIDC; no long-lived secrets

## Standard Directory Structure

```text
infrastructure/terraform/
+-- tfaction.yaml
+-- .tflint.hcl
+-- env/
|   +-- dev/
|   |   +-- network/
|   |   +-- platform/
|   |   +-- app/
|   +-- stg/
|   +-- prod/
+-- modules/
    +-- network_core/
    +-- platform_identity/
    +-- app_runtime/
```

- `env/*/*` are root modules where Terraform is directly executed (state units)
- `modules/*` are child modules intended for reuse
- `state` splitting is based on "lifecycle differences" and "ownership differences"

## State Design Rules

- Local state is prohibited. Use remote state on object storage
- Separate state across `dev/stg/prod`
- Keep resource count per state under approximately 100
- Avoid `terraform_remote_state` references in principle; use Data Sources + naming conventions instead
- State buckets should be dedicated, with versioning and deletion protection enabled

## Module Design Rules

- Standard module structure: `main.tf`, `variables.tf`, `outputs.tf`
- `variables.tf` / `outputs.tf` must include `type` and `description`
- Limit input variables to the minimum necessary. Do not use `any`
- Nested modules (module calling module) are prohibited in principle
- Do not create modules that merely thin-wrap a single resource

## Naming and File Rules

- Resource names and variable names use `snake_case`
- Do not duplicate resource type information in resource names
- Root modules consist of consolidated `main.tf` + standard auxiliary files (`providers.tf`, `terraform.tf`, `locals.tf`, `variables.tf`)
- `terraform fmt`, `terraform validate`, `tflint`, and `trivy` are required in CI

## Version Management

- Terraform / Provider versions are pinned with exact match (e.g., `= 1.14.2`)
- Execution version is synchronized between `.terraform-version` and `required_version`
- Version upgrades are batched in periodic operations (quarterly or semi-annually)

## tfaction Standard Configuration

### Root Configuration (`infrastructure/terraform/tfaction.yaml`)

```yaml
---
plan_workflow_name: Terraform Plan
working_directory_file: tfaction.yaml
update_local_path_module_caller:
  enabled: true
tflint:
  enabled: true
  fix: true
trivy:
  enabled: true
drift_detection:
  enabled: true
target_groups:
  - working_directory: terraform/env/dev/
    target: my-app/dev/
  - working_directory: terraform/env/stg/
    target: my-app/stg/
  - working_directory: terraform/env/prod/
    target: my-app/prod/
```

### Minimal GitHub Actions Configuration

- `plan`: `pull_request` trigger with `list-targets` -> `test` -> `plan`
- `apply`: `push` trigger with `list-targets` -> `apply`
- Required env:
  - `TFACTION_TARGET`
  - `TFACTION_WORKING_DIR`
  - `TFACTION_JOB_TYPE`
  - `TFACTION_IS_APPLY` (apply workflow only)
- On failure, create a recovery PR with `create-follow-up-pr`

## Security Policy

- Authentication uses GitHub OIDC (Workload Identity Federation)
- Separate execution roles for `plan` and `apply`
- Local terminal `apply` is prohibited except for `dev`
- `--target` apply is prohibited for `prod`

## Implementation Checklists

### When Adding a New State Unit

1. Create `env/<environment>/<state-unit>/`
2. Add `backend` configuration and pin provider versions
3. Update `target_groups` in the root `tfaction.yaml`
4. Update `paths` in plan/apply workflows
5. Update docs and operational rules

### When Adding a New Module

1. Create `modules/<module_name>/`
2. Create `main.tf`, `variables.tf`, `outputs.tf`
3. Document input `type`/`description` and validation
4. Reference from the caller's `main.tf` via relative path
5. Verify the plan for affected environments

## References

- Future Terraform Design Guidelines:
  - https://future-architect.github.io/arch-guidelines/documents/forTerraform/terraform_guidelines.html
- HashiCorp Terraform Style:
  - https://developer.hashicorp.com/terraform/language/style
- tfaction Docs:
  - https://suzuki-shunsuke.github.io/tfaction/
