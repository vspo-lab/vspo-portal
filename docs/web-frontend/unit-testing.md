# Unit Testing ガイド

本ドキュメントでは、プロジェクトに最適なユニットテストツールの調査結果と推奨事項をまとめる。

## 関連ドキュメント

- `docs/testing/unit-testing.md` - Unitテストの最新実装方針（モック最小 + テーブルドリブン）
- `docs/web-frontend/twada-tdd.md` - t_wadaベースのTDD運用ルール

## クイックスタート

```bash
# テスト実行
pnpm test

# 単発実行（CI向け）
pnpm test:run

# カバレッジ付き
pnpm test:coverage
```

## 現状分析

### プロジェクトの状態
- **テストファイル**: 23ファイル（354テスト）
- **テストフレームワーク**: Vitest v4.0.16
- **テスト設定ファイル**: `vitest.config.ts`

### テスト対象となる主要コンポーネント

```
services/api/
├── domain/           # ドメインモデル・ビジネスロジック（最優先）
│   ├── item/         # Item集約
│   ├── order/        # Order集約
│   
├── usecase/          # アプリケーションユースケース
├── pkg/              # ユーティリティ関数
└── infra/repository/ # リポジトリ層
```

### 技術スタック
- **ランタイム**: Node.js (ES Modules)
- **言語**: TypeScript 5.8.3
- **フレームワーク**: Hono
- **ORM**: Drizzle ORM
- **エラーハンドリング**: Result型（`@my-app/errors`）

---

## テストフレームワーク比較

### 1. Vitest ⭐ **推奨**

| 項目 | 評価 |
|------|------|
| ESM サポート | ◎ ネイティブ対応 |
| TypeScript サポート | ◎ 設定不要 |
| パフォーマンス | ◎ Jest比 10-20倍高速（watch mode） |
| Hono連携 | ◎ 公式サポート |
| 設定の容易さ | ◎ ゼロコンフィグ |
| エコシステム | ○ 成熟度高い |

**特徴:**
- Viteベースで高速な起動・HMR
- Jest互換API（移行が容易）
- 2025年1月にVitest 3.0リリース（週間700万DL超）
- 行番号によるテストフィルタリング機能

