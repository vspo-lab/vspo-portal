# knip CI 修正: unused code 削除 + knip exclude 設定

## Context

PR #912 で `knip-check` ジョブを CI に追加したが、pre-existing な unused files (9), unused exports (26), unused types (41) で CI が失敗している。
方針: 自動生成/ビルドツール用ファイルは knip exclude で抑制し、手書きで実際に使われていないコードは削除する。

## Phase 1: knip.json 設定 — exclude + entry 追加

`knip.json` に以下を追加:

```json
{
  "workspaces": {
    "service/vspo-schedule/v2/web": {
      "entry": [
        "src/pages/**/*.{ts,tsx}",
        "next.config.{js,mjs,ts}",
        "open-next.config.ts"
      ],
      "ignore": [
        "src/features/multiview/**",
        "src/features/shared/types/api.d.ts"
      ]
    }
  }
}
```

- `open-next.config.ts` → opennextjs-cloudflare が参照するビルド設定。entry に追加して knip の unused file から除外。

## Phase 2: unused files 削除 (5 ファイル)

| ファイル | 理由 |
|---|---|
| `web/src/data/content/about-sections.ts` | 参照ゼロ。放棄された機能 |
| `web/src/data/content/site-news.ts` | 参照ゼロ。markdown ベースに移行済み |
| `web/src/features/schedule/pages/ScheduleStatus/index.tsx` | `.ts` 版と重複 |
| `web/src/features/schedule/pages/ScheduleStatus/components/LivestreamContent/container.tsx` | Presenter のみ使用。Container は参照ゼロ |
| `web/src/features/clips/utils/index.ts` | barrel export。直接 `clipUtils` を import している |

削除 **しない** ファイル:
- `open-next.config.ts` → entry に追加で解決
- `ScheduleStatus/index.ts` → export chain の一部
- `LivestreamContent/index.ts` → export chain の一部
- `EventsContent/index.ts` → export chain の一部 (components/index.ts 経由で使用)

## Phase 3: unused exports 削除 (26 個)

### packages/api
- `packages/api/src/mock/index.ts` — `ENV` export を削除

### web — 未使用コンポーネント export
- `clips/components/containers/ClipCard.tsx` — `ClipCard` export 削除 (Presenter のみ使用)
- `clips/components/containers/MemberStories.tsx` — `MemberStories` export 削除 (Presenter のみ使用)
- `freechat/pages/FreechatPage/index.ts` — `FreechatPageContainer`, `FreechatPagePresenter` の barrel export 削除
- `shared/components/Elements/Google/GoogleAd.tsx` — `GoogleAd` export 削除 (参照ゼロ)
- `shared/components/Elements/Google/GoogleTagManager.tsx` — `GoogleTagManager` export 削除 (参照ゼロ)
- `shared/components/Elements/Google/index.ts` — 上記 2 つの re-export 削除

### web — 未使用 Zod schema export
- `shared/domain/channel.ts` — `channelSchema` は内部使用あり。**export のみ削除** (export キーワード除去)
- `shared/domain/clip.ts` — `sortOptionSchema`, `clipFilterSchema` — 型推論にのみ使用。**export のみ削除**
- `shared/domain/livestream.ts` — `statusSchema` は内部使用あり。**export のみ削除**
- `shared/domain/video.ts` — `platformSchema` は内部使用あり。**export のみ削除**

### web — 未使用ユーティリティ関数 export
- `lib/Const.ts` — `TEMP_TIMESTAMP` export 削除
- `lib/i18n.ts` — default export は side-effect import で使用。**knip exclude で対応**
- `lib/i18n/server.ts` — `cloudflareServerSideTranslations` — 参照ゼロ。export + 関数を削除
- `lib/markdown.ts` — `getMarkdownContentSync`, `getAllMarkdownSlugsSync`, `getAllSiteNewsItemsSync` — 参照ゼロ。関数ごと削除
- `lib/utils.ts` — `getOneWeekRange`, `matchesDateFormat`, `isValidYearMonth`, `dateStringOffSet`, `generateStaticPathsForLocales` — 参照ゼロ。関数ごと削除

## Phase 4: unused exported types 削除 (41 個)

全て Props/Service 型で、ファイル外から参照されていない。`export` キーワードを除去する。
対象ファイル一覧 (略記、web = `service/vspo-schedule/v2/web/src`):

- `features/clips/api/clipService.ts` — `ClipService`, `FetchClipServiceParams`, `SingleClipService`, `FetchSingleClipServiceParams`
- `features/clips/components/containers/*.tsx` — 各 Props 型 (5 個)
- `features/clips/components/presenters/*.tsx` — 各 Props 型 (5 個)
- `features/clips/pages/*/presenter.tsx` — `DateFilterOption`, `*PresenterProps` (6 個)
- `features/freechat/api/freechatService.ts` — `FreechatService`, `FetchFreechatServiceParams`
- `features/freechat/components/**` — `FreechatCardProps` (2 箇所)、`FreechatCardPresenterProps`
- `features/schedule/api/scheduleService.ts` — `Schedule`, `FetchScheduleParams`
- `features/schedule/pages/ScheduleStatus/components/DateSearchDialog.tsx` — `DateSearchDialogProps`
- `features/shared/api/*.ts` — 各 Params/Result 型 (8 個)
- `features/shared/domain/clip.ts` — `SortOption`
- `features/shared/domain/event.ts` — `EventsByDate`
- `features/site-news/pages/SiteNewsPage/container.tsx` — `SiteNewsPageContainerProps`
- `types/site-news.ts` — `SiteNewsItem`

## Phase 5: knip exclude 設定 (残存項目)

`knip.json` で以下を追加:

```json
{
  "exclude": ["unlisted"]
}
```

i18n.ts の default export は side-effect import パターンのため knip が検出不能。entry に `src/lib/i18n.ts` を追加して対応。

## Phase 6: スクリプト整備

### `package.json` — knip fix スクリプト追加
```json
{
  "scripts": {
    "knip:fix": "knip --fix"
  }
}
```

### `scripts/post-edit-check.sh` — knip チェック追加
既に biome:check を実行している箇所に `pnpm knip` を追加。

## 対象ファイル一覧

| ファイル | 変更 |
|---|---|
| `knip.json` | entry 追加, exclude 追加 |
| `package.json` (root) | `knip:fix` スクリプト追加 |
| `scripts/post-edit-check.sh` | knip チェック追加 |
| 5 ファイル | 削除 (Phase 2) |
| ~25 ファイル | export 削除 / 関数削除 (Phase 3-4) |

## 検証

1. `pnpm knip` — exit 0 を確認
2. `pnpm biome:check` — 引き続き 0 errors を確認
3. `pnpm tsc` — 型チェック通過を確認
4. `pnpm build` — ビルド成功を確認 (削除した関数/コンポーネントが使われていないことの最終確認)
