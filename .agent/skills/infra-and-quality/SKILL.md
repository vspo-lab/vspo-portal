---
name: Infrastructure & Code Quality
description: Terraform (GCP), CI/CD (tfaction/GitHub Actions), security scanning, Biome lint, knip.
---

# Trigger Conditions

- When editing files under `infrastructure/`
- When modifying CI/CD workflows (`.github/workflows/`)
- When running code quality checks (biome, knip, type-check)

# Reference Documents

- `docs/infra/terraform-tfaction-guidelines.md` - Terraform design guidelines (tfaction-based)
- `docs/infra/terraform.md` - Terraform design (modules/env separation, naming conventions, state management)
- `docs/infra/tfaction.md` - tfaction workflow (PR -> Plan, Merge -> Apply)
- `docs/infra/ci-cd.md` - CI/CD pipeline (Workload Identity authentication)
- `docs/infra/multi-cloud-best-practices.md` - AWS/GCP/Azure/Cloudflare infrastructure best practices
- `docs/security/lint.md` - Security/lint rules
