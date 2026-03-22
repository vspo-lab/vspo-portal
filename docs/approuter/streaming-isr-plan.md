# Suspense Streaming + ISR Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** App Router の Suspense + Streaming を導入してAPIデータ取得ページのTTFBを改善し、site-news/[id] を ISR 化する。

**Architecture:** 動的ページ (schedule, clips home, freechat, multiview) で、データ取得を await せずに Promise のまま Client Component に渡し、`<Suspense>` fallback で静的シェルを即時表示する。`React.use()` で Client Component 側から Promise を resolve する。site-news/[id] は `force-dynamic` を `revalidate = 3600` に変更。

**Tech Stack:** Next.js 15.5.14, React 19 (`use()` hook), MUI Skeleton components

**Working directory:** `service/vspo-schedule/v2/web/` (all paths below are relative to this)

**UI/UX constraint:** Skeleton fallback は MUI の既存デザインシステムに合わせる。最終的なレンダリング結果は変わらない。

---

## Task 1: Create Skeleton Components

**Files:**
- Create: `src/features/shared/components/Elements/Loading/ScheduleSkeleton.tsx`
- Create: `src/features/shared/components/Elements/Loading/ClipsSkeleton.tsx`
- Create: `src/features/shared/components/Elements/Loading/FreechatSkeleton.tsx`
- Create: `src/features/shared/components/Elements/Loading/MultiviewSkeleton.tsx`

- [ ] **Step 1: Create ScheduleSkeleton**

```typescript
// src/features/shared/components/Elements/Loading/ScheduleSkeleton.tsx
"use client";

import { Box, Container, Skeleton } from "@mui/material";

export const ScheduleSkeleton = () => (
  <Container maxWidth="lg" sx={{ pt: 2, pb: 4, pl: 0, pr: 0 }}>
    {/* Tab bar skeleton */}
    <Skeleton variant="rectangular" height={48} sx={{ mb: 4 }} />
    {/* Content cards skeleton */}
    {Array.from({ length: 6 }).map((_, i) => (
      <Box key={`schedule-skeleton-${i}`} sx={{ mb: 2 }}>
        <Skeleton variant="text" width="30%" height={24} sx={{ mb: 1 }} />
        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
          {Array.from({ length: 3 }).map((_, j) => (
            <Skeleton
              key={`schedule-card-${i}-${j}`}
              variant="rectangular"
              width={200}
              height={150}
              sx={{ borderRadius: 1 }}
            />
          ))}
        </Box>
      </Box>
    ))}
  </Container>
);
```

- [ ] **Step 2: Create ClipsSkeleton**

```typescript
// src/features/shared/components/Elements/Loading/ClipsSkeleton.tsx
"use client";

import { Box, Skeleton } from "@mui/material";

export const ClipsSkeleton = () => (
  <Box sx={{ py: 2 }}>
    <Skeleton variant="text" width="40%" height={32} sx={{ mb: 2 }} />
    <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
      {Array.from({ length: 8 }).map((_, i) => (
        <Skeleton
          key={`clip-skeleton-${i}`}
          variant="rectangular"
          width={280}
          height={160}
          sx={{ borderRadius: 1 }}
        />
      ))}
    </Box>
  </Box>
);
```

- [ ] **Step 3: Create FreechatSkeleton**

```typescript
// src/features/shared/components/Elements/Loading/FreechatSkeleton.tsx
"use client";

import { Box, Skeleton } from "@mui/material";

export const FreechatSkeleton = () => (
  <Box sx={{ py: 2 }}>
    {Array.from({ length: 4 }).map((_, i) => (
      <Skeleton
        key={`freechat-skeleton-${i}`}
        variant="rectangular"
        height={120}
        sx={{ mb: 2, borderRadius: 1 }}
      />
    ))}
  </Box>
);
```

- [ ] **Step 4: Create MultiviewSkeleton**

