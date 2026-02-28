# Feature Plan (Spec-Driven Development)

機能開発の仕様書をここに集約する。
仕様が Single Source of Truth であり、口頭での決定は無効とする。

## 原則: Spec更新 → 実装

1. 仕様変更が発生したら、まず `docs/plan/<feature>/` のドキュメントを更新する
2. ドキュメント更新後に、初めてコードを変更する
3. 口頭やチャットでの合意は仕様ではない。書かれたものだけが仕様である

## ディレクトリ構成

```
docs/plan/
├── README.md                    # 本ドキュメント
└── <feature-name>/              # 機能ごとのディレクトリ
    ├── 00_OVERVIEW.md           # 機能概要、目的、スコープ
    ├── 01_DOMAIN_MODEL.md       # エンティティ変更、ビジネスルール
    ├── 02_DATA_ACCESS.md        # リポジトリ・DB変更
    ├── 03_USECASE.md            # UseCase層の変更
    ├── 04_API_INTERFACE.md      # APIエンドポイント仕様
    ├── 05_FRONTEND.md           # フロントエンドUI仕様
    └── CHECKLIST.md             # 実装チェックリスト（フェーズ・セッションノート）
```

Claude Code の plan mode で自動生成されたファイル（`.md`）もこのディレクトリに保存される。
feature ディレクトリと自動生成ファイルは名前形式が異なるため衝突しない。

## ワークフロー

### Step 1: 仕様生成 (`/plan-feature`)

あいまいな要件から構造化された仕様ドキュメントを作成する。

- 要件をヒアリングし、上記のファイル構成で仕様を書き出す
- 仕様は Clean Architecture のレイヤーに対応（Domain → Data Access → UseCase → Interface）
- 未確定事項は `TBD` と明記し、次アクションを記録する

### Step 2: チェックリスト生成 (`/init-impl`)

仕様を読み込み、フェーズ分けされた実装チェックリストを生成する。

- 実装順序はボトムアップ: Domain → Data Access → UseCase → API → Frontend
- 各フェーズに目標、チェックリスト、テストコマンド、セッションノートを含む
- セッションノートには Done / Next / Risks・TODO を記録する

### Step 3: フェーズ実行

チェックリストに従い、フェーズごとに実装を進める。

- 各フェーズの開始時にセッションノートを初期化する
- 完了したタスクにチェックを付ける
- 仕様変更が必要な場合は、まず仕様ドキュメントを更新してからコードを変更する

## 仕様ファイル概要

| ファイル | 内容 | 対応レイヤー |
| --- | --- | --- |
| `00_OVERVIEW.md` | 機能の目的、背景、スコープ、成功指標 | - |
| `01_DOMAIN_MODEL.md` | 新規・変更エンティティ、ビジネスルール、Zod Schema | Domain |
| `02_DATA_ACCESS.md` | テーブル変更、リポジトリ変更、マイグレーション | Infrastructure |
| `03_USECASE.md` | ユースケース定義、入出力、エラーケース | UseCase |
| `04_API_INTERFACE.md` | エンドポイント、リクエスト/レスポンス、認証 | Infrastructure (HTTP) |
| `05_FRONTEND.md` | ページ構成、コンポーネント、状態管理 | Frontend |
| `CHECKLIST.md` | フェーズ分け実装チェックリスト、セッションノート | - |

## チェックリスト構造

`CHECKLIST.md` は以下の構造で作成する。各フェーズに Goal / Checklist / Testing / Session Notes を含む。

```markdown
# Implementation Checklist: <feature-name>

Spec: `docs/plan/<feature>/`

## Phase 1: Domain Model
Document: `01_DOMAIN_MODEL.md`
Status: Not started

### Goal
ドメインモデルの実装とユニットテスト

### Checklist
- [ ] Zod Schema 定義
- [ ] コンパニオンオブジェクト実装
- [ ] ドメインモデルのユニットテスト

### Testing
pnpm test -- services/api/domain/

### Session Notes
- Done:
- Next:
- Risks/TODO:

---

## Phase 2: Data Access
Document: `02_DATA_ACCESS.md`
Status: Not started

### Goal
リポジトリ実装とインテグレーションテスト

### Checklist
- [ ] DB スキーマ定義（drizzle）
- [ ] マイグレーション作成・実行
- [ ] リポジトリ実装
- [ ] インテグレーションテスト

### Testing
pnpm test -- services/api/infra/repository/

### Session Notes
- Done:
- Next:
- Risks/TODO:

---

## Phase 3: UseCase
Document: `03_USECASE.md`
Status: Not started

### Goal
ユースケース実装とテスト

### Checklist
- [ ] ユースケース実装
- [ ] DI コンテナへの登録
- [ ] ユースケーステスト

### Testing
pnpm test -- services/api/usecase/

### Session Notes
- Done:
- Next:
- Risks/TODO:

---

## Phase 4: API Interface
Document: `04_API_INTERFACE.md`
Status: Not started

### Goal
API エンドポイント実装と API テスト

### Checklist
- [ ] Hono ルート定義（OpenAPI）
- [ ] リクエスト/レスポンス Zod Schema
- [ ] API テスト

### Testing
pnpm test -- services/api/infra/http/

### Session Notes
- Done:
- Next:
- Risks/TODO:

---

## Phase 5: Frontend
Document: `05_FRONTEND.md`
Status: Not started

### Goal
フロントエンド実装と UI テスト

### Checklist
- [ ] App Router ルート作成
- [ ] Feature モジュール作成（api/, components/, hooks/, types/）
- [ ] Container コンポーネント
- [ ] Presenter コンポーネント
- [ ] UI テスト

### Testing
pnpm test -- services/web/

### Session Notes
- Done:
- Next:
- Risks/TODO:
```

仕様に記載のない層のフェーズは省略してよい（例: バックエンドのみの機能なら Phase 5 を省略）。

## セッションノートの書き方

各フェーズの Session Notes には以下の3項目を必ず記録する。

```markdown
### Session Notes
YYYY-MM-DD
- Done: 完了したこと
- Next: 次にやること
- Risks/TODO: 未解決課題
```

日をまたぐ場合やセッション復帰時に、この3項目で文脈を復元する。

## Claude Code 連携

- `.claude/settings.json` の `plansDirectory` を `"./docs/plan"` に設定済み
- Claude Code のプランモードで作成されたファイルも `docs/plan/` に保存される
- プランファイルはバージョン管理対象とする

## 参照

- `/plan-feature` - 仕様生成スキル
- `/init-impl` - チェックリスト生成スキル
- `docs/domain/` - プロジェクト全体のドメイン仕様
- `docs/backend/server-architecture.md` - Clean Architecture 概要
- `docs/web-frontend/architecture.md` - フロントエンドアーキテクチャ
