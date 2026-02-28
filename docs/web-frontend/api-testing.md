# API テスト戦略

## 概要

このドキュメントでは、本プロジェクトにおける API 結合テストのツール選定と実装方針をまとめる。

**注**: 本プロジェクトは `@hono/zod-openapi` を使用しており、`/doc` エンドポイントで **OpenAPI 3.1 仕様** を自動生成している。これにより OpenAPI ベースのテストツールとの親和性が高い。

## 関連ドキュメント

- `docs/testing/api-testing.md` - APIテストの最新実装方針（モック最小 + テーブルドリブン）
- `docs/web-frontend/twada-tdd.md` - t_wadaベースのTDD運用ルール

## ツール選定

### 推奨構成

| カテゴリ | ツール | 理由 |
|---------|--------|------|
| **テストフレームワーク** | Vitest | ESM・TypeScript ネイティブ対応、高速 |
| **API テストクライアント** | Hono testClient | 型安全、Hono ネイティブ、IDE 補完対応 |
| **OpenAPI コントラクトテスト** | Schemathesis | OpenAPI 仕様からの自動テスト生成、エッジケース検出 |
| **モック** | Vitest built-in | vi.mock, vi.fn で十分対応可能 |
| **カバレッジ** | v8 (Vitest built-in) | 追加設定不要 |

---

## OpenAPI ベースのテストツール比較

本プロジェクトは OpenAPI 仕様を `/doc` で公開しているため、以下のツールが活用可能。

### ツール一覧

| ツール | 特徴 | 言語 | CI統合 | 推奨度 |
|--------|------|------|--------|--------|
| **Schemathesis** | Property-based テスト、自動エッジケース検出 | Python | ◎ | ★★★ |
| **Dredd** | OpenAPI 仕様との整合性検証 | Node.js | ◎ | ★★☆ |
| **Prism** | モックサーバー + バリデーションプロキシ | Node.js | ○ | ★★☆ |
| **Step CI** | YAML ベースのテスト定義 | Node.js | ◎ | ★★☆ |
| **Bruno** | Git フレンドリーな API クライアント | Electron | ○ | ★☆☆ |
| **Hoppscotch** | OSS API クライアント + CLI | Node.js | ○ | ★☆☆ |

### Schemathesis（推奨）

OpenAPI 仕様から **自動的に数千のテストケースを生成** する Property-based テストツール。

**メリット**:
- OpenAPI 仕様から自動テスト生成（手動テスト不要）
- エッジケース・バリデーションバグを自動検出
- 初回実行で通常 5-15 件の問題を発見
- Spotify, JetBrains, Red Hat 等が採用
- GitHub Actions 統合が容易

**デメリット**:
- Python が必要（Node.js プロジェクトに追加依存）
- 認証が必要なエンドポイントは設定が必要

```bash
# インストール
pip install schemathesis

# 基本的な実行
schemathesis run http://localhost:8787/doc

# 認証付き
schemathesis run http://localhost:8787/doc \
  --header "Authorization: Bearer $TOKEN"
```

### Dredd

OpenAPI 仕様と実際の API レスポンスの **整合性を検証** するコントラクトテストツール。

**メリット**:
- Node.js ネイティブ（追加ランタイム不要）
- ドキュメントと実装の乖離を防止
- CI/CD 統合が容易

**デメリット**:
- 複雑な認証やダイナミックデータには hooks が必要
- 仕様が不完全だとテストが不十分になる

```bash
# インストール
pnpm add -D dredd

# 実行
dredd http://localhost:8787/doc http://localhost:8787
```

### Prism

OpenAPI 仕様から **モックサーバーを生成** + バリデーションプロキシとして動作。

**メリット**:
- フロントエンド開発時のモックサーバーとして有用
- `--errors` フラグでコントラクト違反を検出

**デメリット**:
- テスト実行というより開発支援ツール

```bash
# モックサーバー起動
prism mock http://localhost:8787/doc

# バリデーションプロキシ
prism proxy http://localhost:8787/doc http://localhost:8787 --errors
```

