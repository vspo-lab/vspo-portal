# vspo-portal (Next.js 15 + Cloudflare Workers)

## 行動の指針

- エラーハンドリング: `Result` 型を使う (`import { wrap, Ok, Err, AppError } from "@vspo-lab/error"`)。try-catch 禁止。
- 型定義: Zod Schema First (`z.infer<typeof schema>`)。明示的な interface 禁止。
- シンプルさ: 不要なコード削除、3回以上の重複時のみ抽象化、早すぎる最適化禁止。
- 関数ドキュメント: 公開関数に JSDoc で事前条件・事後条件・冪等性を記述する。
- コード変更後は `./scripts/post-edit-check.sh` を実行すること。

## 参照

- 詳細な技術ドキュメント: `docs/`
- AI エージェント用スキル: `.agent/skills/`

## Spec-Driven Development

- 機能開発は「仕様策定 → チェックリスト生成 → フェーズ実装」の順で進める。
- 仕様ドキュメントは `docs/plan/<feature>/` に配置する。
- **Spec更新 → 実装**: 仕様変更が発生したら、まず `docs/plan/` を更新してからコードを変更する。口頭の合意は仕様ではない。
- スキル: `/plan-feature`（仕様策定）、`/init-impl`（チェックリスト生成）。

## Claude Code 運用

- 許可ポリシーと hooks は `.claude/settings.json` で管理する。
- カスタム `/` は `.claude/skills/`（実体: `.agent/skills/`）に skill として置く。
- `PreToolUse` hook で危険な Bash 操作（`git push`, `git add -A`, `git reset --hard`）をブロックする。
- コード編集時は hook が `.claude/.post_edit_check_pending` を立て、応答終了時に `./scripts/post-edit-check.sh` を実行する。
