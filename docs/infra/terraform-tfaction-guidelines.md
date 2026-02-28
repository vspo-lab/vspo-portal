# Terraform 設計ガイドライン（tfaction ベース）

## 目的

このドキュメントは、Terraform 設計ガイドラインをベースにしつつ、このテンプレートで採用する **tfaction 中心の運用標準** を定義する。

- 対象: `infrastructure/terraform/` と `.github/workflows/terraform-*.yml`
- 前提: Pull Request ベースで `plan`、マージ後に `apply`
- 更新日: 2026-02-28

## 基本方針

1. Terraform 実行は GitHub Actions + tfaction を基本経路にする
2. `prod` は IaC 適用を必須とし、手動差分を残さない
3. `state` はリモート管理し、環境ごとに分離する
4. モジュールはフラット構成を維持し、過剰な抽象化を避ける
5. 認証は OIDC を使い、長期シークレットを置かない

## 標準ディレクトリ構成

```text
infrastructure/terraform/
├── tfaction.yaml
├── .tflint.hcl
├── env/
│   ├── dev/
│   │   ├── network/
│   │   ├── platform/
│   │   └── app/
│   ├── stg/
│   └── prod/
└── modules/
    ├── network_core/
    ├── platform_identity/
    └── app_runtime/
```

- `env/*/*` は Terraform を直接実行するルートモジュール（state 単位）
- `modules/*` は再利用前提の子モジュール
- `state` 分割は「ライフサイクル差」と「オーナー差」を基準にする

## State 設計ルール

- ローカル state は禁止。オブジェクトストレージのリモート state を使う
- `dev/stg/prod` で state を分離する
- 1 state あたりのリソース数は目安として 100 以下を保つ
- `terraform_remote_state` 参照は原則避け、Data Source + 命名規則で参照する
- state バケットは専用化し、バージョニングと削除保護を有効化する

## モジュール設計ルール

- モジュール標準構成は `main.tf`, `variables.tf`, `outputs.tf`
- `variables.tf` / `outputs.tf` は `type` と `description` を必須にする
- 入力変数は必要最小限に絞る。`any` は使わない
- ネストモジュール（module から module 呼び出し）は原則禁止
- 単一リソースを薄く包むだけのモジュールは作らない

## 命名・ファイルルール

- リソース名・変数名は `snake_case`
- リソース名にリソース種別を重複させない
- ルートモジュールは `main.tf` 集約 + 標準補助ファイル（`providers.tf`, `terraform.tf`, `locals.tf`, `variables.tf`）で構成する
- `terraform fmt`, `terraform validate`, `tflint`, `trivy` を CI で必須実行する

## バージョン管理

- Terraform / Provider は完全一致で固定する（例: `= 1.14.2`）
- 実行バージョンは `.terraform-version` と `required_version` を同期させる
- バージョンアップは定期運用（四半期または半期）でまとめて実施する

## tfaction 標準構成

### ルート設定（`infrastructure/terraform/tfaction.yaml`）

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

### GitHub Actions の最小構成

- `plan`: `pull_request` トリガーで `list-targets` -> `test` -> `plan`
- `apply`: `push` トリガーで `list-targets` -> `apply`
- 必須 env:
  - `TFACTION_TARGET`
  - `TFACTION_WORKING_DIR`
  - `TFACTION_JOB_TYPE`
  - `TFACTION_IS_APPLY`（apply workflow のみ）
- 失敗時は `create-follow-up-pr` で復旧 PR を作成する

## セキュリティ方針

- 認証は GitHub OIDC（Workload Identity Federation）を利用する
- `plan` と `apply` で実行ロールを分離する
- ローカル端末からの `apply` は `dev` を除き禁止
- `prod` では `--target` apply を禁止する

## 実装チェックリスト

### 新しい state 単位を追加する場合

1. `env/<environment>/<state-unit>/` を作成
2. `backend` 設定と provider バージョン固定を追加
3. ルート `tfaction.yaml` の `target_groups` を更新
4. plan/apply workflow の `paths` を更新
5. docs と運用ルールを更新

### 新しい module を追加する場合

1. `modules/<module_name>/` を作成
2. `main.tf`, `variables.tf`, `outputs.tf` を作成
3. 入力の `type`/`description` と validation を記述
4. 呼び出し側の `main.tf` から相対パスで参照
5. 影響対象 environment の plan を確認

## 参照

- Future Terraform 設計ガイドライン:
  - https://future-architect.github.io/arch-guidelines/documents/forTerraform/terraform_guidelines.html
- HashiCorp Terraform Style:
  - https://developer.hashicorp.com/terraform/language/style
- tfaction Docs:
  - https://suzuki-shunsuke.github.io/tfaction/
