# REST API Design Principles

## 概要

このドキュメントでは、API の RESTful 設計原則を定義します。

## 設計原則

### 1. リソース指向 URL

URL はリソース（名詞）を表し、操作（動詞）は HTTP メソッドで表現します。

```
# Good
GET    /items                # アイテム一覧取得
POST   /items                # アイテム作成
GET    /items/{id}           # アイテム取得
PUT    /items/{id}           # アイテム更新
DELETE /items/{id}           # アイテム削除

# Bad
GET    /getItems
POST   /createItem
GET    /users/me/home       # "home" はリソースではない
```

### 2. HTTP メソッド

| メソッド | 説明 | 冪等性 | 安全性 |
|---------|------|-------|-------|
| GET    | リソース取得 | あり | あり |
| POST   | リソース作成、アクション実行 | なし | なし |
| PUT    | リソース更新（部分更新を含む） | あり | なし |
| DELETE | リソース削除 | あり | なし |

**注意**: PATCH は使用しません。部分更新は PUT でドメインモデル全体を送信し、サーバー側で差分を計算します。

### 3. リソース命名規則

- **複数形を使用**: `/items`, `/users`, `/orders`
- **snake_case を使用**: `/api_tokens`, `/user_settings`（ハイフンは使わない）
- **ネストは2階層まで**: `/orders/{id}/items`（OK）、`/orders/{id}/items/{itemId}/comments`（避ける）
- **リソース識別子はパスパラメータ**: `/items/{id}`
- **フィルタリングはクエリパラメータ**: `/items?status=completed&limit=10`

### 4. フィルタリング、ソート、ページネーション

クエリパラメータを使用します。

```
# フィルタリング
GET /items?status=completed
GET /orders?user_id={userId}

# ソート
GET /items?sort=-created_at        # 降順
GET /items?sort=created_at         # 昇順

# ページネーション
GET /items?limit=20&offset=0
GET /items?cursor={lastId}         # カーソルベース
```

### 5. 現在のユーザーリソース

現在のユーザーリソースには `/me` を使用しますが、常に具体的なリソースに紐づけます。

```
# Good
GET  /me                    # 現在のユーザー情報
GET  /me/settings           # ユーザー設定
PUT  /me/settings           # ユーザー設定の更新

# Bad
GET  /users/me/home         # "home" はリソースではない
GET  /users/me/history      # "history" はリソースではない
```

### 6. サブリソース vs クエリパラメータ

強い関連にはサブリソース、弱い関連にはクエリパラメータを使用します。

```
# 強い関連（サブリソース）
GET  /orders/{id}/items
GET  /orders/{id}/summary
POST /orders/{id}/items

# 弱い関連（クエリパラメータ）
GET  /reports?order_id={id}
GET  /notifications?user_id={id}
```

### 7. リソースに対するアクション

アクション（状態遷移）は明示的なサブリソースとして表現します。

```
# Good - 状態を表すサブリソース
POST /orders/{id}/completion       # 注文を完了する
```
