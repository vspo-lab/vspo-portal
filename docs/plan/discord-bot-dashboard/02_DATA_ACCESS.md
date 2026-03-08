# Discord Bot Dashboard - Data Access

## Overview

ダッシュボード自体は DB を持たない。すべてのデータは以下の外部ソースから取得する。

## Data Sources

### 1. Discord API (OAuth2 経由)

| Endpoint | Purpose |
| --- | --- |
| `GET /users/@me` | ログインユーザー情報 |
| `GET /users/@me/guilds` | ユーザーが参加しているサーバー一覧 |

### 2. vspo-server REST API

Bot 設定の CRUD は vspo-server の API 経由で行う。

| Operation | Endpoint (想定) | Description |
| --- | --- | --- |
| サーバー設定取得 | `GET /api/discord/guilds/{guildId}/config` | チャンネル設定一覧 |
| チャンネル設定更新 | `PUT /api/discord/guilds/{guildId}/channels/{channelId}` | 個別チャンネル設定の更新 |
| Bot 有効化 | `POST /api/discord/guilds/{guildId}/channels/{channelId}` | チャンネルへの Bot 追加 |
| Bot 無効化 | `DELETE /api/discord/guilds/{guildId}/channels/{channelId}` | チャンネルからの Bot 削除 |
| メンバー一覧取得 | `GET /api/creators` | Creator マスタデータ (既存) |

### 3. セッション管理

- Discord OAuth2 トークンは Cloudflare KV または cookie (encrypted) に保存
- セッション有効期限: Discord のアクセストークン有効期限に準拠 (デフォルト 7 日)
- リフレッシュトークンで自動更新

## DB Changes (vspo-server 側)

ダッシュボードのために vspo-server 側で必要となる変更:

1. **認証ミドルウェア**: Discord OAuth2 トークンの検証
2. **管理 API エンドポイント**: 上記テーブルの REST API 化
3. **RBAC**: `MANAGE_GUILD` パーミッション検証

TBD: vspo-server 側の具体的な実装は vspo-server リポジトリで計画する。
