# Server / Client Component Boundary

App Router ではコンポーネントはデフォルトで Server Component。`"use client"` ディレクティブで明示的に Client Component にオプトインする。

## 境界の強制

`server-only` パッケージにより、サーバー専用モジュールが Client Component からインポートされるとビルドエラーになる。

### サーバー専用モジュール (`import "server-only"`)

| モジュール | 理由 |
|-----------|------|
| `src/i18n/request.ts` | `fs.readFileSync`, `getRequestConfig` |
| `src/lib/cloudflare/context.ts` | `getCloudflareContext` |
| `src/lib/markdown.ts` | `fs` operations, Cloudflare Assets |
| `src/features/shared/api/*.ts` | Cloudflare service bindings (APP_WORKER) |
| `src/features/schedule/api/scheduleService.ts` | 同上 |
| `src/features/clips/api/clipService.ts` | 同上 |
| `src/features/multiview/api/multiviewService.ts` | 同上 |

### Client Component (`"use client"`)

| カテゴリ | 例 |
|---------|---|
| Context Providers | `Theme.tsx`, `TimeZoneContext.tsx`, `VideoModalContext.tsx` |
| Hooks | `hooks/locale.ts`, `hooks/cookie.ts` |
| MUI Presenters | `*Presenter.tsx` (MUI コンポーネント使用) |
| Interactive Elements | `VideoModal.tsx`, `DateSearchDialog.tsx` |
| Layout (stateful) | `ContentLayout.tsx` (useState/useEffect) |

### 型の分離

サーバーモジュールから型だけを Client Component で使いたい場合、型定義を別ファイルに分離する:

```txt
src/lib/markdown.ts        ← server-only (fs, Cloudflare)
src/lib/markdown.types.ts  ← 型のみ (client-safe)
```

Client Component は `@/lib/markdown.types` からインポート:

```typescript
import type { SiteNewsMarkdownItem } from "@/lib/markdown.types";
```

## コンポーネント配置の原則

```txt
Server Components (default)
├── app/[locale]/*/page.tsx       ← データ取得, cookies(), generateMetadata
├── app/[locale]/*/layout.tsx     ← NextIntlClientProvider, html/body
├── src/i18n/*.ts                 ← routing, request config
├── src/lib/*.ts                  ← markdown, cloudflare context
└── src/features/*/api/*.ts       ← API service layer

Client Components ("use client")
├── src/features/*/presenter.tsx  ← MUI UI rendering
├── src/features/*/container.tsx  ← useState, useTransition, hooks
├── src/context/*.tsx             ← createContext, providers
├── src/hooks/*.ts                ← useLocale, useCookie
└── src/components/AppProviders.tsx
```

## 設計判断

| 判断 | 理由 |
|------|------|
| `"use client"` をツリーの下に押し下げ | サーバーバンドル最小化、Cloudflare Workers の 10MiB 制限対策 |
| `server-only` でビルド時強制 | ランタイムではなくビルド時にエラー検出 |
| 型定義の分離 (`*.types.ts`) | `import type` でもモジュール解決は発生するため、安全側に分離 |
| API 層を全て `server-only` | Cloudflare service binding はサーバーでのみ利用可能 |

### Lazy-Loaded Components (next/dynamic)

以下のコンポーネントは `next/dynamic` (`ssr: false`) で遅延読み込みし、初期 JS バンドルを削減する:

| Component | Library | Savings |
|-----------|---------|---------|
| `MultiviewGridPresenter` | react-grid-layout | ~50KB |
| `MarkdownContent` | react-markdown | ~30KB |
| `TweetEmbed` | react-tweet | ~20KB |

これらはユーザー操作またはルート遷移時にオンデマンドで読み込まれる。SSR を無効にすることで、サーバーバンドル（Cloudflare Workers 10MiB 制限）にも含まれない。

## 参照

- [Server and Client Components - Next.js](https://nextjs.org/docs/app/getting-started/server-and-client-components)
- [use client - Next.js](https://nextjs.org/docs/app/api-reference/directives/use-client)
- [server-only - npm](https://www.npmjs.com/package/server-only)
