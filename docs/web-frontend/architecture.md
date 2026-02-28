# Frontend Architecture

## 概要

フロントエンドアーキテクチャは Feature-based アプローチを採用し、技術レイヤーではなくドメイン機能単位でコードを整理します。この構成は DDD の原則に沿いつつ、フロントエンド開発に適応させたものです。各 Feature 内では Container/Presentational パターン（Container 1st 設計）を実装し、ビジネスロジックと UI 表示を分離します。

このアーキテクチャは Next.js App Router 向けに設計されており、**Feature とページは1:1で対応**します。`app/` 内の各ルートは1つの Feature に対応し、ルーティングと Feature ロジックを密結合に保ちます。

## レンダリング基盤 (React Compiler + Cache Components)

フロントエンドは以下のデフォルト設定で設計されています。

- `services/web/next.config.ts` で `reactCompiler: true`
- `services/web/next.config.ts` で `cacheComponents: true`
- デフォルトは Server Components、インタラクティビティが必要な場合のみ Client Components

設計上の影響:

1. **メモ化はコンパイラファースト**: 投機的なパフォーマンス目的だけで `useMemo`/`useCallback` を追加しない
2. **レンダリングはキャッシュファースト**: `'use cache'` でキャッシュ可能なデータ境界を定義し、明示的に無効化する
3. **動的境界は明示する**: 動的な部分を `<Suspense>` で囲み、静的なシェルは外側に置く

具体的なルールは以下を参照:

- `docs/web-frontend/react-hooks.md`
- `docs/web-frontend/cache-components.md`

## ディレクトリ構成

ディレクトリ構成は以下のとおりです。

```
app/                          # Next.js App Router（ルートとページ）
├── layout.tsx                # ルートレイアウト
├── globals.css               # グローバルスタイル
├── (public)/                 # 公開ページ（利用規約、お問い合わせなど）
├── (auth)/                   # 認証ページ（[feature-name]）
└── (protected)/              # 認証済みページ（ホームなど）
│
features/                     # Feature モジュール（ビジネスロジック）
├── [your-feature]/           # コア Feature モジュール
│   ├── api/                  # Feature API モジュール
│   ├── components/
│   │   ├── containers/       # ビジネスロジックコンテナ
│   │   └── presenters/       # UI プレゼンター
│   ├── hooks/                # カスタム Hooks
│   └── types/                # 型定義
├── [feature-name]/           # 各 Feature モジュール
│
shared/                       # アプリ全体の共有コード
├── components/               # 共有 UI ビルディングブロック
│   ├── ui/                   # ベースデザインシステム（Button, Input, Card 等）
│   ├── presenters/           # 再利用可能なプレゼンテーションコンポーネント
│   └── containers/           # 共有コンテナコンポーネント（AppShell, AuthGuard）
├── lib/                      # 共有ライブラリ（apiConfig 等）
└── utils/
```

## Container/Presentational パターン

コンポーネント内の関心を分離するために Container 1st アプローチを採用します。

### Container コンポーネント

- 「何をするか」を担当:
  - データ取得と状態管理
  - ビジネスロジック
  - イベントハンドリング
  - データ変換
- データとコールバックをプレゼンテーションコンポーネントに渡す
- 大きなマークアップやスタイリングを含まない

### Presentational コンポーネント

- 「どう見せるか」を担当:
  - UI レンダリング
  - スタイリング
  - アニメーション
  - アクセシビリティ
- props 経由でデータとコールバックを受け取る
- 通常は純粋な関数コンポーネント
- 異なるコンテナ間で再利用可能

### 例

**Container** (`ItemPage.tsx`):

```tsx
"use client";

import { fetchItemData } from "../api/itemApi";
import { ItemPagePresenter } from "../presenters/ItemPagePresenter";

export const ItemPage = () => {
  // データ取得 + デバイス選択ロジックはここに配置
  return <ItemPagePresenter /* props */ />;
};
```

**Presenter** (`ItemPagePresenter.tsx`):