### Step CI

**YAML ベース** でテストシナリオを定義する軽量フレームワーク。

**メリット**:
- YAML で宣言的にテスト定義
- OpenAPI からインポート可能
- CI/CD 統合が容易

**デメリット**:
- 手動でテストケース定義が必要

```yaml
# stepci.yml
version: "1.1"
env:
  baseUrl: http://localhost:8787

tests:
  health:
    items:
      - name: Health check
        http:
          url: ${{ env.baseUrl }}/health
          method: GET
          check:
            status: 200
```

### Bruno / Hoppscotch

Git フレンドリーな **API クライアント** + CLI でのテスト実行。

**特徴**:
- Postman/Insomnia の OSS 代替
- コレクションをファイルで管理（Git 管理可能）
- CLI でテスト自動化

**向いているケース**:
- 手動 API テストが主で、一部自動化したい場合
- Postman からの移行

---

### 候補比較

#### テストフレームワーク: Vitest vs Jest

| 項目 | Vitest | Jest |
|------|--------|------|
| **ESM サポート** | ネイティブ対応 | 実験的・設定が必要 |
| **TypeScript** | ネイティブ対応 | ts-jest が必要 |
| **パフォーマンス** | 高速（HMR活用） | 比較的遅い |
| **設定** | 最小限 | babel, ts-jest 等が必要 |
| **メモリ使用量** | 約30%削減 | 大規模で問題あり |
| **Jest 互換性** | 95%互換 | - |

**結論**: 本プロジェクトは ESM + TypeScript 構成のため、**Vitest を採用**。

#### API テストクライアント: testClient vs Supertest

| 項目 | Hono testClient | Supertest |
|------|-----------------|-----------|
| **型安全性** | 完全な型推論 | なし |
| **IDE補完** | ルート自動補完 | なし |
| **フレームワーク** | Hono 専用 | 汎用（Express等） |
| **サーバー起動** | 不要（直接テスト） | 自動バインド |
| **学習コスト** | 低（Honoユーザー向け） | 低 |

**結論**: Hono を使用しているため、型安全な **testClient を採用**。

## Vitest + testClient 結合テスト設計

本プロジェクトの構造に基づいた、具体的な結合テスト設計を示す。

### 設計方針

- **実 DB を使用**: `pnpm dev` で起動する MySQL をそのまま使用
- **外部サービスのみモック**: 外部 API、メール送信、通知サービス等だけモック
- **認証はモック**: テスト用ユーザーを直接注入

### アーキテクチャ概要

```
┌─────────────────────────────────────────────────────────────┐
│                      Test Layer                             │
├─────────────────────────────────────────────────────────────┤
│  testClient(app) ──▶ Routes ──▶ UseCase ──▶ Repository     │
│       ↑                 ↑          ↑           ↑            │
│    型安全          認証モック   実Container   実DB          │
│                                     ↓                       │
│                            外部サービスのみモック           │
│                    (ExternalAPI, AuthService, Email等)     │
└─────────────────────────────────────────────────────────────┘
```

### モック対象の外部サービス

| サービス | ファイル | 用途 |
|----------|----------|------|
| `ThirdPartyAPIClient` | `infra/external/apiClient.ts` | 外部 API との通信 |
| `AuthService` | `infra/auth/tokenService.ts` | 認証トークン発行 |
| `AlertService` | `infra/notification/notificationService.ts` | 通知送信 |
| `FileStorageService` | `infra/storage/fileStorageService.ts` | ファイルストレージ操作 |
| `MessageService` | `infra/email/emailService.ts` | メール送信 |

---

## セットアップ手順

### 1. 依存関係のインストール

```bash
pnpm add -D vitest @vitest/coverage-v8 --filter server
```

### 2. Vitest 設定ファイルの作成

