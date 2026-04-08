# Cloud Infrastructure Best Practices

This project deploys to **Cloudflare Workers** with GCP for Terraform state. For project-specific infrastructure, see [cloudflare-workers.md](./cloudflare-workers.md) and [terraform.md](./terraform.md).

## Universal Principles

1. IaC as the sole change path (Terraform). Manual changes are exceptional.
2. Separate state and permissions per environment. Use short-lived credentials (OIDC).
3. Embed policy/scanning into CI pipeline.

## Cloudflare Terraform Practices

- Separate directories by account, zone, and product for clear ownership
- Environment separation (staging/prod) via account and domain separation
- Account API Tokens scoped per purpose with minimal permissions (explicit Read/Edit)
- R2 as remote backend when needed

## GCP (Terraform State Only)

- See [terraform.md](./terraform.md) for state bucket config and OIDC setup
- Follow [GCP Terraform best practices](https://cloud.google.com/docs/terraform/best-practices-for-terraform) for style and modules

## References

- [Cloudflare Terraform best practices](https://developers.cloudflare.com/terraform/advanced-topics/best-practices/)
- [Cloudflare Remote R2 backend](https://developers.cloudflare.com/terraform/advanced-topics/remote-backend/)
- [GCP Well-Architected Framework](https://cloud.google.com/architecture/framework)
- [AWS Well-Architected Framework](https://docs.aws.amazon.com/wellarchitected/latest/framework/welcome.html)
- [Azure Well-Architected Framework](https://learn.microsoft.com/en-us/azure/well-architected/)
