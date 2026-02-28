# textlint 運用ガイド

## 目的

`textlint` は、ドキュメントの表記ゆれや読みにくい文章を機械的に検出するためのツールです。  
このテンプレートでは、`docs/` の可読性と保守性を保つために利用します。

## 運用方針

1. 文章品質は `textlint` と人手レビューの両方で担保する
2. `textlint` は「機械検出が得意な項目」に限定する
3. ドメイン固有の言い回しは、レビューで最終判断する

## チェック対象

- `docs/**/*.md`
- `README.md`

## ルール設計の考え方

最初から厳しすぎるルールを入れると修正コストが高くなります。  
以下の順で段階的に強化してください。

1. 表記ゆれ・誤字検知（導入初期）
2. 読みやすさ（一文の長さ、冗長表現）
3. プロジェクト固有辞書（用語統一）

## このプロジェクトの設定

依存パッケージ:

```json
"textlint": "^15.x",
"textlint-rule-preset-ja-technical-writing": "^12.x",
"@textlint/textlint-plugin-markdown": "^15.x"
```

設定ファイル:

- `.textlintrc.json`
- `.textlintignore`

`package.json` scripts:

```json
{
  "scripts": {
    "textlint": "textlint \"{README.md,docs/**/*.md}\"",
    "textlint:fix": "textlint --fix \"{README.md,docs/**/*.md}\""
  }
}
```

## 実行方法

```bash
pnpm textlint
pnpm textlint:fix
```

## 導入初期の運用

既存ドキュメントの一括修正を避けるため、初期設定では一部ルールを無効化しています。  
対象は `.textlintrc.json` に明記し、既存文書の整理が進んだら段階的に有効化します。

## PR チェックで見るポイント

1. 新規文章で同種の指摘が繰り返されていない
2. ルール無効化（`textlint-disable`）に理由が書かれている
3. 修正により文意が変わっていない