```tsx
type Props = {
  items: Array<{ id: string; name: string; status: string }>;
};

export const ItemPagePresenter = ({ items }: Props) => {
  return <section>{/* アイテムを描画 */}</section>;
};
```

### ポイント

| Container | Presenter |
|-----------|-----------|
| `useState`, `useEffect` | Props のみ |
| ビジネスロジック（フィルタリング等） | 純粋なレンダリング |
| イベントハンドラロジック | `onClick={onXxx}` |
| 最小限の JSX | リッチな JSX とスタイリング |

## API アクセス

- Feature 固有の API モジュールは `features/<feature>/api/` に配置する
- ベース URL には `shared/lib/apiConfig.ts` を使用する
- API 関数は `@my-app/errors` の `Result` を返す
- Feature 固有のエンドポイントはモジュールごとに定義する

## コンポーネントの整理

コンポーネントは3つの方法で整理します。

1. **ページ固有のコンポーネント** (`_components/`): 各ルート内に配置し、そのページでのみ使用します。`_` プレフィックスはルートにプライベートであることを示し、ルーティングから除外します。

   ```
   app/feature/
   ├── page.tsx
   └── _components/        # このルートにプライベート（アンダースコアプレフィックス）
       ├── FeatureTimer.tsx
       ├── StatusBadge.tsx
       └── ...
   ```

2. **Feature 固有のコンポーネント**: 各 Feature モジュール内に配置し、その Feature 内で再利用します。

   ```
   features/item/components/
   ├── containers/
   │   ├── ItemPage.tsx
   │   └── ...
   └── presenters/
       ├── ItemPagePresenter.tsx
       └── ...
   ```

3. **共有コンポーネント**: `shared/components/` に配置し、Feature 間で再利用します。

   ```
   shared/components/
   ├── containers/
   │   ├── Modal.tsx
   │   ├── Pagination.tsx
   │   └── ...
   └── presenters/
       ├── Button.tsx
       ├── Card.tsx
       └── ...
   ```

## App Router 構成

Next.js App Router では、Feature とページは **1:1で対応**します。各ルートは1つの Feature に対応します。

### ルート構成

```
app/                        # エントリページ
├── page.tsx
└── _components/            # ページ固有コンポーネント（任意）
app/feature/
├── page.tsx                # Feature ページ
├── loading.tsx             # ローディング UI（任意）
├── error.tsx               # エラー UI（任意）
└── _components/            # ページ固有コンポーネント（任意）
```

### 命名規則

- **`_` プレフィックス**: ページ固有のフォルダ（例: `_components/`, `_hooks/`）にアンダースコアを付ける理由:
  - ルートにプライベートであることを示す
  - Next.js がルートセグメントとして扱うのを防ぐ
  - ページ固有のコードと共有コードを明確に区別する

### ページコンポーネントパターン

```tsx
// app/items/page.tsx (Server Component)
import { getItems } from '@/features/items/api'
import { ItemList } from './_components/UserList'

export default async function ItemsPage() {
  const items = await getItems()
  return <ItemList items={items} />
}
```

```tsx
// app/items/_components/ItemList.tsx (Client or Server Component)
import { ItemCard } from './ItemCard'
import type { Item } from '@/features/items/types'

type Props = {
  items: Item[]
}

export function ItemList({ users }: Props) {
  return (
    <div>
      { items.map(item => (
        <ItemCard key={item.id} item={item} />
      ))}
    </div>
  )
}
```

## 設計原則

1. **Feature-Page 1:1 対応**: `app/` 内の各ルートは正確に1つの Feature に対応します。ルーティングとビジネスロジックを密結合に保ちます。
2. **Feature の分離**: 各 Feature は自己完結し、他の Feature への依存を最小化します。Feature 間のインポートを避けます。
3. **共有コンポーネント**: 共通の UI 要素は `shared/components/` に配置して再利用します。
4. **ドメイン駆動**: Feature は技術的な関心事ではなく、ビジネスドメインに沿って設計します。
5. **Container 1st 設計**: 常にコンテナから始めて何をすべきかを定義し、次にプレゼンターを作成します。
6. **関心の分離**:
   - Container はロジックとデータを扱う
   - Presenter は UI とスタイリングを扱う
