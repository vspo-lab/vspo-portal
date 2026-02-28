# VRT (Visual Regression Testing) 実装方針

## 目的

- UI の見た目退行を差分で検出する
- コンポーネント単位でデザイン変更の意図有無を判定できる状態にする

## 対象

- `services/web/vrt/storybook.spec.ts`
- Storybook ストーリー（デザインシステム、主要UI）

## 実装ルール

1. Storybook の 1 story を 1 VRT ケースとして扱う
2. Playwright の `toHaveScreenshot()` で差分比較する
3. Viewport・フォント・時刻・アニメーションを固定して非決定性を除去する
4. スナップショット更新は「仕様変更PR」でのみ実行する

## モック方針

- デフォルト: モックしない
- 例外: story が外部API依存を持つ場合だけ、MSW で固定レスポンスを返す
- 目的: レイアウト/配色/タイポグラフィの退行検知を安定させる

## 運用ルール

- Baseline 更新時は PR に「差分の意図」を記載する
- 変化が大きい場合は VRT だけでなく UI/E2E の影響も確認する

## 実行コマンド

- `pnpm --filter web vrt`
- 更新: `pnpm --filter web vrt:update`

## 参考（一次情報）

- Playwright Visual Comparisons: https://playwright.dev/docs/test-snapshots
- Storybook Visual Testing: https://storybook.js.org/docs/writing-tests/visual-testing
