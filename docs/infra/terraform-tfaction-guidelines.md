# Terraform + tfaction Operational Standards

This document summarizes the combined operational standards. For detailed guidance, see the dedicated docs:

- **Terraform design & conventions**: [terraform.md](./terraform.md)
- **tfaction workflows & configuration**: [tfaction.md](./tfaction.md)

## Core Principles

1. Terraform execution uses GitHub Actions + tfaction (`plan` on PR, `apply` after merge)
2. `prod` requires IaC; no manual drift allowed
3. Remote state, separated per environment
4. Flat module structure; no over-abstraction
5. OIDC authentication; no long-lived secrets

## Security Policy

- GitHub OIDC (Workload Identity Federation) for authentication
- Separate execution roles for `plan` and `apply`
- Local `apply` prohibited except for `dev`
- `--target` apply prohibited for `prod`

## Quick Checklists

### Adding a New State Unit

1. Create `env/<environment>/<state-unit>/`
2. Add `backend` config and pin provider versions
3. Update `target_groups` in root `tfaction.yaml`
4. Update `paths` in plan/apply workflows

### Adding a New Module

1. Create `modules/<module_name>/` with `main.tf`, `variables.tf`, `outputs.tf`
2. Document input `type`/`description` with validation
3. Reference via relative path from caller
4. Verify plan for affected environments

## References

- [Future Architect Terraform Guidelines](https://future-architect.github.io/arch-guidelines/documents/forTerraform/terraform_guidelines.html)
- [HashiCorp Terraform Style](https://developer.hashicorp.com/terraform/language/style)
- [tfaction Docs](https://suzuki-shunsuke.github.io/tfaction/)
