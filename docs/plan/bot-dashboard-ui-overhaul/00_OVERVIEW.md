# 00: 機能概要 — bot-dashboard UI 全面改善

## 目的・背景

Discord Bot 管理ダッシュボード（Astro v6）の UI を全面的に改善する。
現状、日本語翻訳が未実装（ja 辞書が全て英語）、ダークモード固定、言語切り替え不可、
サーバー一覧でチャンネル有効状態が不明、設定 UI が分散しているなど複数の課題がある。

## スコープ

### In Scope

1. **日本語翻訳の実装** — `dict.ts` の `ja` 辞書を全て日本語に翻訳
2. **ライトモード / ダークモード対応** — CSS 変数によるテーマ切り替え + トグル UI
3. **言語切り替え UI** — ヘッダーに言語セレクター配置、セッションに保存
4. **サーバーカードのチャンネル情報表示** — 有効チャンネル数・名前の表示、編集・削除リンク
5. **設定 UI の統合** — チャンネル設定をインラインモーダルから専用設定セクションへ
6. **チャンネル削除機能** — チャンネル設定の削除 UI と Action
7. **新規翻訳キーの追加** — テーマ切り替え、設定画面、削除確認ダイアログ等

### Out of Scope

- vspo-server API 連携（Phase 5 で別途対応）
- 新規ページの追加（既存ページの改善のみ）
- モバイルアプリ対応
- アクセシビリティの全面改修（既存レベルは維持）

## 対象ユーザー

- Discord サーバー管理者（MANAGE_GUILD 権限保持者）
- 日本語ネイティブが主要ユーザー

## 成功基準

1. デフォルト表示が日本語になっている
2. ヘッダーから言語を ja / en に切り替えられる
3. ライトモード / ダークモードをトグルで切り替えられる
4. サーバー一覧で各サーバーの有効チャンネル数が表示される
5. チャンネルの編集・削除がサーバー詳細ページからできる

## 影響範囲

- `service/bot-dashboard/src/` 配下全般
- 主要変更ファイル:
  - `src/i18n/dict.ts` — 日本語翻訳追加 + 新規キー
  - `src/app.css` — ライトモード用 CSS 変数追加
  - `src/layouts/Base.astro` — テーマ class 動的化
  - `src/layouts/Dashboard.astro` — ヘッダーに言語・テーマ切り替え追加
  - `src/components/auth/UserMenu.astro` — 設定ドロップダウン統合
  - `src/components/guild/GuildCard.astro` — チャンネル情報表示追加
  - `src/components/channel/ChannelTable.astro` — 削除ボタン追加
  - `src/actions/index.ts` — deleteChannel Action 追加
  - `src/middleware.ts` — テーマ preference 読み取り