`services/api/vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['**/*.test.ts'],
    exclude: ['**/node_modules/**', '**/dist/**'],
    environment: 'node',
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['domain/**', 'usecase/**', 'infra/**'],
      exclude: ['**/*.test.ts', '**/node_modules/**'],
    },
    setupFiles: ['./test/setup.ts'],
    testTimeout: 30000, // DB操作があるため長めに
    // テストは直列実行（DB状態の競合を避ける）
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
  },
})
```

### 3. テストセットアップファイル

`services/api/test/setup.ts`:

```typescript
import { beforeAll, afterAll, afterEach, vi } from 'vitest'
import { getDb } from '../infra/repository/mysql/db'

// 環境変数（pnpm dev で起動した DB を使用）
beforeAll(() => {
  // .env.local から読み込まれる想定だが、明示的に設定も可
  process.env.NODE_ENV = 'test'
})

// 各テスト後にモックをリセット
afterEach(() => {
  vi.restoreAllMocks()
})

// テスト終了後に DB 接続をクローズ
afterAll(async () => {
  const dbResult = await getDb()
  if (!dbResult.err) {
    // Drizzle の接続プールをクローズ（必要に応じて）
  }
})
```

### 4. package.json スクリプトの追加

```json
{
  "scripts": {
    "test": "vitest",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage"
  }
}
```

---

## テストヘルパー設計

### ディレクトリ構造

```
services/api/
├── test/
│   ├── setup.ts                 # グローバルセットアップ
│   ├── helpers/
│   │   ├── createTestApp.ts     # テスト用アプリファクトリ
│   │   ├── createTestContainer.ts # AI モック付きコンテナ
│   │   ├── mockExternal.ts      # 外部サービスモック
│   │   ├── testDb.ts            # DB ユーティリティ
│   │   └── testUser.ts          # テストユーザー作成
│   └── integration/
│       └── routes/
│           ├── item.test.ts
│           ├── order.test.ts
│           └── item.test.ts
```

### 外部サービスモック

`services/api/test/helpers/mockExternal.ts`:

```typescript
import { vi } from 'vitest'
import { Ok } from '@my-app/errors'
import type { ThirdPartyAPIClient } from '../../infra/external/apiClient'
import type { AuthService } from '../../infra/auth/tokenService'

/**
 * ThirdPartyAPIClient のモック
 */
export const createMockThirdPartyAPIClient = (): ThirdPartyAPIClient => ({
  fetch: vi.fn().mockResolvedValue(
    Ok({
      data: { id: 'item-123', status: 'success' },
      metadata: { processedAt: new Date().toISOString() },
    })
  ),
  post: vi.fn().mockResolvedValue(
    Ok({
      id: 'created-123',
      status: 'created',
    })
  ),
})

/**
 * AuthService のモック
 */
export const createMockAuthService = (): typeof AuthService => ({
  createToken: vi.fn().mockResolvedValue(Ok('mock-token-xxx')),
  verifyToken: vi.fn().mockResolvedValue(Ok({ itemId: 'user-123', valid: true })),
})

/**
 * AlertService のモック
 */
export const createMockAlertService = () => ({
  send: vi.fn().mockResolvedValue(Ok({ sent: true, messageId: 'msg-123' })),
})

/**
 * MessageService のモック
 */
export const createMockMessageService = () => ({
  send: vi.fn().mockImplementation(async (to: string, subject: string) => Ok({ sent: true })),
})
```

### テスト用コンテナファクトリ

`services/api/test/helpers/createTestContainer.ts`:

