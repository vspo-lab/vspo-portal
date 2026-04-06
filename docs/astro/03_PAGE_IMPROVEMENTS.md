# 全ページ改善点

## 1. `pages/index.astro` — ランディングページ

### 現状 (266行)

- 認証済みユーザーは `/dashboard` へリダイレクト
- Hero セクション、Bot Stats (DigitRoll)、Feature Cards (dialog popup)、CTA
- 30行の `<script>` で feature popup トリガー (AbortController パターン)

### 改善点

| カテゴリ | 問題 | 改善案 |
|---------|------|--------|
| **Islands** | Feature popup が vanilla JS | `FeatureShowcase` React island (`client:visible`) に移行 |
| **Server Islands** | Bot Stats の API 呼び出しがページ全体のTTFBを遅延 | `<BotStats server:defer>` で遅延レンダリング |
| **パフォーマンス** | Google Fonts のプリロードが Base.astro にある | LP のみの Fonts は LP でプリロード。Dashboard では不要 |
| **SEO** | 構造化データなし | `application/ld+json` で WebApplication schema 追加 |
| **a11y** | Feature card の dialog trigger が `<div>` | `<button>` に変更、`aria-haspopup="dialog"` 追加 |
| **a11y** | DigitRoll に `aria-live` なし | `aria-live="polite"` + 読み上げ用の hidden text |
| **i18n** | Hero のテキストが dict.ts にあるがSEO用のメタは未翻訳 | `<html lang>` + alternateLinks + hreflang |
| **コード品質** | feature popup script の AbortController パターン | React 化で不要に |

### 移行後の構造

```astro
---
// server-side
const stats = null; // defer to Server Island
const features = getFeatures(locale);
---

<Base>
  <Hero />
  <BotStats server:defer>
    <StatsPlaceholder slot="fallback" />
  </BotStats>
  <FeatureShowcase client:visible features={features} />
  <CTA />
</Base>
```

---

## 2. `pages/404.astro` — Not Found ページ

### 現状

- シンプルな静的ページ、Button コンポーネント使用

### 改善点

| カテゴリ | 問題 | 改善案 |
|---------|------|--------|
| **a11y** | ページタイトルに "404" がない | `<title>404 - Page Not Found</title>` |
| **UX** | 戻るボタンのみ | 「ダッシュボードに戻る」リンクも追加 |
| **i18n** | テキストが翻訳済みか要確認 | dict.ts に 404 テキスト追加 |
| **SEO** | `<meta name="robots" content="noindex">` なし | 追加する |

---

## 3. `pages/dashboard/index.astro` — サーバー一覧ページ

### 現状

- `ListGuildsUsecase.execute()` でギルド一覧取得
- セッションにギルドサマリーをキャッシュ
- installed / not-installed セクションで GuildCard 表示

### 改善点

| カテゴリ | 問題 | 改善案 |
|---------|------|--------|
| **Server Islands** | ギルドごとのチャンネル数をメインレンダリングで取得 | チャンネル数表示を `server:defer` で遅延ロード |
| **パフォーマンス** | セッションキャッシュの有効期限がない | TTL 付きキャッシュまたは stale-while-revalidate パターン |
| **UX** | ギルドが0件の場合の empty state が貧弱 | イラスト + 「Botを招待する」CTA ボタン |
| **UX** | ローディング状態がない | Skeleton UI for guild cards |
| **a11y** | セクション見出しの階層が不適切な場合あり | `<h2>` installed / `<h2>` not-installed |
| **エラーハンドリング** | Discord API エラー時の UX | ErrorAlert + リトライボタン |

### 移行後の構造

```astro
---
const guilds = await ListGuildsUsecase.execute(session);
---

<Dashboard>
  <h1>{t("dashboard.servers")}</h1>
  {guilds.length === 0 ? (
    <EmptyState />
  ) : (
    <>
      <section>
        <h2>{t("dashboard.installed")}</h2>
        {installedGuilds.map(g => (
          <GuildCard guild={g}>
            <ChannelCount server:defer guildId={g.id}>
              <Skeleton slot="fallback" />
            </ChannelCount>
          </GuildCard>
        ))}
      </section>
      <section>
        <h2>{t("dashboard.notInstalled")}</h2>
        {/* ... */}
      </section>
    </>
  )}
</Dashboard>
```

---

## 4. `pages/dashboard/[guildId].astro` — ギルド詳細ページ (チャンネル設定)

### 現状 (181行)

- 最も複雑なページ。キャッシュされたギルドサマリー、並列データ取得、Astro Action results 処理
- ChannelTable, ChannelConfigForm, DeleteChannelDialog, ChannelAddModal を含む
- 8行の `<script>` で View Transitions 時の dialog close 処理

### 改善点

