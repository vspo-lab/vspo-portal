# Discord Bot Dashboard - API Interface

## Overview

ダッシュボードが利用する API を定義する。
ダッシュボード自体は BFF (Backend for Frontend) として機能し、Discord API と vspo-server API を橋渡しする。

## Architecture

```
Browser <-> React Router (CF Workers) <-> Discord API
                                      <-> vspo-server API
```

React Router の server-side loader/action が BFF として機能する。
ブラウザから直接 Discord API や vspo-server API を呼ばない。

## Dashboard Routes (React Router)

### Auth Routes

#### `GET /auth/discord`
Discord OAuth2 Authorization URL へリダイレクト。

**Query Parameters**: なし
**Response**: 302 redirect to Discord

#### `GET /auth/callback`
Discord からのコールバック処理。

**Query Parameters**: `code`, `state`
**Response**: 302 redirect to `/dashboard`
**Errors**: 401 (invalid code), 400 (missing params)

#### `POST /auth/logout`
セッション破棄。

**Response**: 302 redirect to `/`

### Dashboard Routes

#### `GET /dashboard` (loader)
ユーザーのサーバー一覧を取得。

**Response Data**:
```typescript
{
  user: DiscordUser,
  guilds: GuildSummary[]  // isAdmin=true のもののみ
}
```

#### `GET /dashboard/:guildId` (loader)
サーバーの Bot 設定を取得。

**Response Data**:
```typescript
{
  guild: GuildSummary,
  config: GuildBotConfig,
  availableChannels: { id: string, name: string }[],  // Bot 未追加のチャンネル
  creators: Creator[]  // カスタムメンバー選択用
}
```

#### `POST /dashboard/:guildId` (action)
チャンネル設定の更新。intent で操作を分岐。

**Request (FormData)**:
```
intent: "update-channel" | "enable-channel" | "disable-channel"

// update-channel
channelId: string
language: string
memberType: string
customMembers: string  // JSON array of creator IDs

// enable-channel
channelId: string

// disable-channel
channelId: string
```

**Response**: Redirect to same page (PRG pattern)

## vspo-server API Requirements

ダッシュボードが利用するために vspo-server 側に必要な API:

### 既存 API (利用可能)

| Endpoint | Description |
| --- | --- |
| `GET /api/v2/creators` | Creator 一覧 |

### 新規 API (追加が必要)

| Endpoint | Method | Description | Auth |
| --- | --- | --- | --- |
| `/api/v2/discord/guilds` | GET | Bot 導入済みサーバー ID 一覧 | API Key |
| `/api/v2/discord/guilds/{guildId}/config` | GET | サーバーの Bot 設定 | API Key + Guild permission check |
| `/api/v2/discord/guilds/{guildId}/channels/{channelId}` | PUT | チャンネル設定更新 | API Key + Guild permission check |
| `/api/v2/discord/guilds/{guildId}/channels/{channelId}` | POST | Bot 有効化 | API Key + Guild permission check |
| `/api/v2/discord/guilds/{guildId}/channels/{channelId}` | DELETE | Bot 無効化 | API Key + Guild permission check |

### 認証方式

- ダッシュボード → vspo-server: API Key (サーバー間通信)
- Guild permission check: ダッシュボードが Discord OAuth2 トークンで取得した guild permissions を vspo-server に転送

TBD: vspo-server 側の API 実装は vspo-server リポジトリで対応。
初期実装時は mock data で開発を進め、API 完成後に接続する。