```typescript
import { vi } from 'vitest'
import type { Container } from '../../infra/di/container'
import { TaskUseCase } from '../../usecase/task'
import { ReportUseCase } from '../../usecase/report'
import { UserUseCase } from '../../usecase/user'
// ... 他の UseCase

// 実際の Repository をインポート
import { TaskRepository } from '../../infra/repository/task'
import { ReportRepository } from '../../infra/repository/report'
import { UserRepository } from '../../infra/repository/user'
import { TxManager } from '../../infra/repository/txManager'
// ... 他の Repository

import {
  createMockThirdPartyAPIClient,
  createMockAuthService,
  createMockAlertService,
  createMockMessageService,
} from './mockExternal'

/**
 * テスト用の Container を作成
 * - Repository: 実物（実 DB 接続）
 * - 外部サービス: モック
 */
export const createTestContainer = (): Container => {
  // 外部サービスのモック
  const externalAPIClient = createMockThirdPartyAPIClient()
  const tokenService = createMockAuthService()
  const notificationService = createMockAlertService()
  const emailService = createMockMessageService()

  // 外部サービスのモック（API 連携）
  const mockExternalService = {
    fetch: vi.fn().mockResolvedValue(Ok({ data: { id: 'item-123' }, status: 'success' })),
    post: vi.fn().mockResolvedValue(Ok({ id: 'created-123', status: 'created' })),
  }

  const externalService = {
    execute: vi.fn().mockResolvedValue(Ok({ url: 'https://external-service.example.com/test' })),
    handleCallback: vi.fn(),
  }

  // 実際の Repository（実 DB 接続）
  const txManager = TxManager
  const userRepository = UserRepository
  const taskRepository = TaskRepository
  const reportRepository = ReportRepository
  // ... 他の Repository

  // UseCase を組み立て（外部サービスはモック、Repository は実物）
  const userUseCase = UserUseCase.from({ userRepository, txManager })

  const taskUseCase = TaskUseCase.from({
    taskRepository,
    reportRepository,
    userRepository,
    txManager,
    // ... 他の依存
  })

  const reportUseCase = ReportUseCase.from({
    reportRepository,
    taskRepository,
    txManager,
  })

  // ... 他の UseCase

  return {
    userUseCase,
    taskUseCase,
    reportUseCase,
    tokenService,             // ← モック
    notificationService,      // ← モック
    externalService,          // ← モック
    // ... 他
  } as Container
}
```

### テスト用アプリファクトリ

`services/api/test/helpers/createTestApp.ts`:

```typescript
import { OpenAPIHono } from '@hono/zod-openapi'
import { contextStorage } from 'hono/context-storage'
import type { MiddlewareHandler } from 'hono'
import type { HonoEnv } from '../../infra/http/hono/env'
import type { Container } from '../../infra/di/container'
import { handleError, handleZodError } from '../../infra/http/hono/error'
import { registerRoutes } from '../../infra/http/hono/routes'

export type TestAppOptions = {
  container: Container
  itemId: string
  user?: {
    id: string
    email: string
    name: string
  }
}

/**
 * テスト用の Hono アプリを作成
 * - 実 Container（AI のみモック）を注入
 * - 認証をバイパスしてテストユーザーを注入
 */
export const createTestApp = (options: TestAppOptions) => {
  const app = new OpenAPIHono<HonoEnv>({
    defaultHook: handleZodError,
  })

  app.use(contextStorage())
  app.onError(handleError)

  // テスト用ミドルウェア
  const testMiddleware: MiddlewareHandler<HonoEnv> = async (c, next) => {
    c.set('container', options.container)
    c.set('requestId', `test-${Date.now()}`)
    c.set('itemId', options.itemId)
    c.set('user', options.user ?? {
      id: options.itemId,
      email: 'test@example.com',
      name: 'Test User',
    })
    c.set('session', {
      id: 'test-session',
      itemId: options.itemId,
      expiresAt: new Date(Date.now() + 86400000),
    })
    await next()
  }

  app.use('*', testMiddleware)

  // 全ルートを登録
  return registerRoutes(app)
}
```

### DB ユーティリティ

`services/api/test/helpers/testDb.ts`:

```typescript
import { getDb } from '../../infra/repository/mysql/db'
import { items, orders } from '../../infra/repository/mysql/schema'
import { eq } from 'drizzle-orm'

/**
 * テスト用ユーザーを作成
 */
export const createTestItem = async (data: {
  id: string
  email: string
  name: string
}) => {
  const dbResult = await getDb()
  if (dbResult.err) throw dbResult.err

  const db = dbResult.val
  await db.insert(items).values({
    id: data.id,
    email: data.email,
    name: data.name,
    createdAt: new Date(),
    updatedAt: new Date(),
  })

  return data
}

/**
 * テストデータをクリーンアップ
 */
export const cleanupTestData = async (itemId: string) => {
  const dbResult = await getDb()
  if (dbResult.err) throw dbResult.err

  const db = dbResult.val

  // 関連データを削除（外部キー制約の順序に注意）
  await db.delete(// ... other tables.where(eq/itemId, itemId))
  await db.delete(orders).where(eq(orders.itemId, itemId))
  await db.delete(items).where(eq(items.id, itemId))
}

/**
 * トランザクション内でテストを実行（自動ロールバック）
 */
export const withTestTransaction = async <T>(
  fn: (tx: typeof db) => Promise<T>
): Promise<T> => {
  const dbResult = await getDb()
  if (dbResult.err) throw dbResult.err

  const db = dbResult.val

  return db.transaction(async (tx) => {
    const result = await fn(tx)
    // テスト後は常にロールバック
    throw new RollbackError(result)
  }).catch((e) => {
    if (e instanceof RollbackError) {
      return e.result
    }
    throw e
  })
}

class RollbackError<T> extends Error {
  constructor(public result: T) {
    super('Rollback')
  }
}
```

---

## テスト実装例

### Item API テスト（実 DB）

`services/api/test/integration/routes/item.test.ts`:

```typescript
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { testClient } from 'hono/testing'
import { createTestApp } from '../../helpers/createTestApp'
import { createTestContainer } from '../../helpers/createTestContainer'
import { createTestItem, cleanupTestData } from '../../helpers/testDb'

describe('Item API', () => {
  const TEST_ITEM_ID = `test-item-${Date.now()}`
  const container = createTestContainer()

  const app = createTestApp({
    container,
    itemId: TEST_ITEM_ID,
  })

  const client = testClient(app)

  // テスト用ユーザーを作成
  beforeAll(async () => {
    await createTestItem({
      id: TEST_ITEM_ID,
      status: 'active',
      name: 'Test Item',
    })
  })

  // テスト後にクリーンアップ
  afterAll(async () => {
    await cleanupTestData(TEST_ITEM_ID)
  })

  describe('GET /me', () => {
    it('アイテム情報を取得できる', async () => {
      const res = await client.me.$get()

      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.id).toBe(TEST_ITEM_ID)
      expect(data.email).toBe('integration-test@example.com')
    })
  })

  describe('PUT /me', () => {
    it('アイテム情報を更新できる', async () => {
      const res = await client.me.$put({
        json: {
          name: 'Updated Item Name',
          category: 'Category A',
        },
      })

      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.name).toBe('Updated Name')

      // DB に反映されているか確認
      const getRes = await client.me.$get()
      const getData = await getRes.json()
      expect(getData.name).toBe('Updated Name')
    })
  })
})
```

### Order API テスト（外部サービスモック）