```typescript
// src/features/shared/components/Elements/Loading/MultiviewSkeleton.tsx
"use client";

import { Box, Skeleton } from "@mui/material";

export const MultiviewSkeleton = () => (
  <Box sx={{ p: 2 }}>
    <Box sx={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 2 }}>
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton
          key={`multiview-skeleton-${i}`}
          variant="rectangular"
          height={200}
          sx={{ borderRadius: 1 }}
        />
      ))}
    </Box>
  </Box>
);
```

- [ ] **Step 5: Commit**

```
feat(web): add skeleton loading components for Suspense fallbacks
```

---

## Task 2: Add Suspense Streaming to Schedule Page

**Files:**
- Modify: `src/app/[locale]/(content)/schedule/[status]/page.tsx`

The pattern: move data fetching into a separate async component, don't await in the page, wrap with `<Suspense>`.

- [ ] **Step 1: Refactor schedule page to use Suspense**

Split the page into a static shell (ContentLayout + metadata) and a streaming data component:

```typescript
// src/app/[locale]/(content)/schedule/[status]/page.tsx
import { Suspense } from "react";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { getTranslations } from "next-intl/server";
import { ScheduleSkeleton } from "@/features/shared/components/Elements/Loading/ScheduleSkeleton";
import { ContentLayout } from "@/features/shared/components/Layout/ContentLayout";
// ... other imports

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { ... }): Promise<Metadata> {
  // ... unchanged
}

// Extracted async component — this streams
async function ScheduleContent({
  locale, status, query,
}: {
  locale: string;
  status: string;
  query: { limit?: string; date?: string; memberType?: string; platform?: string };
}) {
  const cookieStore = await cookies();
  // ... all the data fetching logic that was in the page body
  const schedule = await fetchSchedule({ ... });
  return (
    <ScheduleStatusContainer
      livestreams={schedule.livestreams || []}
      events={schedule.events}
      timeZone={timeZone}
      locale={locale}
      liveStatus={status}
      isArchivePage={status === "archive"}
    />
  );
}

export default async function SchedulePage({ params, searchParams }: { ... }) {
  const { locale, status } = await params;
  const query = await searchParams;

  // Metadata for ContentLayout — cheap, no API call
  const t = await getTranslations({ locale, namespace: "streams" });
  let title = "";
  switch (status) {
    case "all": title = t("titles.streamSchedule"); break;
    case "live": title = t("titles.live"); break;
    case "upcoming": title = t("titles.upcoming"); break;
    case "archive": title = t("titles.archive"); break;
    default: title = t("titles.streamSchedule"); break;
  }
  const footerMessage = t("membersOnlyStreamsHidden");

  return (
    <ContentLayout
      title={title}
      path={`/schedule/${status}`}
      lastUpdateTimestamp={Date.now()}
      footerMessage={footerMessage}
    >
      <Suspense fallback={<ScheduleSkeleton />}>
        <ScheduleContent locale={locale} status={status} query={query} />
      </Suspense>
    </ContentLayout>
  );
}
```

Key: `ScheduleContent` is an async Server Component that does the heavy fetching. `<Suspense>` wraps it so the ContentLayout shell renders immediately.

- [ ] **Step 2: Verify build**

Run: `pnpm tsc --noEmit`

- [ ] **Step 3: Commit**

```
perf(web): add Suspense streaming to schedule page
```

---

## Task 3: Add Suspense Streaming to Clips Home Page

**Files:**
- Modify: `src/app/[locale]/(standalone)/clips/page.tsx`

- [ ] **Step 1: Refactor clips home page**

Same pattern: extract data fetching into an async `ClipsContent` component, wrap with `<Suspense>`.

