# Discord Bot Dashboard - UseCase

## Overview

ダッシュボードのユースケースを定義する。React Router v7 の loader/action パターンで実装する。

## UseCase 一覧

### UC-1: Discord OAuth2 ログイン

**Trigger**: ユーザーが「Discordでログイン」ボタンをクリック
**Flow**:
1. Discord OAuth2 Authorization URL にリダイレクト (scope: `identify guilds`)
2. Discord がコールバック URL にリダイレクト (authorization code 付き)
3. authorization code でアクセストークンを取得
4. セッションを作成し、ダッシュボードにリダイレクト

**Error Cases**:
- OAuth2 認証拒否 → ログインページに戻りエラー表示
- トークン取得失敗 → ログインページに戻りエラー表示

### UC-2: サーバー一覧の表示

**Trigger**: ログイン後、ダッシュボードトップにアクセス
**Flow**:
1. Discord API からユーザーのサーバー一覧を取得
2. 各サーバーについて `MANAGE_GUILD` 権限があるかチェック
3. Bot 導入済みかどうかを vspo-server API で確認
4. 管理権限ありサーバーを一覧表示 (Bot 導入済み / 未導入で分類)

**Error Cases**:
- Discord API エラー → エラー表示
- セッション期限切れ → ログインページにリダイレクト

### UC-3: サーバー設定の閲覧

**Trigger**: サーバー一覧からサーバーを選択
**Flow**:
1. vspo-server API からサーバーの Bot 設定を取得
2. 有効なチャンネル一覧と各設定を表示
3. サーバーのテキストチャンネル一覧を Discord API から取得 (Bot 未追加チャンネルの表示用)

**Error Cases**:
- 権限なし → 403 エラー表示
- Bot 未導入 → Bot 招待リンクを表示

### UC-4: チャンネル設定の変更

**Trigger**: チャンネル設定の編集フォームを送信
**Flow**:
1. 入力値を Zod Schema でバリデーション
2. vspo-server API に設定更新リクエスト
3. 成功 → 更新後の設定を表示 + トースト通知
4. 失敗 → エラー表示

**Input**: `{ language, memberType, customMembers? }`
**Validation**:
- `language`: 許可された言語コードのいずれか
- `memberType`: `"vspo_jp" | "vspo_en" | "all" | "custom"`
- `customMembers`: `memberType === "custom"` の場合のみ必須、1 名以上

### UC-5: Bot の有効化/無効化

**Trigger**: チャンネルの Bot トグルを変更
**Flow**:
1. 有効化: `POST /api/discord/guilds/{guildId}/channels/{channelId}` にデフォルト設定で追加
2. 無効化: 確認ダイアログ → `DELETE` で削除
3. 結果を即座に UI に反映

### UC-6: ログアウト

**Trigger**: ログアウトボタンをクリック
**Flow**:
1. セッションを破棄
2. ログインページにリダイレクト

## React Router v7 Mapping

| UseCase | Route | Pattern |
| --- | --- | --- |
| UC-1 | `/auth/discord`, `/auth/callback` | loader (redirect) |
| UC-2 | `/dashboard` | loader (data fetch) |
| UC-3 | `/dashboard/:guildId` | loader (data fetch) |
| UC-4 | `/dashboard/:guildId` | action (form submit) |
| UC-5 | `/dashboard/:guildId` | action (form submit) |
| UC-6 | `/auth/logout` | action (session destroy) |
