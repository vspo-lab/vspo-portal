# Database and SQL Antipatterns

## 概要

このドキュメントは、リレーショナルデータベースと SQL に関する実践的なアンチパターンチェックをまとめたものです。以下を参考にしています。

- SQL Antipatterns（第2版）の構成: 4カテゴリ25アンチパターン
- 講演: 「SQL アンチパターン第2版 入門」（Developers Summit 2025 Summer）

`services/api/infra/repository/mysql/` および関連する domain/usecase コードの設計時・コードレビュー時のチェックリストとして使用してください。

## 4カテゴリ

### 1. 論理データベース設計

代表的なアンチパターン:

- Jaywalking（カンマ区切り ID を1カラムに格納）
- Naive Trees
- ID Required
- Keyless Entry
- EAV (Entity-Attribute-Value)
- Polymorphic Associations
- Multicolumn Attributes
- Metadata Tribbles

主なリスク: データ整合性が崩壊し、制約が DB からアプリケーションコードに移動します。

### 2. 物理データベース設計

代表的なアンチパターン:

- 31 Flavors
- Index Shotgun
- Fear of UNKNOWN
- Ambiguous Groups
- Random Selection

主なリスク: パフォーマンスチューニングとスキーマ変更が推測に頼ることになります。

### 3. クエリ記述

代表的なアンチパターン:

- Spaghetti Query
- Implicit Columns
- Poor Man's Search Engine
- Random Selection
- Pattern Matching Usage

主なリスク: SQL の可読性、予測可能性、オプティマイザとの相性が低下します。

### 4. アプリケーション開発

代表的なアンチパターン:

- Blunt Hammer
- Read Committed?
- Fear of UNKNOWN
- Phantom Files
- Two-headed Monster

主なリスク: 本番環境でトランザクション境界と整合性保証が壊れます。

## このテンプレートでの優先ルール

### 1. ID リストを1カラムに格納しない (Jaywalking)

Bad:

```sql
CREATE TABLE products (
  product_id BIGINT PRIMARY KEY,
  account_ids VARCHAR(255) -- "12,34,56"
);
```

Good:

```sql
CREATE TABLE product_accounts (
  product_id BIGINT NOT NULL,
  account_id BIGINT NOT NULL,
  PRIMARY KEY (product_id, account_id),
  FOREIGN KEY (product_id) REFERENCES products(product_id),
  FOREIGN KEY (account_id) REFERENCES accounts(account_id)
);
```

理由: 正規表現による JOIN や文字列分割による更新が不要になり、インデックスが使え、FK による整合性が保証されます。

### 2. 主キーと外部キーを必ず定義する (Keyless Entry)

- すべてのテーブルに安定した主キーを設ける
- すべての関連に FK を明示する
- FK が使えない場合（外部境界など）は、スキーマコメントと docs にその理由を記載する

### 3. クエリと整合性のトレードオフを明確に受け入れない限り EAV を採用しない

推奨:

- 安定した属性には型付きカラムを使用する
- JSON カラムは、真にスパースで拡張可能な属性にのみ使用する
- JSON を使う場合は、スキーマ層とドメイン層の両方でバリデーションする

### 4. "type + id" ペアによるポリモーフィック関連を避ける

Bad:

```sql
owner_type VARCHAR(50), owner_id BIGINT
```

推奨:

- 対象の集約ごとに個別の中間テーブルを用意する
- または、FK 制約付きのスーパータイプ/サブタイプテーブルを使用する

### 5. 直感ではなくクエリパターンからインデックスを追加する (Index Shotgun)

- 実際の `WHERE`, `JOIN`, `ORDER BY` から始める
- フィルタ順序に合った複合インデックスを優先する
- 未使用または重複したインデックスを削除して書き込みコストを減らす

### 6. NULL のセマンティクスを明示的に扱う (Fear of UNKNOWN)

- カラムごとに `NULL` が有効な状態かどうかを判断する
- `''`, `0`, `'N/A'` などのセンチネル値を偽の NULL として使わない
- SQL では `IS NULL` / `IS NOT NULL` のチェックを意図的に行う

### 7. SQL を小さく合成可能に保つ (Spaghetti Query)

- 大きな SQL は CTE やリポジトリメソッドの分割で対応する
- 1つのクエリは1つのリードモデル/ユースケースに集中する
- 過度に汎用化した「1つの SQL ですべて対応」より明快さを優先する

### 8. アプリケーションクエリで `SELECT *` を使わない (Implicit Columns)

常にカラムを明示する:

- 意図しないペイロード増加を防ぐ
- スキーマ変更時の破壊を防ぐ
- インデックスオンリースキャンとレビューが容易になる

### 9. `%keyword%` を長期的な検索戦略にしない (Poor Man's Search Engine)

- `%...%` はインデックスの使用を無効にすることが多い
- 全文検索が必要な場合は、DB の全文検索機能や外部検索エンジンを使用する
- 完全一致/前方一致検索の要件をユースケースで明示する

### 10. クロスリソースの書き込みを1つのトランザクション境界で制御する (Two-headed Monster / Phantom Files)

- DB 更新とファイル/オブジェクトストレージ更新をアトミックにする必要がある場合:
  - outbox/event パターン、または
  - 明示的なリトライセマンティクスを持つ補償アクションを使用する
- 「通常は順番に成功する」に頼らない

## PR レビューチェックリスト

スキーマ/クエリ関連の PR で使用するチェックリストです。

- [ ] カンマ区切りリストを1カラムに格納していないか？
- [ ] 関連が存在する箇所で PK/FK が欠落していないか？
- [ ] リポジトリやサービスのクエリで `SELECT *` を使っていないか？
- [ ] クエリ条件が既存のインデックスと整合しているか？
- [ ] ドメイン上の意味が不明確な nullable カラムを追加していないか？
- [ ] 検索戦略の判断なしに `%keyword%` 検索を追加していないか？
- [ ] 明示的な整合性設計なしにマルチリソース書き込みをしていないか？

## 参考リンク

- Speaker Deck: SQL アンチパターン第2版入門（2025-07-18 公開）
  https://speakerdeck.com/twada/intro-to-sql-antipatterns-2nd
- SQL Antipatterns (2nd edition), Bill Karwin
