---
name: Infrastructure Bootstrap (tfaction-based)
description: Skill for advancing Terraform design and implementation centered on tfaction. Standardizes state splitting, module design, and GitHub Actions integration.
---

# Trigger Conditions

- When performing new setup or configuration changes under `infrastructure/terraform/`
- When adding or updating `.github/workflows/terraform-*.yml`
- When deciding on environment (dev/stg/prod) or state unit splitting strategies
- When documenting Terraform operational rules in docs

# Approach

1. First, refer to `docs/infra/terraform-tfaction-guidelines.md` and decide on state splitting and module boundaries
2. Create `env/<environment>/<state-unit>/` and place root modules
3. Create reusable modules in `modules/` with explicit `type` / `description` / validation
4. Update `target_groups` in `infrastructure/terraform/tfaction.yaml`
5. Update `paths` and tfaction action calls in the plan/apply workflow
6. Ensure `terraform fmt` / `validate` / `tflint` / `trivy` pass in CI

# Implementation Rules

- Manual `terraform apply` to `prod` is prohibited (CI/CD + approval flow is required)
- `terraform_remote_state` should not be used in principle
- `--target` apply is prohibited in `prod`
- Use OIDC instead of static secrets for authentication

# Reference Documents

- `docs/infra/terraform-tfaction-guidelines.md` - Terraform design standards with tfaction
- `docs/infra/tfaction.md` - tfaction configuration and workflows
- `docs/infra/ci-cd.md` - CI/CD and authentication design
- `docs/infra/terraform.md` - Terraform basic conventions
