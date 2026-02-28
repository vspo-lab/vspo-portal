# マルチクラウド インフラ構築ベストプラクティス（AWS / GCP / Azure / Cloudflare）

## 概要

このドキュメントは、AWS / GCP / Azure / Cloudflare でインフラを設計・運用するときの実践指針を、各クラウドの一次情報（公式ドキュメント）に基づいて整理したものです。  
調査日: 2026-02-28

## 共通原則（4クラウド共通）

1. **Well-Architected系フレームワークを最上位原則にする**
   - まず各クラウドの公式フレームワークで非機能要件（セキュリティ、可用性、コスト、運用）を定義する。
2. **Landing Zone / 基盤層を先に作る**
   - アカウント/サブスクリプション/プロジェクト分離、IAM、ネットワーク、ログ集約を先行実装する。
3. **IaCを唯一の変更経路にする**
   - Terraformなどで宣言的に管理し、手動変更は例外運用に限定する。
4. **Stateと権限を分離する**
   - 環境ごとにStateを分離し、CI/CDは短命クレデンシャル（OIDCなど）＋最小権限を徹底する。
5. **ポリシー/監査/スキャンをパイプラインに組み込む**
   - Policy as Code、静的解析、監査ログの中央集約を標準化する。

## クラウド別ベストプラクティス

### AWS

1. **設計基準**
   - AWS Well-Architected Framework（2024-11-06版）を設計レビュー基準にする。
2. **組織設計（Landing Zone / Multi-account）**
   - AWS Control Tower + AWS Organizations をベースに multi-account を前提化する。
   - ワークロード分離は「複数アカウント」を基本とし、管理アカウントへのワークロード配置を避ける。
3. **Terraform運用**
   - AWS Prescriptive Guidance に沿って、以下を標準化する:
     - OIDC連携で短命クレデンシャル化（GitHub Actions/GitLab）
     - 最小権限IAM、Secrets Manager活用
     - S3リモートバックエンド + 環境別バックエンド分離
     - Stateのバージョニング/監査ログ（CloudTrail）とCIでのバージョンチェック

### GCP

1. **設計基準**
   - Google Cloud Well-Architected Framework（Last reviewed: 2026-01-28）を採用する。
2. **基盤設計（Foundation）**
   - Enterprise foundations blueprint を参照し、組織階層・組織ポリシー・ログ集約・シークレット管理を標準化する。
3. **Terraform運用**
   - Terraform best practices（general style / reusable modules）に沿って、以下を徹底する:
     - 命名規約の統一（識別子の一貫性）
     - 目的単位のファイル分割（過分割しない）
     - モジュールとルート構成の分離、`docs/`への補助文書配置

### Azure

1. **設計基準**
   - Azure Well-Architected Framework の 5 Pillars（Reliability / Security / Cost Optimization / Operational Excellence / Performance Efficiency）で非機能要件を固定する。
2. **Landing Zone設計**
   - Platform Landing Zone と Application Landing Zone を分離し、管理グループとポリシー継承で統制する。
3. **Terraform運用**
   - Azure Verified Modules (AVM) for Platform Landing Zones（2025-01-21）と Azure landing zone accelerator を優先する。
   - ブートストラップでリポジトリ/パイプライン/State管理基盤を先に作成し、以降はCI/CD経由で更新する。

### Cloudflare

1. **Terraform適用方針**
   - Cloudflare公式のTerraform Best Practicesに沿って、対象リソースはTerraform側で一元管理する。
2. **構成分離**
   - アカウント・ゾーン・プロダクト単位でディレクトリを分離し、所有権とStateスコープを明確化する。
   - 環境（staging/QA/UAT/prod）はアカウント・ドメイン分離を推奨。
3. **認証・State管理**
   - APIトークンは用途に応じて Account API Token を使い、権限は必要最小化（Read/Editを明示選択）。
   - 必要に応じてR2をリモートバックエンドとして使い、ローカルStateを移行する。

## 実装チェックリスト（最小セット）

1. 全クラウドで「設計基準フレームワーク」を1つずつ選定済み
2. Landing Zone（組織構造・ネットワーク・IAM・監査ログ）の初期構築完了
3. IaCリポジトリで環境分離（dev/stg/prod）とState分離を実装済み
4. CI/CDで `plan -> review -> apply` とセキュリティスキャンを実装済み
5. 短命クレデンシャル（OIDC等）へ移行し、長期シークレットを排除済み
6. 例外的な手動変更を検出・ドリフト修復する運用手順を定義済み

## 参照（一次情報）

### AWS
- [AWS Well-Architected Framework](https://docs.aws.amazon.com/wellarchitected/latest/framework/welcome.html)
- [Best practices for using the Terraform AWS Provider (AWS Prescriptive Guidance)](https://docs.aws.amazon.com/prescriptive-guidance/latest/terraform-aws-provider-best-practices/introduction.html)
- [Landing zone (AWS Prescriptive Guidance)](https://docs.aws.amazon.com/prescriptive-guidance/latest/strategy-migration/aws-landing-zone.html)
- [Organizing Your AWS Environment Using Multiple Accounts (AWS Whitepaper, Publication date: 2025-04-30)](https://docs.aws.amazon.com/whitepapers/latest/organizing-your-aws-environment/organizing-your-aws-environment.html)

### GCP
- [Google Cloud Well-Architected Framework (Last reviewed: 2026-01-28)](https://cloud.google.com/architecture/framework)
- [Best practices for general style and structure (Terraform on Google Cloud, Last updated: 2026-02-25)](https://cloud.google.com/docs/terraform/best-practices-for-terraform)
- [Best practices for reusable modules (Terraform on Google Cloud, Last updated: 2026-02-25)](https://docs.cloud.google.com/docs/terraform/best-practices/reusable-modules)
- [Enterprise foundations blueprint (Last updated: 2025-05-15)](https://cloud.google.com/architecture/security-foundations)

### Azure
- [Azure Well-Architected Framework](https://learn.microsoft.com/en-us/azure/well-architected/)
- [What is an Azure landing zone? (Last updated: 2025-12-15)](https://learn.microsoft.com/en-us/azure/cloud-adoption-framework/ready/landing-zone/)
- [Platform landing zone implementation options (Last updated: 2025-12-15)](https://learn.microsoft.com/en-us/azure/cloud-adoption-framework/ready/landing-zone/implementation-options)
- [Azure Verified Modules for Platform Landing Zones (ALZ) (Article date: 2025-01-21)](https://learn.microsoft.com/en-us/azure/cloud-adoption-framework/ready/landing-zone/terraform-landing-zone)

### Cloudflare
- [Cloudflare Terraform provider overview (Last updated: 2025-03-14)](https://developers.cloudflare.com/terraform/)
- [Cloudflare Terraform best practices (Last updated: 2025-05-29)](https://developers.cloudflare.com/terraform/advanced-topics/best-practices/)
- [Remote R2 backend (Last updated: 2025-11-07)](https://developers.cloudflare.com/terraform/advanced-topics/remote-backend/)
- [Create API token (Last updated: 2026-02-09)](https://developers.cloudflare.com/fundamentals/api/get-started/create-token/)
- [Cloudflare Reference Architectures (Last updated: 2024-12-30)](https://developers.cloudflare.com/reference-architecture/)