| カテゴリ | 問題 | 改善案 |
|---------|------|--------|
| **Islands** | 全 dialog/form が vanilla JS | React islands に移行 (02_REACT_MIGRATION.md 参照) |
| **Islands** | dialog close script が View Transitions 対策 | React 化でアンマウント時に自動クリーンアップ → 不要 |
| **状態管理** | チャンネル追加後に PRG でページリロード | Nano Store + 楽観的UI更新 |
| **状態管理** | Action result (flash message) がセッション経由 | Nano Store の `$flashMessage` で管理 |
| **パフォーマンス** | 並列データ取得は良い。だがエラー時の partial render なし | `Promise.allSettled` + エラー部分のみ ErrorAlert |
| **UX** | チャンネルが0件の empty state | 「チャンネルを追加」ボタン付き empty state |
| **UX** | 設定保存後のフィードバックが PRG 後の flash のみ | 楽観的UI + inline success indicator |
| **a11y** | dialog の focus management が手動 JS | React useDialog hook で自動 focus trap |
| **セキュリティ** | Action result のエラーメッセージがそのまま表示 | エラーメッセージのサニタイズ |

### 移行後の構造

```astro
---
const [channels, members] = await Promise.allSettled([
  fetchChannels(guildId),
  fetchMembers(guildId),
]);
---

<Dashboard>
  <ChannelTable channels={channels} />
  <ChannelConfigPanel
    client:load
    channels={channels}
    members={members}
    guildId={guildId}
  />
  <!-- ChannelConfigPanel 内に ConfigModal, DeleteDialog, AddModal を統合 -->
</Dashboard>
```

---

## 5. `pages/dashboard/announcements.astro` — グローバルお知らせ

### 現状

- 全お知らせデータを `announcements.ts` から取得
- ギルドコンテキストなし

### 改善点

| カテゴリ | 問題 | 改善案 |
|---------|------|--------|
| **重複** | `[guildId]/announcements.astro` とほぼ同じ | 共通コンポーネント `AnnouncementList` に抽出 |
| **パフォーマンス** | 全件レンダリング | ページネーションまたは仮想スクロール |
| **UX** | フィルタリング・検索なし | タイプ別フィルタ、日付範囲 |
| **i18n** | 日付フォーマットがロケール対応済みか確認 | `Intl.DateTimeFormat` でロケール指定 |
| **a11y** | お知らせカードのセマンティクス | `<article>` + `<time datetime>` |

---

## 6. `pages/dashboard/[guildId]/announcements.astro` — ギルド別お知らせ

### 現状

- ギルドデータをサイドバー用に取得
- それ以外は `announcements.astro` とほぼ同一

### 改善点

| カテゴリ | 問題 | 改善案 |
|---------|------|--------|
| **重複** | グローバル版との重複 | `AnnouncementList.astro` 共通コンポーネント化 |
| **データ** | ギルド固有のお知らせフィルタがない | ギルドに関連するお知らせのみ表示 |
| **ナビゲーション** | パンくずリストなし | `Guild Name > Announcements` のパンくず追加 |

---

## 7. `pages/auth/discord.ts` — OAuth 開始エンドポイント

### 現状

- OAuth URL 構築、state をセッション保存、302 リダイレクト

### 改善点

| カテゴリ | 問題 | 改善案 |
|---------|------|--------|
| **セキュリティ** | state パラメータの生成方法を確認 | `crypto.randomUUID()` 使用を確認 |
| **セキュリティ** | PKCE (Proof Key for Code Exchange) 未対応の可能性 | PKCE 対応追加 |
| **エラー** | Discord が応答しない場合のタイムアウト | redirect URL 構築時のバリデーション強化 |

---

## 8. `pages/api/guilds/[guildId]/channels.ts` — チャンネル一覧 API

### 現状

- GET endpoint。ギルドの Discord チャンネルを返す
- ChannelAddModal から fetch で呼ばれる

### 改善点

| カテゴリ | 問題 | 改善案 |
|---------|------|--------|
| **セキュリティ** | ギルドの権限チェック | ユーザーがそのギルドのメンバーか検証 |
| **パフォーマンス** | レスポンスキャッシュなし | `Cache-Control` ヘッダー (short TTL) |
| **型安全性** | レスポンス型の明示 | Zod schema でレスポンス型を定義 |
| **エラー** | Discord API エラーのハンドリング | 適切な HTTP ステータスコード + エラーメッセージ |

---

## 9. `pages/api/change-locale.ts` — ロケール変更 API

### 現状

- POST endpoint。セッションにロケール保存、リダイレクト

### 改善点

| カテゴリ | 問題 | 改善案 |
|---------|------|--------|
| **UX** | ページリロードが発生 | Astro の i18n ルーティングを活用して URL ベースのロケール切替に移行 |
| **セキュリティ** | CSRF 保護の確認 | Astro Actions に移行すれば自動 CSRF 保護 |
| **バリデーション** | ロケール値のバリデーション | 許可されたロケールのみ受付 |