```typescript
// services/api/test/integration/routes/order.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { testClient } from 'hono/testing'
import { createTestApp } from '../../helpers/createTestApp'
import { createTestContainer } from '../../helpers/createTestContainer'
import { createTestItem, cleanupTestData } from '../../helpers/testDb'

describe('Order API', () => {
  const TEST_ITEM_ID = `test-order-${Date.now()}`
  const container = createTestContainer()

  const app = createTestApp({
    container,
    itemId: TEST_ITEM_ID,
  })

  const client = testClient(app)

  beforeAll(async () => {
    await createTestItem({
      id: TEST_ITEM_ID,
      email: 'task-test@example.com',
      name: 'Order Test Item',
    })
  })

  afterAll(async () => {
    await cleanupTestData(TEST_ITEM_ID)
  })

  describe('POST /tasks', () => {
    it('新しいオーダーを作成できる', async () => {
      const res = await client['tasks'].$post({
        json: {
          title: 'Test Order',
          description: 'Test Order Description',
        },
      })

      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.id).toBeDefined()
      expect(data.status).toBe('pending')
    })
  })

  describe('POST /tasks/:id/complete', () => {
    it('オーダー処理時に結果が生成される（外部サービスはモック）', async () => {
      // オーダー作成
      const createRes = await client['tasks'].$post({
        json: {
          title: 'Test Order',
          description: 'Test Order Description',
        },
      })
      const order = await createRes.json()

      // オーダー処理
      const completeRes = await client['tasks'][':id'].complete.$post({
        param: { id: order.id },
        json: {
          items: [
            { productId: 'step1', quantity: 1 },
            { productId: 'step2', quantity: 1 },
          ],
        },
      })

      expect(completeRes.status).toBe(200)
      const result = await completeRes.json()

      // 結果が生成されている（モックからの応答）
      expect(result.processed).toBeDefined()
      expect(result.processed.status).toBe('completed')
    })
  })
})
```

### トランザクションロールバックを使ったテスト

```typescript
import { describe, it, expect } from 'vitest'
import { withTestTransaction } from '../../helpers/testDb'

describe('Item API with Transaction Rollback', () => {
  it('アイテム処理をテスト（自動ロールバック）', async () => {
    await withTestTransaction(async (tx) => {
      // このトランザクション内でのDB操作は
      // テスト終了後に自動的にロールバックされる

      // テストデータ作成
      await tx.insert(items).values({ ... })

      // API テスト
      // ...

      // アサーション
      expect(...).toBe(...)
    })
    // ここでロールバック済み
  })
})
```

---

## GitHub Actions 設定（実 DB）

`.github/workflows/api-test.yml`:

```yaml
name: API Integration Tests

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      mysql:
        image: mysql:8.0
        env:
          MYSQL_ROOT_PASSWORD: root
          MYSQL_DATABASE: my_app_test
        ports:
          - 3306:3306
        options: >-
          --health-cmd "mysqladmin ping -proot"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    items:
      - uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v4
        with:
          version: 10

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install

      - name: Run database migrations
        run: pnpm --filter server db:migrate
        env:
          DATABASE_URL: mysql://root:root@localhost:3306/my_app_test

      - name: Run API tests
        run: pnpm --filter server test:run
        env:
          DATABASE_URL: mysql://root:root@localhost:3306/my_app_test
          NODE_ENV: test
          # AI サービスの API キーは不要（モックされる）

      - name: Upload coverage
        uses: codecov/codecov-action@v4
        if: always()
        with:
          files: ./services/api/coverage/coverage-final.json
```

## GitHub Actions 設定

### 基本的な CI ワークフロー

`.github/workflows/api-test.yml`:

```yaml
name: API Tests

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      mysql:
        image: mysql:8.0
        env:
          MYSQL_ROOT_PASSWORD: root
          MYSQL_DATABASE: test_db
        ports:
          - 3306:3306
        options: >-
          --health-cmd "mysqladmin ping -proot"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    items:
      - uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v4
        with:
          version: 10

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install

      - name: Run database migrations
        run: pnpm --filter server db:migrate
        env:
          DATABASE_URL: mysql://root:root@localhost:3306/test_db

      - name: Run API tests
        run: pnpm --filter server test:run
        env:
          DATABASE_URL: mysql://root:root@localhost:3306/test_db
          NODE_ENV: test

      - name: Upload coverage report
        uses: codecov/codecov-action@v4
        if: always()
        with:
          files: ./services/api/coverage/coverage-final.json
          fail_ci_if_error: false
```

### カバレッジレポート付きワークフロー

