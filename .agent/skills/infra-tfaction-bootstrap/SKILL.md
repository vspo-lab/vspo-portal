---
name: インフラ構築（tfactionベース）
description: Terraformの設計・実装をtfaction中心で進めるためのスキル。state分割、module設計、GitHub Actions連携を標準化する。
---

# トリガー条件

- `infrastructure/terraform/` 配下で新規構築・構成変更を行うとき
- `.github/workflows/terraform-*.yml` を追加・更新するとき
- 環境（dev/stg/prod）や state 単位の分割方針を決めるとき
- Terraform の運用ルールを docs 化するとき

# 進め方

1. 最初に `docs/infra/terraform-tfaction-guidelines.md` を参照し、state 分割と module 境界を決める
2. `env/<environment>/<state-unit>/` を作成し、ルートモジュールを配置する
3. `modules/` に再利用モジュールを作成し、`type` / `description` / validation を明示する
4. `infrastructure/terraform/tfaction.yaml` の `target_groups` を更新する
5. plan/apply workflow の `paths` と tfaction action 呼び出しを更新する
6. `terraform fmt` / `validate` / `tflint` / `trivy` が CI で通る状態にする

# 実装ルール

- `prod` への手動 `terraform apply` は禁止（CI/CD + 承認フローを必須化）
- `terraform_remote_state` は原則使用しない
- `--target` apply は `prod` で禁止
- 認証情報は固定シークレットではなく OIDC を利用する

# 参照ドキュメント

- `docs/infra/terraform-tfaction-guidelines.md` - tfaction前提のTerraform設計標準
- `docs/infra/tfaction.md` - tfactionの設定とワークフロー
- `docs/infra/ci-cd.md` - CI/CDと認証設計
- `docs/infra/terraform.md` - Terraform基本規約
