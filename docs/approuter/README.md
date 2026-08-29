# App Router Migration Plan

Pages Router から App Router への移行設計ドキュメント。

> **Status: 移行完了。** `service/vspo-schedule/v2/web` は既に App Router
> (`src/app/`) 上で稼働しており、Pages Router (`pages/`, `getServerSideProps`,
> `next-i18next`) は残っていない。以下は移行時点の設計記録であり、現行アーキ
> テクチャは [Frontend Architecture](../web-frontend/architecture.md) を参照。

## Documents

| Document | Description |
|----------|-------------|
| [design.md](./design.md) | 設計判断・アーキテクチャ・コンポーネント境界 |
| [phases.md](./phases.md) | 5フェーズ実行計画・ステップ詳細 |
| [cloudflare-barriers.md](./cloudflare-barriers.md) | OpenNEXT / Cloudflare Workers 障壁と対策 |
| [i18n-migration.md](./i18n-migration.md) | next-i18next → next-intl 移行ガイド |
| [mui-app-router.md](./mui-app-router.md) | MUI + Emotion App Router SSR 設定 |
| [implementation-plan.md](./implementation-plan.md) | 24タスクの実装計画 (3 PR構成) |
| [implementation-plan-single-pr.md](./implementation-plan-single-pr.md) | 単一PRでの実装計画 (代替案) |
| [streaming-isr-plan.md](./streaming-isr-plan.md) | Suspense Streaming + ISR 導入計画 |
