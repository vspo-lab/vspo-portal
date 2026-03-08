# Discord Bot Dashboard - Overview

## Purpose

Discord サーバー管理者が、vspo-server の Discord Bot (`/spodule setting`) の設定を Web UI 上で管理できるダッシュボードを提供する。
現在は Discord のスラッシュコマンドでのみ設定可能だが、Web 画面により一覧性・操作性を向上させる。

## Background

- vspo-server の Discord Bot は `/spodule setting` コマンドで、チャンネルごとの言語設定・メンバータイプフィルター・カスタムメンバー選択などを管理している
- Discord のコンポーネント UI は操作が煩雑で、設定の全体像が把握しづらい
- Web UI を提供することで、サーバー管理者がより直感的に設定を管理できるようにする

## Scope

### In Scope

1. **Discord OAuth2 認証**: サーバー管理者のログイン/ログアウト
2. **サーバー一覧**: Bot が導入されているサーバーの一覧表示
3. **チャンネル設定管理**:
   - Bot が有効なチャンネルの一覧
   - チャンネルごとの言語設定の変更
   - メンバータイプフィルターの変更 (VSPO JP / EN / All / Custom)
   - カスタムメンバー選択の管理
4. **Bot の有効化/無効化**: チャンネル単位での Bot の追加・削除
5. **設定プレビュー**: 現在の設定内容の確認

### Out of Scope

- Bot そのものの開発・修正 (vspo-server 側)
- 通知履歴の閲覧
- メンバーマスタデータの編集
- Analytics / 統計ダッシュボード

## Tech Stack

| Layer | Technology |
| --- | --- |
| Framework | React Router v7 (Framework mode) |
| Bundler | Vite |
| UI Library | TBD (Tailwind CSS + shadcn/ui or MUI) |
| Language | TypeScript |
| Auth | Discord OAuth2 (Authorization Code Grant) |
| Deployment | Cloudflare Workers (via React Router Cloudflare adapter) |
| API Client | vspo-server REST API |
| Validation | Zod |
| Error Handling | `@vspo-lab/error` (Result type) |

## App Location

```
service/bot-dashboard/
```

Monorepo の `service/` 配下に新規アプリとして配置する。

## Success Criteria

- Discord OAuth2 でログインし、管理権限を持つサーバーの Bot 設定を閲覧・変更できる
- vspo-server の既存 API (または新規追加 API) 経由で設定が反映される
- モバイル対応のレスポンシブ UI
- Cloudflare Workers 上で動作する

## Dependencies

- **vspo-server**: Bot 設定管理用 REST API の提供が必要 (04_API_INTERFACE.md で詳述)
- **Discord Developer Portal**: OAuth2 アプリケーション設定
- **Cloudflare**: Workers デプロイ環境
