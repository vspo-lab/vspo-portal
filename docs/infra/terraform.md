# Terraform Best Practices

## Overview

本プロジェクトでは **Terraform** を使用して Google Cloud Platform (GCP) のインフラストラクチャを管理しています。
Infrastructure as Code (IaC) により、インフラの変更を Git で追跡し、レビュープロセスを通じて安全にデプロイします。

tfaction ベースの運用標準と設計判断の詳細は以下を参照してください。

- `docs/infra/terraform-tfaction-guidelines.md`

## ディレクトリ構成

```
infrastructure/terraform/
├── tfaction.yaml              # tfaction ルート設定
├── .tflint.hcl                # TFLint 設定
├── env/                       # 環境別設定
│   ├── dev/                   # 開発環境
│   │   └── backend/           # Terraform バックエンド設定
│   │       ├── main.tf        # モジュール呼び出し
│   │       ├── provider.tf    # プロバイダ設定
│   │       ├── variable.tf    # 変数定義
│   │       ├── outputs.tf     # 出力定義
│   │       └── tfaction.yaml  # tfaction 個別設定
│   ├── staging/               # ステージング環境
│   └── prod/                  # 本番環境
└── modules/                   # 再利用可能モジュール
    └── terraform_backend/     # Terraform バックエンド用モジュール
        ├── terraform.tf       # サービスアカウント設定
        ├── github_oidc.tf     # GitHub OIDC 設定
        ├── state_bucket.tf    # State バケット設定
        ├── variable.tf        # 変数定義
        ├── outputs.tf         # 出力定義
        └── tfaction_module.yaml
```

### 構成原則

