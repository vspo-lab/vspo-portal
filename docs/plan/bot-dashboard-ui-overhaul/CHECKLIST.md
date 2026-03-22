# Implementation Checklist: bot-dashboard-ui-overhaul

Spec: `docs/plan/bot-dashboard-ui-overhaul/`

---

## Phase 1: 日本語翻訳 + 新規キー追加
Document: `05_FRONTEND.md` Section 1
Status: Completed

### Goal
`dict.ts` の ja 辞書を全て日本語に翻訳し、新機能用のキーを ja/en 両方に追加する。

### Checklist
- [x] `ja` 辞書の全エントリを日本語に翻訳
- [x] `channel.delete`, `channel.deleteConfirm` キー追加（ja/en）
- [x] `settings.theme.*`, `settings.language.*` キー追加（ja/en）
- [x] `TranslationKey` 型が自動更新されることを確認
- [x] 既存ページで日本語表示されることを確認

### Testing
```bash
cd service/bot-dashboard && pnpm tsc --noEmit
```

### Session Notes
2026-03-22
- Done: ja 辞書を全46エントリ日本語化。新規15キー（channel.delete*, settings.*, guild.channelSummary）を ja/en 両方に追加。dict.test.ts の3アサーション更新。全テスト通過。
- Next: Phase 2 へ
- Risks/TODO: なし

---

## Phase 2: ライトモード / ダークモード対応
Document: `05_FRONTEND.md` Section 2
Status: Completed

### Goal
CSS 変数でライト/ダーク切り替えを可能にし、テーマトグル UI を実装する。

### Checklist
- [x] `app.css` のリファクタリング: `@theme inline` + `--sem-*` 中間変数パターン
- [x] ライトモード用 CSS 変数定義（`:root` ブロック）
- [x] `Base.astro` から `class="dark"` ハードコード削除
- [x] FOUC 防止インラインスクリプト追加（`<head>` 内）
- [x] `ThemeToggle.astro` コンポーネント作成（太陽/月アイコン + localStorage）
- [x] `Dashboard.astro` ヘッダーに ThemeToggle 配置
- [x] ログインページにも ThemeToggle 配置（variant="page" でスタイル対応）

### Testing
```bash
cd service/bot-dashboard && pnpm tsc --noEmit
```

### Session Notes
2026-03-22
- Done: `@custom-variant dark` + `@theme inline` でTailwind CSS 4互換のライト/ダーク切替を実装。ThemeToggle.astro は header/page の2バリアント対応。FOUC防止スクリプトを `<head>` に配置。
- Next: Phase 3 へ
- Risks/TODO: なし

---

## Phase 3: 言語切り替え UI
Document: `05_FRONTEND.md` Section 3
Status: Completed

### Goal
ヘッダーとログインページに言語切り替え UI を配置し、セッション経由で locale を永続化する。

### Checklist
- [x] `/api/change-locale` POST エンドポイント作成（Astro Action ではなく API ルート — リダイレクト対応のため）
- [x] `LanguageSelector.astro` コンポーネント作成（header/dropdown 2バリアント）
- [x] `Dashboard.astro` ヘッダーに LanguageSelector 配置（UserMenu ドロップダウン経由）
- [x] ログインページ（`index.astro`）にも LanguageSelector 配置
- [x] 未ログイン時の locale 変更対応（認証不要）
- [x] `_returnTo` バリデーション（`startsWith("/")` でオープンリダイレクト防止）

### Testing
```bash
cd service/bot-dashboard && pnpm tsc --noEmit
```

### Session Notes
2026-03-22
- Done: `/api/change-locale` を `logout.ts` と同パターンで作成。LanguageSelector を2バリアント（header用白テキスト / dropdown用ニュートラル）で作成。ログインページ右上に固定配置。
- Next: Phase 4 へ
- Risks/TODO: なし

---

## Phase 4: 設定 UI 統合 (UserMenu 拡張)
Document: `05_FRONTEND.md` Section 5
Status: Completed

### Goal
UserMenu をドロップダウンメニュー化し、言語・テーマ・ログアウトを統合する。

### Checklist
- [x] `UserMenu.astro` を `<details>/<summary>` ドロップダウンに拡張
- [x] ドロップダウン内に言語切り替え配置
- [x] ドロップダウン内にテーマ切り替え配置（ヘッダーの ThemeToggle とアイコン同期）
- [x] ドロップダウン内にログアウトボタン配置
- [x] ヘッダーに ThemeToggle をクイックアクセスとして残置
- [x] ログインページ用の設定 UI を独立配置（右上固定）
- [x] クリック外閉じ用インラインスクリプト追加
- [x] UserMenu テスト更新（7テスト通過）

### Testing
```bash
cd service/bot-dashboard && pnpm tsc --noEmit
```

### Session Notes
2026-03-22
- Done: UserMenu を `<details>` ドロップダウンに全面改修。言語・テーマ・ログアウトを統合。`[&::-webkit-details-marker]:hidden` でブラウザ三角マーカー除去。テスト2件追加。
- Next: Phase 5 へ
- Risks/TODO: なし

---

## Phase 5: サーバーカード改善 + チャンネル情報表示
Document: `05_FRONTEND.md` Section 4
Status: Completed

### Goal
GuildCard にチャンネルサマリーを表示し、サーバー詳細ページの視認性を向上させる。

### Checklist
- [x] `ChannelSummarySchema` を Zod で定義（enabledCount, totalCount, previewNames）
- [x] `GuildSummarySchema` に `channelSummary` optional フィールド追加
- [x] `GuildSummary.withChannelSummary()` メソッド追加
- [x] `ListGuildsUsecase` で installed ギルドごとにチャンネル情報を並列取得（fail-open）
- [x] `GuildCard.astro` にチャンネル数・名前表示追加
- [x] GuildCard テスト2件追加（サマリー表示 / 非表示確認）

### Testing
```bash
cd service/bot-dashboard && pnpm tsc --noEmit
```

### Session Notes
2026-03-22
- Done: ChannelSummarySchema 追加。ListGuildsUsecase で `Promise.all` による並列チャンネル取得を実装（per-guild fail-open）。GuildCard に「2/3 チャンネル有効」テキスト + チャンネル名ピル表示追加。
- Next: Phase 6 へ
- Risks/TODO: vspo-server API モックのため全ギルドで同じチャンネルデータが表示される（想定内）

---

## Phase 6: チャンネル削除機能
Document: `05_FRONTEND.md` Section 6
Status: Completed

### Goal
チャンネル設定の削除 UI と Action を実装する。

### Checklist
- [x] `VspoChannelApiRepository.deleteChannel()` メソッド追加（モック実装）
- [x] `DeleteChannelUsecase` 作成
- [x] `deleteChannel` Action を `src/actions/index.ts` に追加
- [x] `DeleteChannelDialog.astro` 確認ダイアログコンポーネント作成
- [x] `ChannelTable.astro` に削除ボタン追加（ゴミ箱アイコン + destructive スタイル）
- [x] `[guildId].astro` で `?delete=` クエリパラメータ処理 + ダイアログ表示

### Testing
```bash
cd service/bot-dashboard && pnpm tsc --noEmit
```

### Session Notes
2026-03-22
- Done: delete-channel usecase + deleteChannel Action + DeleteChannelDialog を既存パターン（`?edit=` と同様の `?delete=` クエリパラメータ方式）で実装。ChannelTable の操作列に赤い削除ボタン追加。全テスト通過。
- Next: 全 Phase 完了
- Risks/TODO: vspo-server API 連携時に `deleteChannel` リポジトリのモックを実API呼び出しに置換が必要
