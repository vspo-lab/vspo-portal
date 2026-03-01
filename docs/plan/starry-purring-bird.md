# biome:check / knip 残存エラー修正

## Context

前回の設定ファイル見直しで biome の `vcs.useIgnoreFile: true` 化・file filtering 一元化を行った結果、
以前チェック対象外だった `.claude/settings.json` と `renovate.json` が新たに biome のスコープに入り、
フォーマットエラー（2 errors）が発生。knip は改善されたが依然 unused dependency 等で非ゼロ exit する。

### 現状

**biome:check** — exit code 1
- `.claude/settings.json` format error (deny 配列の改行)
- `renovate.json` format error (末尾改行なし)
- 13 warnings + 4 infos は全て pre-existing のソースコード lint 警告

**knip** — exit code 1
- Unused dep: `axios-retry` (packages/api)
- Unlisted dep: `react-resizable/css/styles.css` (multiview), `cloudflare` (api.d.ts)
- 17 unused files, 45 unused exports, 2 duplicate exports — 全て pre-existing

## Plan

### 1. biome format エラー修正（2ファイル）

**`.claude/settings.json`** — `deny` 配列を 1 行に圧縮
```json
"deny": ["Read(.env*)", "Read(**/.env*)", "Read(*.pem)", "Read(*.key)"]
```

**`renovate.json`** — 末尾に改行を追加

### 2. knip: `axios-retry` 削除

`packages/api/package.json` から `axios-retry` を削除。

確認: `packages/api/src/` 内で `axios-retry` の import がないことを grep で検証済み（knip が検出）。
`pnpm install` で lockfile 更新。

### 3. knip: unlisted dependencies 対応

- `react-resizable/css/styles.css` → multiview feature は biome exclude 対象で、かつ knip の unused files にも出ている。multiview ディレクトリごと knip の ignore に追加。
- `cloudflare` → `service/vspo-schedule/v2/web/src/features/shared/types/api.d.ts` は biome exclude (`**/*.d.ts`)。この `.d.ts` ファイルも knip の ignore に追加。

`knip.json` の web workspace に `ignore` を追加:
```json
"service/vspo-schedule/v2/web": {
  "entry": ["src/pages/**/*.{ts,tsx}", "next.config.{js,mjs,ts}"],
  "project": "**/*.{ts,tsx}",
  "ignore": [
    "src/features/multiview/**",
    "src/features/shared/types/api.d.ts"
  ]
}
```

### 4. knip: unused files / exports は対応しない

45 unused exports と 17 unused files は全て pre-existing かつ主に multiview feature 由来。
multiview を ignore に追加することで大半が解消される見込み。残りの unused exports は
アプリケーションコードのリファクタリング範囲であり、今回のスコープ外。

## 対象ファイル

| ファイル | 変更内容 |
|---|---|
| `.claude/settings.json` | deny 配列フォーマット修正 |
| `renovate.json` | 末尾改行追加 |
| `packages/api/package.json` | `axios-retry` 削除 |
| `knip.json` | web workspace に ignore 追加 |
| `pnpm-lock.yaml` | lockfile 更新（pnpm install） |

## 検証

1. `pnpm biome:check` — errors: 0 を確認
2. `pnpm knip` — unused dep / unlisted dep が解消されていることを確認
3. `pnpm tsc` — 型チェック通過