7. **Feature 内のレイヤードアプローチ**:
   - UI Layer: Presenters
   - Application Layer: Containers, Hooks
   - Domain Layer: ビジネスロジック、データ変換
   - Infrastructure Layer: API 呼び出し、外部サービス連携
8. **コロケーション**: 関連するコードは近くに配置します。ページ固有のコンポーネントはルート内の `_components/` に配置します。
9. **コンパイラファースト Hooks**: プレーンな計算とイベントハンドラから始め、振る舞い/制御が必要な場合のみメモ化 Hooks を使用します。
10. **キャッシュファースト App Router**: キャッシュ境界（`'use cache'`, `cacheLife`, `cacheTag`）を Feature 設計の一部として扱い、後付けにしません。

## データフロー

1. Container コンポーネントがデータを取得・管理する
2. データは props 経由で Presentational コンポーネントに流れる
3. Presentational コンポーネントでのユーザーイベントが Container で定義されたコールバックをトリガーする
4. Container コンポーネントがイベントに基づいて状態を更新する

## 依存方向

依存は単方向に流れます。

```
      shared/
         ↓
     features/
         ↓
       app/
```

### ルール

- **Shared → Features**: 共有コードはすべての Feature から使用可能
- **Features → App**: Feature は app ルートからインポート可能
- **禁止**: Feature が他の Feature からインポートしてはならない
- **禁止**: 共有コードが features や app からインポートしてはならない
- Feature 内: Container → Presenter（一方向）

### Feature 間通信

Feature 間のインポートではなく、app レベルで合成します。

```tsx
// ❌ Bad: Feature 間のインポート
// features/reviews/components/ReviewList.tsx
import { Avatar } from '@/shared/components'

// ✅ Good: app レベルで合成
// app/items/[id]/_components/ItemReviews.tsx
import { ReviewList } from '@/features/reviews/components'
import { Avatar } from '@/shared/components'
```

## テスト戦略

- Container テスト: ビジネスロジックと状態管理をテストする
- Presenter テスト: UI レンダリングとインタラクションをテストする
- Integration テスト: Container と Presenter のペアの連携をテストする
- E2E テスト: ユーザーフロー全体をテストする

## 実装ガイドライン

- アプリケーション全体で TypeScript を使用して型安全性を確保する
- `reactCompiler` と `cacheComponents` は、実証されたブロッカーがない限り有効に保つ
- ファイルとコンポーネントの命名規則を統一する
  - ContainerName.tsx と NamePresenter.tsx
  - ページ固有フォルダには `_` プレフィックスを使用（`_components/`, `_hooks/`）
- Presenter は可能な限り純粋関数として保つ
- コンポーネント API は JSDoc または Storybook でドキュメント化する
- Container から複雑なロジックを抽出・再利用するためにカスタム Hooks を使用する
- デフォルトは Server Components を優先し、`'use client'` は必要な場合のみ使用する
- barrel ファイルではなくファイルを直接インポートする（tree shaking に有利）

## 状態管理

- Feature 固有の状態は Feature モジュール内に閉じ込める
- Feature 横断の状態はセントラルストアまたはコンテキストで管理する
- 可能な限り、クライアントサイドの状態よりも Server Components と URL ステートを優先する

## Feature 構成

Feature には必要なフォルダのみを含めます。

```
features/awesome-feature/
├── api/          # API リクエスト宣言と Hooks
├── components/   # この Feature にスコープされたコンポーネント
│   ├── containers/
│   └── presenters/
├── hooks/        # この Feature にスコープされた Hooks
├── types/        # この Feature の TypeScript 型定義
└── utils/        # この Feature のユーティリティ関数
```