**参考リンク:**
- [Vitest 公式](https://vitest.dev/)
- [Vitest 3.0 リリースノート](https://vitest.dev/blog/vitest-3)
- [Migration Guide](https://vitest.dev/guide/migration.html)

---

### 2. Jest

| 項目 | 評価 |
|------|------|
| ESM サポート | △ 実験的（設定が複雑） |
| TypeScript サポート | △ ts-jest必要 |
| パフォーマンス | △ Vitest比で遅い |
| Hono連携 | ○ 可能 |
| 設定の容易さ | △ ESM/TSには追加設定必要 |
| エコシステム | ◎ 最も成熟 |

**特徴:**
- 長年のデファクトスタンダード
- 2025年6月にJest 30リリース（ESM改善）
- React Native必須の場合は推奨

**参考リンク:**
- [Jest 公式](https://jestjs.io/)
- [Jest vs Vitest 比較（Medium）](https://medium.com/@ruverd/jest-vs-vitest-which-test-runner-should-you-use-in-2025-5c85e4f2bda9)

---

### 3. Bun Test

| 項目 | 評価 |
|------|------|
| ESM サポート | ◎ ネイティブ |
| TypeScript サポート | ◎ トランスパイル不要 |
| パフォーマンス | ◎ 最速（同期テスト） |
| Hono連携 | ○ 可能 |
| 設定の容易さ | ◎ ゼロコンフィグ |
| エコシステム | △ 発展途上 |

**特徴:**
- Node.jsの2倍高速（同期テスト）
- 非同期テストは単一スレッドのため性能低下
- Bunランタイム全体の採用が前提

**参考リンク:**
- [Bun Test Runner](https://bun.sh/docs/cli/test)
- [Node vs Bun Test Runner](https://dev.to/boscodomingo/node-test-runner-vs-bun-test-runner-with-typescript-and-esm-44ih)

---

### 4. Node.js Native Test Runner

| 項目 | 評価 |
|------|------|
| ESM サポート | ○ 対応 |
| TypeScript サポート | × ローダー必要（tsx） |
| パフォーマンス | ○ 良好 |
| Hono連携 | ○ 可能 |
| 設定の容易さ | △ TypeScript設定必要 |
| エコシステム | △ 発展途上 |

**特徴:**
- 依存ゼロ（Node.js組み込み）
- スナップショットテスト・タイマーモック未対応
- シンプルなプロジェクト向け

**参考リンク:**
- [Node.js Test Runner](https://nodejs.org/api/test.html)
- [Better Stack 比較記事](https://betterstack.com/community/guides/testing/best-node-testing-libraries/)

---

## 推奨: Vitest

### 選定理由

1. **ESM ネイティブサポート**: プロジェクトが `"type": "module"` を使用
2. **TypeScript ゼロコンフィグ**: ts-jest等の追加設定不要
3. **Hono公式サポート**: テストヘルパー・クライアント提供
4. **高速なフィードバック**: CI/開発時のテスト実行が高速
5. **Jest互換API**: 学習コスト低

### パフォーマンス比較

| ベンチマーク | Vitest | Jest |
|-------------|--------|------|
| コールドスタート | 4倍高速 | 基準 |
| Watch mode | 10-20倍高速 | 基準 |
| メモリ使用量 | 30%削減 | 基準 |

*参考: [Vitest vs Jest（Better Stack）](https://betterstack.com/community/guides/scaling-nodejs/vitest-vs-jest/)*

---

## 導入手順

### 1. 依存関係のインストール

```bash
# services/api ディレクトリで実行
pnpm add -D vitest @vitest/coverage-v8
```

### 2. Vitest設定ファイル作成

`services/api/vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['domain/**', 'usecase/**', 'pkg/**'],
    },
  },
  resolve: {
    alias: {
      '@': '/services/api',
    },
  },
})
```

### 3. package.json にスクリプト追加

```json
{
  "scripts": {
    "test": "vitest",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage"
  }
}
```

### 4. TypeScript設定（オプション）

`services/api/tsconfig.json` にVitest型を追加:

```json
{
  "compilerOptions": {
    "types": ["vitest/globals"]
  }
}
```

---

## テスト戦略

### テーブルドリブンテスト（Go-like）

本プロジェクトでは **Go言語スタイルのテーブルドリブンテスト** を採用する。

#### 基本パターン

```typescript
import { describe, expect, it } from "vitest";

describe("関数名", () => {
  const testCases = [
    {
      name: "ケース1の説明",
      input: { /* 入力値 */ },
      expected: { /* 期待値 */ },
    },
    {
      name: "ケース2の説明",
      input: { /* 入力値 */ },
      expected: { /* 期待値 */ },
    },
  ];

  it.each(testCases)("$name", ({ input, expected }) => {
    const result = targetFunction(input);
    expect(result).toMatchObject(expected);
  });
});
```

#### 実践例: Item.create

```typescript
describe("Item.create", () => {
  const testCases = [
    {
      name: "基本的なアイテム作成",
      input: { name: "サンプルアイテム", status: "active" },
      expected: {
        name: "サンプルアイテム",
        status: "active",
        createdAt: new Date(),
        quantity: 1,
      },
    },
    {
      name: "メタデータ付きアイテム作成",
      input: {
        name: "別のアイテム",
        status: "draft",
        metadata: { key: "value" },
      },
      expected: {
        name: "別のアイテム",
        status: "draft",
        metadata: { key: "value" },
      },
    },
  ];

  it.each(testCases)("$name", ({ input, expected }) => {
    const item = Item.create(input);
    expect(item).toMatchObject(expected);
  });
});
```

#### Type Guard テスト

```typescript
describe("ItemStatus.isActive", () => {
  const testCases = [
    {
      name: "アクティブなアイテムの場合 true",
      profile: activeItem,
      expected: true,
    },
    {
      name: "アーカイブされたアイテムの場合 false",
      profile: archivedItem,
      expected: false,
    },
  ];

  it.each(testCases)("$name", ({ profile, expected }) => {
    expect(ItemStatus.isActive(profile)).toBe(expected);
  });
});
```

### テーブルドリブンテストのメリット

1. **網羅性**: 入力パターンを一覧で管理、漏れを防止
2. **可読性**: テストケースがデータとして整理される
3. **保守性**: 新規ケース追加が容易（配列に追加するだけ）
4. **デバッグ**: 失敗時に `$name` でどのケースか明確

### ドメインモデルテスト（最優先）

ドメイン層は純粋関数・決定的なロジックが多く、モック不要でテスト可能。

### ユースケーステスト

リポジトリやトランザクションマネージャーのモックが必要。

```typescript
// usecase/user.test.ts
import { describe, expect, it, vi } from "vitest";
import { createUser } from "./user";

describe("createUser", () => {
  const testCases = [
    {
      name: "正常にユーザーを作成",
      mockReturn: { isOk: () => true },
      input: { name: "Test", status: "active" },
      expectedOk: true,
    },
    {
      name: "リポジトリエラー時は失敗",
      mockReturn: { isOk: () => false, error: "DB_ERROR" },
      input: { name: "Test", status: "active" },
      expectedOk: false,
    },
  ];

  it.each(testCases)("$name", async ({ mockReturn, input, expectedOk }) => {
    const mockRepo = {
      save: vi.fn().mockResolvedValue(mockReturn),
    };

    const result = await createUser(mockRepo, input);

    expect(result.isOk()).toBe(expectedOk);
    expect(mockRepo.save).toHaveBeenCalledOnce();
  });
});
```

### Honoエンドポイントテスト

Honoの `app.request()` を使用した統合テスト。

```typescript
// infra/http/user.test.ts
import { describe, expect, it } from "vitest";
import { app } from "./app";

describe("GET /api/users/:id", () => {
  const testCases = [
    {
      name: "存在するユーザーを取得",
      path: "/api/users/123",
      expectedStatus: 200,
    },
    {
      name: "存在しないユーザーは404",
      path: "/api/users/999",
      expectedStatus: 404,
    },
  ];

  it.each(testCases)("$name", async ({ path, expectedStatus }) => {
    const res = await app.request(path);
    expect(res.status).toBe(expectedStatus);
  });
});
```

*参考: [Hono Testing Guide](https://hono.dev/docs/guides/testing)*

---

## データベーステスト戦略

### 選択肢1: リポジトリモック（推奨）

```typescript
const mockUserRepo = {
  findById: vi.fn(),
  save: vi.fn(),
}
```

**利点**: 高速、外部依存なし、ユニットテストに最適

### 選択肢2: PGlite（インメモリPostgres）

```typescript
import { PGlite } from '@electric-sql/pglite'
import { drizzle } from 'drizzle-orm/pglite'

const client = new PGlite()
const db = drizzle(client)
```

**利点**: 実際のSQLをテスト可能
**注意**: MySQL使用のため、完全な互換性は保証されない

*参考: [Drizzle + PGlite テスト](https://github.com/rphlmr/drizzle-vitest-pg)*

### 選択肢3: Testcontainers

```typescript
import { MySQLContainer } from '@testcontainers/mysql'

const container = await new MySQLContainer().start()
```

**利点**: 本番同等のMySQL環境
**欠点**: Docker必要、テスト速度低下

---

## ディレクトリ構成案

```
services/api/
├── domain/
│   ├── domain/
│   │   ├── user.ts
│   │   └── user.test.ts      # コロケーション
│   └── task/
│       ├── task.ts
│       └── task.test.ts
├── usecase/
│   ├── user.ts
│   └── user.test.ts
├── vitest.config.ts
└── vitest.setup.ts            # グローバルセットアップ
```

**コロケーション方式**: テストファイルをソースファイルと同じディレクトリに配置

---

## CI/CD 統合

### GitHub Actions 例

```yaml
# .github/workflows/test.yml
name: Test

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'

      - run: pnpm install
      - run: pnpm --filter server test:run
      - run: pnpm --filter server test:coverage
```

---

## 参考リンク

### 公式ドキュメント
- [Vitest 公式](https://vitest.dev/)
- [Hono Testing Guide](https://hono.dev/docs/guides/testing)
- [Hono Testing Helper](https://hono.dev/docs/helpers/testing)

### 比較記事
- [Jest vs Vitest: Which Test Runner Should You Use in 2025?](https://medium.com/@ruverd/jest-vs-vitest-which-test-runner-should-you-use-in-2025-5c85e4f2bda9)
- [Vitest vs Jest | Better Stack](https://betterstack.com/community/guides/scaling-nodejs/vitest-vs-jest/)
- [Best Node.js Testing Libraries | Better Stack](https://betterstack.com/community/guides/testing/best-node-testing-libraries/)

### Drizzle ORM テスト
- [Drizzle + Vitest + PGlite Example](https://github.com/rphlmr/drizzle-vitest-pg)
- [NestJS + Drizzle Unit Tests](https://wanago.io/2024/09/23/api-nestjs-drizzle-orm-unit-tests/)

---

## まとめ

| 観点 | 推奨 |
|------|------|
| フレームワーク | **Vitest** |
| 優先テスト対象 | ドメインモデル（`domain/`） |
| テスト配置 | コロケーション（同一ディレクトリ） |
| DBテスト | リポジトリモック |
| カバレッジ | v8 プロバイダー |

---

## テスト実装ガイド

### レイヤー別テスト構成

現在のテストは以下のレイヤーに分かれている：

```
services/api/
├── domain/                    # ドメインモデルテスト
│   ├── item/
│   │   ├── item.test.ts       # Item集約
│   │   └── item-status.test.ts
│   ├── order/
│   │   ├── order.test.ts
│   │   └── line-item.test.ts
│   └── report/
│       ├── report.test.ts
│       └── report-item.test.ts
├── usecase/                   # ユースケーステスト
│   ├── item.test.ts
│   └── order.test.ts
├── pkg/                       # ユーティリティテスト
│   ├── date.test.ts
│   ├── uuid.test.ts
│   └── textNormalizer.test.ts
├── infra/
│   └── external-api/          # Infra層テスト
│       ├── external-api-service.test.ts
│       └── config-mapping.test.ts
└── test/
    └── integration/           # 統合テスト（別途実行）
        └── routes/

packages/errors/               # エラーハンドリングテスト
├── result.test.ts
├── error.test.ts
└── code.test.ts
```

### Usecase層テストのモックパターン

Usecase層のテストでは、Repository と TxManager をモックする。

#### 1. TxManager モック

```typescript
import type { TxManager } from "../infra/repository/txManager";

const mockTxManager: TxManager = {
  runTx: vi.fn(async (operation) => operation({} as never)),
};
```

`runTx`はトランザクション内でコールバックを実行する。モックでは即座にコールバックを呼び出す。

#### 2. Repository モック

```typescript
import type { UserRepository } from "../infra/repository/user";

// モック関数の型定義
let getByIdMock: ReturnType<
  typeof vi.fn<(id: string) => Promise<Result<User, AppError>>>
>;
let updateMock: ReturnType<
  typeof vi.fn<(user: User) => Promise<Result<User, AppError>>>
>;

beforeEach(() => {
  getByIdMock = vi.fn();
  updateMock = vi.fn();

  const mockUserRepository: UserRepository = {
    from: () => ({
      getById: getByIdMock,
      getByEmail: vi.fn(),
      create: vi.fn(),
      update: updateMock,
      delete: vi.fn(),
    }),
  };
});
```

`from()`パターンを使用しているため、モックも同じ構造にする。

#### 3. テストケースの書き方

```typescript
describe("getById", () => {
  const testCases = [
    {
      name: "ユーザーが見つかった場合、Okを返す",
      userId: "user-123",
      repoResult: () => Ok(createMockItem()),
      expectOk: true,
    },
    {
      name: "ユーザーが見つからない場合、Errを返す",
      userId: "not-found",
      repoResult: () =>
        Err(new AppError({ message: "User not found", code: "NOT_FOUND" })),
      expectOk: false,
      expectedCode: "NOT_FOUND",
    },
  ];

  it.each(testCases)("$name", async ({
    userId,
    repoResult,
    expectOk,
    expectedCode,
  }) => {
    getByIdMock.mockResolvedValue(repoResult());

    const result = await useCase.getById({ userId });

    expect(getByIdMock).toHaveBeenCalledWith(userId);
    if (expectOk) {
      expect(result.err).toBeUndefined();
      expect(result.val).toBeDefined();
    } else {
      expect(result.err).toBeDefined();
      expect(result.err?.code).toBe(expectedCode);
    }
  });
});
```

**ポイント:**
- `repoResult`を関数にすることで、各テストケースごとに新しいResultインスタンスを生成
- `expectedCode`はエラーケースのみに設定

### Infra層テストのモックパターン

外部APIサービスのモックパターン。

```typescript
const createMockExternalAPI = () => ({
  resources: {
    create: vi.fn(),
    retrieve: vi.fn(),
    list: vi.fn(),
  },
  actions: {
    execute: vi.fn(),
  },
  webhooks: {
    verifySignature: vi.fn(),
  },
});

describe("ExternalAPIService", () => {
  describe("createResource", () => {
    const testCases = [
      {
        name: "リソースを作成できる",
        input: { userId: "user-123", status: "active", name: "Test" },
        mockResult: { id: "res_123", status: "active" },
        expectOk: true,
      },
      {
        name: "外部APIエラーの場合、Errを返す",
        input: { userId: "user-123", status: "active", name: "Test" },
        mockError: new Error("External API Error"),
        expectOk: false,
        expectedCode: "INTERNAL_SERVER_ERROR",
      },
    ];

    it.each(testCases)("$name", async ({
      input,
      mockResult,
      mockError,
      expectOk,
      expectedCode,
    }) => {
      const mockAPI = createMockExternalAPI();
      if (mockResult) {
        mockAPI.resources.create.mockResolvedValue(mockResult);
      } else if (mockError) {
        mockAPI.resources.create.mockRejectedValue(mockError);
      }

      const service = createExternalAPIService(mockAPI as never, "secret");
      const result = await service.createResource(input);

      if (expectOk) {
        expect(result.err).toBeUndefined();
      } else {
        expect(result.err?.code).toBe(expectedCode);
      }
    });
  });
});
```

### テストヘルパーファクトリ

ドメインオブジェクトのファクトリ関数を作成し、再利用する。

```typescript
// モックアイテムファクトリ
const createMockItem = (overrides: Partial<Item> = {}): User => ({
  id: "item-123",
  name: "Test Item",
  status: "active",
  createdAt: new Date(),
  quantity: 1,
  // ...
  },
  },
    category: null,
    description: null,
    price: null,
    quantity: 1,
    tags: [],
    metadata: {},
    ,
    ,
  },
  createdAt: new Date("2025-01-01T00:00:00.000Z"),
  updatedAt: new Date("2025-01-01T00:00:00.000Z"),
  ...overrides,
});
```

### 環境変数のテスト

```typescript
describe("config", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = {
      ...originalEnv,
      API_BASE_URL: "https://api.example.com",
      API_TIMEOUT: "5000",
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it.each(testCases)("$name", ({ input, expected }) => {
    expect(getConfig(input)).toBe(expected);
  });
});
```

### テスト命名規則

日本語でテストケース名を記述する：

```typescript
const testCases = [
  { name: "ユーザーが見つかった場合、Okを返す", ... },
  { name: "ユーザーが見つからない場合、Errを返す", ... },
  { name: "更新失敗した場合、Errを返す", ... },
  { name: "既に処理済みの場合、Errを返す", ... },
];
```

**命名パターン:**
- 正常系: `「〜できる」「〜を返す」`
- 異常系: `「〜の場合、Errを返す」`
- 条件付き: `「〜が〜の場合、〜」`