- **modules/**: 再利用可能なインフラコンポーネント
- **env/**: 環境ごとのルートモジュール（dev/staging/prod）
- 各環境は独立した State を持ち、相互に影響しない

---

## ファイル命名規則

### 標準ファイル構成

| ファイル名 | 用途 |
|-----------|------|
| `main.tf` | リソース定義、モジュール呼び出し |
| `provider.tf` | プロバイダとバックエンド設定 |
| `variables.tf` | 変数宣言 |
| `outputs.tf` | 出力値定義 |
| `versions.tf` | Terraform/プロバイダバージョン制約 |

### リソース命名

リソース名には **アンダースコア区切り** を使用します。

```hcl
# Good: アンダースコア区切り
resource "google_storage_bucket" "terraform_state" {
  name = "my-project-tfstate"  # name 引数はハイフン可
}

resource "google_service_account" "github_actions_sa" {
  account_id = "gha-terraform-sa"
}

# Bad: ハイフン区切り（リソース名）
resource "google_storage_bucket" "terraform-state" {  # ❌
  ...
}
```

### リソース名の簡潔化

リソースタイプで既に明確な場合、名前に冗長な情報を含めない。

```hcl
# Good: シンプルな名前
resource "google_storage_bucket" "state" { ... }

# Bad: 冗長
resource "google_storage_bucket" "state_bucket" { ... }  # ❌ bucket が重複
```

---

## モジュール設計

### モジュール構造

```
modules/
└── terraform_backend/
    ├── main.tf           # 主要リソース（または機能別ファイル）
    ├── variables.tf      # 入力変数
    ├── outputs.tf        # 出力値
    └── README.md         # モジュールドキュメント（任意）
```

### モジュール呼び出し

相対パスを使用してモジュールを呼び出します。

```hcl
# env/dev/backend/main.tf
module "terraform_backend" {
  source     = "../../../modules/terraform_backend"
  project_id = var.project_id
}
```

### 設計原則

1. **単一責任**: 1つのモジュールは1つの機能に集中
2. **入力変数**: すべての設定可能な値を変数化
3. **出力値**: 他のモジュールやリソースが参照する値を出力
4. **バージョン固定**: 外部モジュールはバージョンを固定

```hcl
# 外部モジュールの場合
module "vpc" {
  source  = "terraform-google-modules/network/google"
  version = "~> 9.0"  # バージョン固定
  ...
}
```

---

## State 管理

### Remote State 設定

GCS (Google Cloud Storage) を使用して State を管理します。

```hcl
# provider.tf
terraform {
  required_version = "1.14.2"

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "7.13.0"
    }
  }

  backend "gcs" {
    bucket = "my-app-tfstate"
    prefix = "env/dev/terraform_backend"
  }
}
```

### State バケット設定

```hcl
resource "google_storage_bucket" "state" {
  name          = "my-app-tfstate"
  force_destroy = false
  location      = "asia-northeast1"
  storage_class = "STANDARD"

  # セキュリティ設定
  uniform_bucket_level_access = true
  public_access_prevention    = "enforced"

  # バージョニング（誤削除対策）
  versioning {
    enabled = true
  }

  # ライフサイクル（古いバージョンの自動削除）
  lifecycle_rule {
    condition {
      num_newer_versions = 10
    }
    action {
      type = "Delete"
    }
  }
}
```

### State 分離のベストプラクティス

| ルール | 理由 |
|-------|------|
| 環境ごとに State を分離 | dev の変更が prod に影響しない |
| 100 リソース以下を維持 | refresh が高速、blast radius を縮小 |
| 関連リソースをグループ化 | 論理的な境界で State を分割 |

---

## 変数とアウトプット

### 変数定義

```hcl
# variables.tf
variable "project_id" {
  type        = string
  description = "The GCP project ID"
}

variable "region" {
  type        = string
  description = "The GCP region for resources"
  default     = "asia-northeast1"
}

variable "disk_size_gb" {
  type        = number
  description = "Disk size in gigabytes"
  default     = 100
}

variable "enable_public_access" {
  type        = bool
  description = "Whether to enable public access"
  default     = false
}
```

### 変数命名規則

| パターン | 例 | 説明 |
|---------|-----|------|
| 単位サフィックス | `disk_size_gb`, `timeout_seconds` | 単位を明確に |
| 正の boolean | `enable_*`, `is_*`, `has_*` | 二重否定を避ける |
| 説明必須 | `description = "..."` | すべての変数に説明 |

### アウトプット定義

```hcl
# outputs.tf
output "workload_identity_pool_name" {
  value       = google_iam_workload_identity_pool.gha_pool.name
  description = "Full resource name of the GitHub Actions Workload Identity Pool."
}

output "service_account_email" {
  value       = google_service_account.gha_terraform_sa.email
  description = "Email of the GitHub Actions Service Account."
}
```

---

## セキュリティ

### GitHub Actions OIDC 認証

Workload Identity Federation を使用して、シークレットなしで GCP 認証を行います。

```hcl
# Workload Identity Pool
resource "google_iam_workload_identity_pool" "gha_pool" {
  workload_identity_pool_id = "github-actions-pool"
}

# OIDC Provider
resource "google_iam_workload_identity_pool_provider" "gha_provider" {
  workload_identity_pool_id          = google_iam_workload_identity_pool.gha_pool.workload_identity_pool_id
  workload_identity_pool_provider_id = "github-actions"
  display_name                       = "GitHub Actions"

  attribute_mapping = {
    "google.subject"       = "assertion.sub"
    "attribute.repository" = "assertion.repository"
  }

  # リポジトリを制限
  attribute_condition = "assertion.repository == 'owner/repo'"

  oidc {
    issuer_uri = "https://token.actions.githubusercontent.com"
  }
}
```

### 最小権限の原則

サービスアカウントには必要最小限の権限のみ付与します。

```hcl
# GitHub Actions 用サービスアカウント
resource "google_service_account" "gha_terraform_sa" {
  account_id   = "gha-terraform-sa"
  display_name = "GitHub Actions Terraform SA"
}

# 必要な権限のみ付与
resource "google_project_iam_member" "terraform_editor" {
  project = var.project_id
  role    = "roles/editor"
  member  = "serviceAccount:${google_service_account.gha_terraform_sa.email}"
}
```

### データ保護

ステートフルなリソースには `prevent_destroy` を設定します。

```hcl
resource "google_sql_database_instance" "main" {
  name = "main-db"

  lifecycle {
    prevent_destroy = true  # 誤削除を防止
  }
}
```

---

## Linting & Validation

### TFLint 設定

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

### 実行方法

```bash
# TFLint
tflint --init
tflint

# Terraform Validate
terraform validate

# Trivy（セキュリティスキャン）
trivy config --severity HIGH,CRITICAL .
```

### CI での自動チェック

tfaction ワークフローで以下が自動実行されます:

1. `terraform fmt` - フォーマットチェック
2. `terraform validate` - 構文チェック
3. `tflint` - ベストプラクティスチェック
4. `trivy` - セキュリティスキャン

---

## まとめ

| カテゴリ | ベストプラクティス |
|---------|-------------------|
| 構成 | modules/ と env/ を分離 |
| 命名 | アンダースコア区切り、簡潔な名前 |
| State | 環境別分離、100 リソース以下 |
| 変数 | 説明必須、単位サフィックス |
| セキュリティ | OIDC 認証、最小権限、prevent_destroy |
| 品質 | TFLint + Trivy で自動チェック |
