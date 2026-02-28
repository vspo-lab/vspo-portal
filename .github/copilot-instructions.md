# vspo-portal (Next.js 15 + Cloudflare Workers)

## 行動の指針

- エラーハンドリング: `Result` 型を使う (`import { wrap, Ok, Err, AppError } from "@vspo-lab/error"`)。try-catch 禁止。
- 型定義: Zod Schema First (`z.infer<typeof schema>`)。明示的な interface 禁止。
- シンプルさ: 不要なコード削除、3回以上の重複時のみ抽象化、早すぎる最適化禁止。
- 関数ドキュメント: 公開関数に JSDoc で事前条件・事後条件・冪等性を記述する。
- コード変更後は `./scripts/post-edit-check.sh` を実行すること。

## Copilot レビュー出力ルール

- すべての指摘で「どこの何に違反しているか」を明示すること。
- 指摘は必ず次の形式で出力すること:
  - `違反箇所`: `path/to/file:line`（PR差分上の場所）
  - `違反ルール`: `ルールの所在ファイル` + `見出し/項目名`
  - `違反内容`: 何がルールに反しているかを1文で具体化
  - `修正案`: 最小変更での修正方針
- `違反ルール` には、次のいずれかの一次情報のみを使うこと:
  - `.github/copilot-instructions.md`
  - `AGENTS.md`
  - `docs/` 配下の該当ドキュメント
- ルール出典を示せない場合は「改善提案」として分離し、違反指摘として断定しないこと。

## 参照ドキュメント

- `docs/domain/` - ドメイン仕様（概要、エンティティ、ユースケース、用語集）
- `docs/web-frontend/` - フロントエンド（アーキテクチャ、hooks、CSS、a11y、テスト、エラーハンドリング、TypeScript）
- `docs/backend/` - バックエンド（サーバーアーキテクチャ、ドメインモデル、API設計、関数ドキュメント規約、PRガイドライン、日時処理）
- `docs/design/` - デザインシステム（トークン、カラー、タイポグラフィ、UIパターン）
- `docs/infra/` - インフラ（Terraform、CI/CD）
- `docs/security/` - セキュリティ
- `.agent/skills/` - AI エージェント用スキル定義
