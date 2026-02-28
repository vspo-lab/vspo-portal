---
name: 構成図作成（draw.io MCP）
description: draw.io MCPサーバー（open_drawio_mermaid / open_drawio_xml）で構成図を作成し、docs/infra/diagrams に反映する。
user_invocable: true
---

# トリガー条件

- 構成図、アーキテクチャ図、システム図、ネットワーク図の作成依頼
- draw.io / diagrams.net を使った図作成依頼
- `open_drawio_mermaid` や `open_drawio_xml` を指定されたとき

# 実行手順

1. `docs/` から対象システムの構成要素と依存関係を抽出する
2. まず `open_drawio_mermaid` で図を作る（標準）
3. 厳密レイアウトが必要な場合のみ `open_drawio_xml` を使う
4. 図の成果物を `docs/infra/diagrams/` に保存し、対応する docs を更新する

# ルール

- 構成図作成は draw.io MCP を優先する
- 図だけ作って終わらず、意図・読み方を `docs/` に残す
- 命名は `kebab-case` を使い、用途が分かるファイル名にする

# 参照ドキュメント

- `docs/infra/drawio-mcp.md` - 導入設定、運用手順、参考リンク
- `docs/web-frontend/architecture.md` - フロントエンド構成
- `docs/backend/server-architecture.md` - バックエンド構成
- `docs/infra/ci-cd.md` - CI/CD と Terraform 構成
