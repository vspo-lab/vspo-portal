---
name: vrt-testing
description: Storybook + Playwright の VRT を実装し、スナップショット差分でUI退行を検知するときに使う。非決定要素を固定しモック最小で運用する。
---

# トリガー条件

- UIの見た目退行を検証したいとき
- Storybook ストーリーのVRTを追加・更新するとき

# 実行チェックリスト

1. `docs/testing/vrt-testing.md` を確認する
2. story単位で VRT ケースを追加する
3. 時刻/アニメーション/viewport を固定する
4. スナップショット更新は意図説明付きで行う

# 参照ドキュメント

- `docs/testing/vrt-testing.md`
- `docs/design/design-review.md`
