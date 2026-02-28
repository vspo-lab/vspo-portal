---
name: インフラ・コード品質
description: Terraform（GCP）、CI/CD（tfaction/GitHub Actions）、セキュリティスキャン、Biome lint、knip。
---

# トリガー条件

- `infrastructure/` 配下のファイルを編集するとき
- CI/CD ワークフロー（`.github/workflows/`）を修正するとき
- コード品質チェック（biome, knip, type-check）を実行するとき

# 参照ドキュメント

- `docs/infra/terraform-tfaction-guidelines.md` - Terraform設計ガイドライン（tfactionベース）
- `docs/infra/terraform.md` - Terraform設計（modules/env分離、命名規則、State管理）
- `docs/infra/tfaction.md` - tfactionワークフロー（PR→Plan, Merge→Apply）
- `docs/infra/ci-cd.md` - CI/CDパイプライン（Workload Identity認証）
- `docs/infra/multi-cloud-best-practices.md` - AWS/GCP/Azure/Cloudflare のインフラ構築ベストプラクティス
- `docs/security/lint.md` - セキュリティ/lintルール