```typescript
import { Suspense } from "react";
import { ClipsSkeleton } from "@/features/shared/components/Elements/Loading/ClipsSkeleton";

// Extracted async component
async function ClipsContent({ locale, period }: { locale: string; period?: string }) {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("x-session-id")?.value;
  // ... fetch clips data
  const data = await fetchClipService({ ... });
  return <ClipsHomeContainer {...data} />;
}

export default async function ClipsPage({ params, searchParams }: { ... }) {
  const { locale } = await params;
  const { period } = await searchParams;
  const t = await getTranslations({ locale, namespace: "clips" });

  return (
    <ContentLayout title={t("title")} path="/clips" lastUpdateTimestamp={Date.now()}>
      <Suspense fallback={<ClipsSkeleton />}>
        <ClipsContent locale={locale} period={period} />
      </Suspense>
    </ContentLayout>
  );
}
```

- [ ] **Step 2: Commit**

```
perf(web): add Suspense streaming to clips home page
```

---

## Task 4: Add Suspense Streaming to Freechat Page

**Files:**
- Modify: `src/app/[locale]/(content)/freechat/page.tsx`

- [ ] **Step 1: Refactor freechat page**

```typescript
import { Suspense } from "react";
import { FreechatSkeleton } from "@/features/shared/components/Elements/Loading/FreechatSkeleton";

async function FreechatContent({ locale }: { locale: string }) {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("x-session-id")?.value;
  const result = await fetchFreechats({ lang: locale, sessionId });
  const freechats = !result.err && result.val ? result.val.freechats : [];
  return <FreechatPageContainer freechats={freechats} />;
}

export default async function FreechatPage({ params }: { ... }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "freechat" });

  return (
    <ContentLayout
      title={t("title")}
      path="/freechat"
      lastUpdateTimestamp={Date.now()}
      maxPageWidth="lg"
      padTop
    >
      <Suspense fallback={<FreechatSkeleton />}>
        <FreechatContent locale={locale} />
      </Suspense>
    </ContentLayout>
  );
}
```

- [ ] **Step 2: Commit**

```
perf(web): add Suspense streaming to freechat page
```

---

## Task 5: Add Suspense Streaming to Multiview Page

**Files:**
- Modify: `src/app/[locale]/(standalone)/multiview/page.tsx`

- [ ] **Step 1: Refactor multiview page**

```typescript
import { Suspense } from "react";
import { MultiviewSkeleton } from "@/features/shared/components/Elements/Loading/MultiviewSkeleton";

async function MultiviewContent({ locale }: { locale: string }) {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("x-session-id")?.value;
  const { livestreams } = await fetchMultiviewService({ locale, sessionId });
  return <MultiviewPageContainer livestreams={livestreams} />;
}

export default async function MultiviewPage({ params }: { ... }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "multiview" });

  return (
    <ContentLayout
      title={t("meta.title")}
      lastUpdateTimestamp={Date.now()}
      path="/multiview"
      padTop={false}
      maxPageWidth={false}
    >
      <Suspense fallback={<MultiviewSkeleton />}>
        <MultiviewContent locale={locale} />
      </Suspense>
    </ContentLayout>
  );
}
```

- [ ] **Step 2: Commit**

```
perf(web): add Suspense streaming to multiview page
```

---

## Task 6: ISR for site-news/[id]

**Files:**
- Modify: `src/app/[locale]/(content)/site-news/[id]/page.tsx`

- [ ] **Step 1: Replace `force-dynamic` with ISR revalidation**

```typescript
// Remove: export const dynamic = "force-dynamic";
// Add:
export const revalidate = 3600; // Revalidate every hour
```

Site news detail pages are markdown-based content that changes infrequently. ISR with 1-hour revalidation provides caching while keeping content fresh.

- [ ] **Step 2: Commit**

```
perf(web): use ISR for site-news detail pages (1h revalidation)
```

---

## Task 7: Final Verification

- [ ] **Step 1: Run quality checks**

```bash
./scripts/post-edit-check.sh
```

- [ ] **Step 2: Run tests**

```bash
pnpm test
```

- [ ] **Step 3: Verify build**

```bash
pnpm tsc --noEmit
```

- [ ] **Step 4: Commit any fixes**

```
chore(web): fix lint/type issues from streaming changes
```