```yaml
name: API Tests with Coverage

on:
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      mysql:
        image: mysql:8.0
        env:
          MYSQL_ROOT_PASSWORD: root
          MYSQL_DATABASE: test_db
        ports:
          - 3306:3306
        options: >-
          --health-cmd "mysqladmin ping -proot"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    items:
      - uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v4
        with:
          version: 10

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install

      - name: Run database migrations
        run: pnpm --filter server db:migrate
        env:
          DATABASE_URL: mysql://root:root@localhost:3306/test_db

      - name: Run tests with coverage
        run: pnpm --filter server test:coverage
        env:
          DATABASE_URL: mysql://root:root@localhost:3306/test_db
          NODE_ENV: test

      - name: Comment coverage on PR
        uses: davelosert/vitest-coverage-report-action@v2
        if: github.event_name == 'pull_request'
        with:
          working-directory: ./services/api
```

## テスト分類と推奨構成

### テストの種類

| 種類 | 対象 | 実行環境 | 頻度 |
|------|------|----------|------|
| **Unit** | Domain, UseCase | モック | PR毎 |
| **Integration** | API Routes + DB | 実DB（テスト用） | PR毎 |
| **E2E** | 全体フロー | 本番相当環境 | デプロイ前 |

### ディレクトリ構造案

```
services/api/
├── test/
│   ├── setup.ts           # テストセットアップ
│   ├── helpers/           # テストヘルパー
│   │   ├── db.ts         # DBテストユーティリティ
│   │   └── auth.ts       # 認証モック
│   └── fixtures/          # テストデータ
│       └── users.ts
├── domain/
│   └── domain/
│       └── item.test.ts   # ドメインテスト
├── usecase/
│   └── item.test.ts       # ユースケーステスト
└── infra/
    └── http/
        └── routes/
            └── item.test.ts  # APIテスト
```

## 外部サービスのモック戦略

### 外部 API サービス

```typescript
// test/helpers/external-mock.ts
import { vi } from 'vitest'

export const mockExternalServices = () => {
  return {
    externalAPIClient: {
      fetch: vi.fn().mockResolvedValue(
        Ok({ data: { id: 'item-123' }, status: 'success' })
      ),
    },
    notificationService: {
      send: vi.fn().mockResolvedValue(
        Ok({ sent: true, messageId: 'msg-123' })
      ),
    },
  }
}
```

### 外部 API サービス（個別モック）

```typescript
// test/helpers/external-service-mock.ts
import { vi } from 'vitest'

export const mockExternalService = () => {
  return {
    fetch: vi.fn().mockResolvedValue(
      Ok({ data: { id: 'item-123' }, status: 'success' })
    ),
    post: vi.fn().mockResolvedValue(
      Ok({ id: 'created-123', status: 'created' })
    ),
  }
}
```

## Result 型を使ったテストパターン

本プロジェクトでは `Result` 型を使用しているため、テストでも対応が必要。

```typescript
import { Ok, Err, isOk, isErr } from '@my-app/errors'

describe('UserUseCase', () => {
  it('ユーザー作成成功時は Ok を返す', async () => {
    const result = await userUseCase.createUser({ email: 'test@example.com' })

    expect(isOk(result)).toBe(true)
    if (isOk(result)) {
      expect(result.val.email).toBe('test@example.com')
    }
  })

  it('重複メール時は Err を返す', async () => {
    const result = await userUseCase.createUser({ email: 'duplicate@example.com' })

    expect(isErr(result)).toBe(true)
    if (isErr(result)) {
      expect(result.err.code).toBe('DUPLICATE_EMAIL')
    }
  })
})
```

## GitHub Actions: OpenAPI コントラクトテスト

### Schemathesis による自動テスト

`.github/workflows/openapi-test.yml`:

```yaml
name: OpenAPI Contract Tests

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  schemathesis:
    runs-on: ubuntu-latest

    services:
      mysql:
        image: mysql:8.0
        env:
          MYSQL_ROOT_PASSWORD: root
          MYSQL_DATABASE: test_db
        ports:
          - 3306:3306
        options: >-
          --health-cmd "mysqladmin ping -proot"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    items:
      - uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v4
        with:
          version: 10

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'pnpm'

      - name: Setup Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.12'

      - name: Install Schemathesis
        run: pip install schemathesis

      - name: Install dependencies
        run: pnpm install

      - name: Run database migrations
        run: pnpm --filter server db:migrate
        env:
          DATABASE_URL: mysql://root:root@localhost:3306/test_db

      - name: Start API server
        run: |
          pnpm --filter server dev &
          sleep 5  # サーバー起動待ち
        env:
          DATABASE_URL: mysql://root:root@localhost:3306/test_db

      - name: Run Schemathesis tests
        run: |
          schemathesis run http://localhost:8787/doc \
            --checks all \
            --hypothesis-max-examples 50 \
            --report
        continue-on-error: true

      - name: Upload test report
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: schemathesis-report
          path: .schemathesis/
```

### Step CI による宣言的テスト

`.github/workflows/stepci-test.yml`:

```yaml
name: Step CI API Tests

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  stepci:
    runs-on: ubuntu-latest

    services:
      mysql:
        image: mysql:8.0
        env:
          MYSQL_ROOT_PASSWORD: root
          MYSQL_DATABASE: test_db
        ports:
          - 3306:3306
        options: >-
          --health-cmd "mysqladmin ping -proot"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    items:
      - uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v4
        with:
          version: 10

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install

      - name: Run database migrations
        run: pnpm --filter server db:migrate
        env:
          DATABASE_URL: mysql://root:root@localhost:3306/test_db

      - name: Start API server
        run: |
          pnpm --filter server dev &
          sleep 5
        env:
          DATABASE_URL: mysql://root:root@localhost:3306/test_db

      - name: Run Step CI tests
        run: npx stepci run stepci.yml
```

---

## 推奨テスト戦略

### 組み合わせ案

| レイヤー | ツール | 目的 |
|----------|--------|------|
| **Unit** | Vitest | ドメインロジック・ユースケースの単体テスト |
| **Integration** | Vitest + testClient | API ルートの結合テスト（DIモック） |
| **Contract** | Schemathesis | OpenAPI 仕様との整合性・エッジケース検出 |
| **E2E** | Step CI / Bruno | シナリオベースの統合テスト |

### 段階的導入の推奨

1. **Phase 1**: Vitest + testClient で基本的な API テストを構築
2. **Phase 2**: Schemathesis を CI に追加し、OpenAPI 整合性を自動検証
3. **Phase 3**: 必要に応じて Step CI でシナリオテストを追加

---

## 参考リンク

### 公式ドキュメント

- [Vitest 公式](https://vitest.dev/)
- [Hono Testing Guide](https://hono.dev/docs/guides/testing)
- [Hono Testing Helper](https://hono.dev/docs/helpers/testing)
- [Schemathesis 公式](https://schemathesis.io/)
- [Step CI 公式](https://stepci.com/)
- [Bruno 公式](https://www.usebruno.com/)
- [Hoppscotch 公式](https://hoppscotch.io/)
- [Dredd](https://dredd.org/)
- [Prism](https://stoplight.io/open-source/prism)

### 比較・解説記事

- [Jest vs Vitest: Which Test Runner Should You Use in 2025?](https://medium.com/@ruverd/jest-vs-vitest-which-test-runner-should-you-use-in-2025-5c85e4f2bda9)
- [Vitest vs Jest Comparison](https://vitest.dev/guide/comparisons)
- [OpenAPI Testing and Validation](https://openapispec.com/docs/testing-and-validation/)
- [Automated Contract Testing with OpenAPI and Dredd](https://dev.to/r3d_cr0wn/enforcing-api-correctness-automated-contract-testing-with-openapi-and-dredd-2212)
- [Step CI: Automate API Testing](https://garysvenson09.medium.com/step-ci-automate-api-testing-7edebe796be7)
- [GitHub Actions MySQL Testing](https://blogs.oracle.com/mysql/running-mysql-tests-with-github-actions)
