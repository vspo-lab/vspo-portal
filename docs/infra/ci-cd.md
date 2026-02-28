# Infrastructure CI/CD

## Overview

本プロジェクトでは、GitHub Actions と tfaction を使用してインフラストラクチャの CI/CD パイプラインを構築しています。
すべてのインフラ変更は Pull Request を通じてレビューされ、マージ時に自動的にデプロイされます。

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     Infrastructure CI/CD Pipeline                        │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────┐    ┌───────────────┐    ┌──────────┐    ┌──────────────┐  │
│  │ PR 作成   │ →  │  CI (Plan)    │ →  │ Review   │ →  │ Merge        │  │
│  └──────────┘    └───────────────┘    └──────────┘    └──────────────┘  │
│                         │                                    │           │
│                         ▼                                    ▼           │
│              ┌─────────────────────┐              ┌─────────────────┐   │
│              │ - terraform plan    │              │ CD (Apply)      │   │
│              │ - tflint            │              │ - terraform     │   │
│              │ - trivy scan        │              │   apply         │   │
│              │ - PR コメント        │              │ - follow-up PR  │   │
│              └─────────────────────┘              └─────────────────┘   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## ワークフロー構成

### ファイル一覧

| ファイル | トリガー | 目的 |
|---------|---------|------|
| `terraform-plan-dev.yml` | PR to `develop` | dev 環境の Plan |
| `terraform-apply-dev.yml` | Push to `develop` | dev 環境の Apply |
| `terraform-plan-prod.yml` | PR to `main` | prod 環境の Plan |
| `terraform-apply-prod.yml` | Push to `main` | prod 環境の Apply |

### トリガー条件

```yaml
# Plan ワークフロー
on:
  pull_request:
    branches:
      - develop
    paths:
      - 'infrastructure/terraform/env/dev/**'
      - 'infrastructure/terraform/modules/**'
      - .github/workflows/terraform-plan-dev.yml

# Apply ワークフロー
on:
  push:
    branches:
      - develop
    paths:
      - 'infrastructure/terraform/env/dev/**'
      - 'infrastructure/terraform/modules/**'
```

---

## CI ワークフロー（Plan）

### ジョブ構成

```
┌─────────────────────────────────────────────────────────────┐
│                    terraform-plan-dev.yml                    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐                                           │
│  │   setup      │  変更されたターゲットを検出                │
│  └──────┬───────┘                                           │
│         │                                                    │
│         ▼                                                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  plan (dev1) │  │  plan (dev2) │  │  plan (devN) │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│   並列実行（Matrix Strategy）                                │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 実行ステップ

1. **Checkout**: リポジトリをチェックアウト
2. **Tool Install**: aqua で Terraform, TFLint, Trivy をインストール
3. **GCP Auth**: Workload Identity で GCP 認証
4. **Setup**: tfaction のセットアップ
5. **Test**: TFLint, Trivy によるチェック
6. **Plan**: `terraform plan` を実行し、結果を PR にコメント

### 必要な権限

```yaml
permissions:
  id-token: write      # OIDC 認証
  contents: write      # 自動コミット（format 修正等）
  pull-requests: write # PR コメント
```

### 並行実行制御

```yaml
concurrency:
  group: my-app
  cancel-in-progress: false  # 進行中のジョブをキャンセルしない
```

---

## CD ワークフロー（Apply）

### 実行ステップ

1. **Checkout**: リポジトリをチェックアウト
2. **Tool Install**: aqua でツールインストール
3. **GCP Auth**: Workload Identity で GCP 認証
4. **Setup**: tfaction のセットアップ
5. **Apply**: `terraform apply` を実行
6. **Follow-up PR**: Apply 失敗時に修復 PR を自動作成

### Apply フラグ

```yaml
env:
  TFACTION_IS_APPLY: "true"  # Apply モードを有効化
```

### 失敗時の自動復旧

```yaml
- name: Follow up PR
  uses: suzuki-shunsuke/tfaction/create-follow-up-pr@v1
  if: failure()
  with:
    github_token: ${{ steps.app-token.outputs.token }}
```

---

## 環境分離

### ブランチ戦略

```
main (本番)
  ↑
  └── PR (terraform-plan-prod → terraform-apply-prod)

