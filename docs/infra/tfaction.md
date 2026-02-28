# tfaction Workflow

## Overview

**tfaction** は [suzuki-shunsuke](https://github.com/suzuki-shunsuke/tfaction) が開発した、GitHub Actions で高度な Terraform ワークフローを構築するためのフレームワークです。

### 主な特徴

- **PR でプラン、マージでアプライ**: Pull Request で `terraform plan` を実行し、マージ時に `terraform apply` を自動実行
- **モノレポ対応**: 変更されたディレクトリのみ CI を実行する動的ビルドマトリクス
- **安全なアプライ**: plan ファイルベースの apply で意図しない変更を防止
- **PR コメント通知**: tfcmt により plan 結果が PR に自動コメント
- **ドリフト検出**: 定期的にドリフトを検出し、GitHub Issue として管理

```
┌─────────────────────────────────────────────────────────────────┐
│                    tfaction Workflow                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐  │
│  │  PR作成   │ →  │  Plan    │ →  │  Review  │ →  │  Merge   │  │
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘  │
│                       │                               │          │
│                       ▼                               ▼          │
│               [Plan結果をPRに              [terraform apply     │
│                コメント]                    を自動実行]          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 設定ファイル

### tfaction.yaml（ルート設定）

プロジェクトルートに配置する tfaction の設定ファイルです。

```yaml
# infrastructure/terraform/tfaction.yaml
---
plan_workflow_name: Terraform Plan  # GitHub Actions ワークフロー名（必須）

# ローカルモジュール更新時に呼び出し元も更新
update_local_path_module_caller:
  enabled: true

# セキュリティスキャン
trivy:
  enabled: true

# Linting
tflint:
  enabled: true
  fix: true  # 自動修正

# ターゲットグループ定義
target_groups:
  - working_directory: terraform/env/dev/
    target: my-app/dev/
```

### 主要設定項目

| 項目 | 説明 | デフォルト |
|-----|------|-----------|
| `plan_workflow_name` | Plan ワークフローのファイル名（必須） | - |
| `base_working_directory` | 作業ディレクトリのベースパス | `""` |
| `working_directory_file` | 個別設定ファイル名 | `tfaction.yaml` |
| `terraform_command` | Terraform コマンド（OpenTofu 対応） | `terraform` |
| `draft_pr` | PR をドラフトで作成 | `false` |

### target_groups 設定

```yaml
target_groups:
  - working_directory: terraform/env/dev/
    target: project-name/dev/

    # GCP 認証設定
    gcp_service_account: sa@project.iam.gserviceaccount.com
    gcp_workload_identity_provider: projects/123/locations/global/...

    # 環境変数
    env:
      TF_VAR_environment: dev

    # AWS の場合
    # aws_region: ap-northeast-1
    # terraform_plan_config:
    #   aws_assume_role_arn: arn:aws:iam::123:role/terraform-plan
```

### tfaction.yaml（ワーキングディレクトリ）

各環境のディレクトリに配置し、ルート設定をオーバーライドできます。

```yaml
# infrastructure/terraform/env/dev/backend/tfaction.yaml
---
# 個別設定（オプション）
# terraform_command: tofu  # OpenTofu を使用する場合
# env:
#   TF_VAR_custom: value
```

---

## Target と Working Directory

### 概念

- **Target**: 作業ディレクトリの一意識別子。PR ラベルやコメントで使用
- **Working Directory**: 実際に Terraform を実行するディレクトリパス

```yaml
target_groups:
  - target: my-app/dev/        # Target（識別子）
    working_directory: terraform/env/dev/   # Working Directory（パス）
```

### マッチングルール

tfaction は `working_directory` のプレフィックスでターゲットグループを決定します。

```yaml
# 例: terraform/env/dev/backend/ が変更された場合
target_groups:
  - working_directory: terraform/env/dev/    # ✅ マッチ
    target: project/dev/
  - working_directory: terraform/env/prod/   # ❌ マッチしない
    target: project/prod/
```

---

## GitHub Actions ワークフロー

### Terraform Plan ワークフロー

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
  id-token: write      # OIDC 認証に必要
  contents: write      # コード変更の push に必要
  pull-requests: write # PR コメントに必要

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

      # GitHub App トークン取得
      - uses: actions/create-github-app-token@v2
        id: app-token
        with:
          app-id: ${{ secrets.MY_APP_GITHUB_APP_ID }}
          private-key: ${{ secrets.MY_APP_GITHUB_APP_PRIVATE_KEY }}

      # ツールインストール
      - uses: aquaproj/aqua-installer@v3
        with:
          aqua_version: v2.55.0

      # GCP 認証
      - uses: google-github-actions/auth@v2
        with:
          project_id: ${{ secrets.GCP_PROJECT_ID }}
          workload_identity_provider: ${{ secrets.GCP_WORKLOAD_IDENTITY_PROVIDER }}
          service_account: ${{ secrets.GCP_SERVICE_ACCOUNT }}

      # tfaction セットアップ
      - uses: suzuki-shunsuke/tfaction/setup@v1
        with:
          github_token: ${{ steps.app-token.outputs.token }}

      # テスト（tflint, trivy など）
      - uses: suzuki-shunsuke/tfaction/test@v1
        continue-on-error: true
        with:
          github_token: ${{ steps.app-token.outputs.token }}

      # Plan 実行
      - uses: suzuki-shunsuke/tfaction/plan@v1
        with:
          github_token: ${{ steps.app-token.outputs.token }}
```

### Terraform Apply ワークフロー

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
  # ... setup job（plan と同様）

  apply:
    name: Apply (${{ matrix.target.target }})
    needs: setup
    env:
      TFACTION_IS_APPLY: "true"  # Apply モードを有効化
    steps:
      # ... checkout, auth steps

      - uses: suzuki-shunsuke/tfaction/apply@v1
        with:
          github_token: ${{ steps.app-token.outputs.token }}

      # Apply 失敗時のフォローアップ PR 作成
      - uses: suzuki-shunsuke/tfaction/create-follow-up-pr@v1
        if: failure()
        with:
          github_token: ${{ steps.app-token.outputs.token }}
```

---

## GCP 認証設定

### Workload Identity Federation

GitHub Actions から GCP へシークレットなしで認証します。

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

  # リポジトリ制限（重要）
  attribute_condition = "assertion.repository == 'owner/repo'"

  oidc {
    issuer_uri = "https://token.actions.githubusercontent.com"
  }
}
```

### GitHub Secrets 設定

| Secret | 説明 |
|--------|------|
| `GCP_PROJECT_ID` | GCP プロジェクト ID |
| `GCP_WORKLOAD_IDENTITY_PROVIDER` | Workload Identity Provider のフルパス |
| `GCP_SERVICE_ACCOUNT` | サービスアカウントのメールアドレス |
| `MY_APP_GITHUB_APP_ID` | GitHub App ID |
| `MY_APP_GITHUB_APP_PRIVATE_KEY` | GitHub App 秘密鍵 |

---

## Drift Detection

### 設定

```yaml
# tfaction.yaml
drift_detection:
  enabled: true
  issue_repo_owner: owner
  issue_repo_name: repo
  num_of_issues: 3              # 最大同時 Issue 数
  minimum_detection_interval: 1  # 最小検出間隔（日）
```

### 動作

1. 定期的（Scheduled）に `terraform plan` を実行
2. 差分が検出されたら GitHub Issue を作成
3. Issue にはドリフト内容と修正手順が記載

---

## モジュール管理

### tfaction_module.yaml

モジュールディレクトリに配置して tfaction に認識させます。

```yaml
# infrastructure/terraform/modules/terraform_backend/tfaction_module.yaml
---
# 空でも可。配置することでモジュールとして認識
```

### バージョン管理

ローカルモジュールの代わりに、タグ付きの GitHub Source を推奨します。

```hcl
# ローカルパス（開発中）
module "vpc" {
  source = "../../../modules/vpc"
}

# GitHub Source（本番推奨）
module "vpc" {
  source = "git::https://github.com/owner/repo.git//modules/vpc?ref=v1.0.0"
}
```

---

## ベストプラクティス

### 認証

| 推奨 | 理由 |
|-----|------|
| GitHub App を使用 | PAT より安全、きめ細かい権限制御 |
| Workload Identity | シークレット不要、自動ローテーション |

### ツール管理

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

### セキュリティ

1. **trivy**: インフラ設定の脆弱性スキャン
2. **tflint**: Terraform ベストプラクティスチェック
3. **attribute_condition**: OIDC でリポジトリを制限

### 運用

| プラクティス | 説明 |
|------------|------|
| PR で Plan 確認 | Apply 前に変更内容をレビュー |
| マージで自動 Apply | 手動 Apply を排除 |
| Follow-up PR | Apply 失敗時の自動修復 PR |
| Drift Detection | 手動変更の検出と修正 |

---

## 参考リンク

- [tfaction 公式ドキュメント](https://suzuki-shunsuke.github.io/tfaction/docs/)
- [tfaction GitHub リポジトリ](https://github.com/suzuki-shunsuke/tfaction)
- [tfaction Getting Started](https://github.com/suzuki-shunsuke/tfaction-getting-started)
