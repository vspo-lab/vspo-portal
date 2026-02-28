# Draw.io MCP で構成図を作成する

## 調査サマリ

調査日: 2026-02-28

`drawio-mcp` 公式リポジトリでは、構成図作成の方式として以下が提示されている。

1. MCP App Server (`https://mcp.draw.io/mcp`)
2. MCP Tool Server (`@drawio/mcp`)
3. Skill + CLI (`.drawio` ファイル生成)
4. Project Instructions（MCP不要）

このテンプレートでは、**Claude Code で再現性高く運用できる `MCP Tool Server` を標準採用**する。

- 理由1: `open_drawio_mermaid` / `open_drawio_xml` / `open_drawio_csv` を直接使える
- 理由2: プロジェクトの `.mcp.json` にコミットしてチーム共有しやすい
- 理由3: Claude の `settings.json` の `permissions.allow` と合わせて運用ルールを明示できる

## プロジェクト標準設定

### 1. MCP サーバー定義（プロジェクトスコープ）

プロジェクトルートの `.mcp.json`:

```json
{
  "mcpServers": {
    "drawio": {
      "command": "npx",
      "args": ["@drawio/mcp"],
      "env": {}
    }
  }
}
```

### 2. Claude Code 許可設定

プロジェクトルートの `.claude/settings.json`:

- `permissions.allow` に読取系コマンド（`ls`, `cat`, `grep`, `rg`）
- Git 参照系コマンド（`git diff`, `git log`, `git show`）

## 構成図作成フロー（標準）

1. 既存 docs から構成要素を抽出する（frontend/backend/infra/domain）
2. まず `open_drawio_mermaid` でドラフトを作成する
3. レイアウト調整が必要なら `open_drawio_xml` に切り替える
4. 最終成果物を `docs/infra/diagrams/` に `.drawio` として保存する
5. 変更意図と図の読み方をこの `docs/infra/` 配下の markdown に追記する

## このテンプレートの初期図

- `docs/infra/diagrams/template-services-architecture.drawio`

この図は以下の責務分離を示す。

- Browser / Next.js Web / Hono API / Database
- OAuth Provider（Google）
- Terraform + GitHub Actions による IaC とデプロイ

## 推奨プロンプト例

- `draw.io MCPで、このリポジトリの全体構成図を作成して。まずopen_drawio_mermaidを使って。`
- `open_drawio_xmlで、web/api/dbの通信経路を色分けした版を作って。`

## 参考

- drawio-mcp 公式: https://github.com/jgraph/drawio-mcp
- drawio-mcp tool server: https://github.com/jgraph/drawio-mcp/tree/main/mcp-tool-server
- Claude Code MCP: https://docs.anthropic.com/en/docs/claude-code/mcp
- Claude Code settings/permissions: https://docs.anthropic.com/en/docs/claude-code/settings