develop (開発)
  ↑
  └── PR (terraform-plan-dev → terraform-apply-dev)

feature/*
  └── 開発ブランチ
```

### ディレクトリ構成

```
infrastructure/terraform/
├── env/
│   ├── dev/           # 開発環境 → develop ブランチ
│   ├── staging/       # ステージング → staging ブランチ
│   └── prod/          # 本番環境 → main ブランチ
└── modules/           # 共有モジュール（全環境で使用）
```

### State 分離

各環境は独立した GCS バケットプレフィックスを使用します。

```hcl
# dev 環境
backend "gcs" {
  bucket = "project-tfstate"
  prefix = "env/dev/terraform_backend"
}

# prod 環境
backend "gcs" {
  bucket = "project-tfstate"
  prefix = "env/prod/terraform_backend"
}
```

---

## セキュリティスキャン

### Trivy

インフラ設定の脆弱性をスキャンします。

```yaml
env:
  TRIVY_SEVERITY: HIGH,CRITICAL
  TRIVY_SKIP_DIRS: ".terraform"
```

#### 検出対象

- Terraform 設定の脆弱性
- クラウドリソースのミス設定
- シークレットの露出

### TFLint

Terraform のベストプラクティスをチェックします。

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

### gitleaks（手動スキャン）

シークレット漏洩をチェックします。

```bash
# ローカルで実行
gitleaks detect --source . --verbose
```

---

## ツール管理

### aqua.yaml

すべての CI ツールは aqua で管理し、バージョンを固定します。

```yaml
# aqua.yaml
registries:
  - type: standard
    ref: v4.300.0

packages:
  - name: hashicorp/terraform@v1.14.2
  - name: terraform-linters/tflint@v0.54.0
  - name: aquasecurity/trivy@v0.67.2
  - name: terraform-docs/terraform-docs@v0.20.0
  - name: GoogleCloudPlatform/cloud-sdk@534.0.0
  - name: reviewdog/reviewdog@v0.20.3
```

### バージョン更新

Renovate または Dependabot で自動更新を管理します。

```json
// renovate.json
{
  "extends": ["config:base"],
  "packageRules": [
    {
      "matchManagers": ["terraform"],
      "groupName": "terraform"
    }
  ]
}
```

---

## Secrets 管理

### 必要な GitHub Secrets

| Secret | 説明 | 設定方法 |
|--------|------|---------|
| `GCP_PROJECT_ID` | GCP プロジェクト ID | Settings > Secrets |
| `GCP_WORKLOAD_IDENTITY_PROVIDER` | WIF プロバイダのパス | Terraform output から取得 |
| `GCP_SERVICE_ACCOUNT` | サービスアカウント | Terraform output から取得 |
| `MY_APP_GITHUB_APP_ID` | GitHub App ID | GitHub App 設定から取得 |
| `MY_APP_GITHUB_APP_PRIVATE_KEY` | GitHub App 秘密鍵 | GitHub App 設定から取得 |

### Environment 設定

```yaml
jobs:
  plan:
    environment: production  # GitHub Environment を使用
```

GitHub Environment を使用することで:
- デプロイメント保護ルールを適用
- 環境固有の Secrets を管理
- 承認フローを追加可能

---

## トラブルシューティング

### Plan が失敗する場合

1. **認証エラー**: GCP Secrets が正しく設定されているか確認
2. **権限エラー**: サービスアカウントの権限を確認
3. **State ロック**: 他のジョブが State をロックしていないか確認

### Apply が失敗する場合

1. **Follow-up PR を確認**: 自動作成された PR を確認
2. **Plan との差分**: マージ後に他の変更が入っていないか確認
3. **リソース制限**: クォータや制限に達していないか確認

### ドリフトが検出された場合

1. **Issue を確認**: GitHub Issue でドリフト内容を確認
2. **原因調査**: 手動変更やコンソール操作を特定
3. **修正 PR 作成**: Terraform コードを修正して PR を作成

---

## まとめ

| フェーズ | アクション | ツール |
|---------|----------|--------|
| CI (Plan) | 変更検出 → Lint → Scan → Plan | tfaction, tflint, trivy |
| Review | Plan 結果確認 → 承認 | GitHub PR |
| CD (Apply) | Apply → Follow-up PR | tfaction |
| 監視 | Drift Detection | tfaction |
