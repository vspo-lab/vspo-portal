# 設定ファイル見直し: Config Cleanup & Simplification

## Context

設定ファイル(biome, knip, tsconfig, CI等)に重複・不整合・不要エントリが蓄積している。
base/extend パターンが正しく機能していない箇所や、存在しないパスへの参照、未使用の依存パッケージが残っている。
目的: シンプルに保ち、baseをextendする構造にし、不要なものを削除する。

---

## Phase 1 — Dead Noise 削除 (リスク: 最小)

不要なエントリを削除。ロジック変更なし。

### 1a. `knip.json` — stale entries 削除
- `"ignore": []` 削除 (空配列)
- `"ignoreWorkspaces": ["service/vspo-schedule/proxy/**"]` 削除 (`proxy/` は存在しない)

### 1b. `biome.base.json` / `biome.json` — `"overrides": []` 削除
- 両ファイルから空の `overrides` 配列を削除

### 1c. `package.json` (root) — 不要フィールド削除
- `"description": ""` 削除
- `"main": "index.js"` 削除
- `"pnpm": { "overrides": {} }` 削除

**検証**: `./scripts/post-edit-check.sh`

---

## Phase 2 — Biome Config 統合

現状の問題: `biome.json` が `biome.base.json` を extends しているが、`files` ブロックは merge されず完全に上書きされるため、base 側の excludes をすべて再記載している。さらに `vcs.useIgnoreFile: false` のため `.gitignore` が無視され、すべての除外パスを手動管理。

### 2a. `biome.base.json` → ルール専用に変更
- `files` ブロックを削除 (file filtering は `biome.json` に一元化)
- `vcs.useIgnoreFile: true` に変更 (.gitignore を自動活用)

```jsonc
// biome.base.json
{
  "$schema": "https://biomejs.dev/schemas/2.3.8/schema.json",
  "vcs": { "enabled": true, "clientKind": "git", "useIgnoreFile": true },
  "formatter": { "enabled": true, "formatWithErrors": true, "indentStyle": "space", "indentWidth": 2 },
  "assist": { "actions": { "source": { "organizeImports": "on" } } },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "style": { /* 現行ルールそのまま */ }
    }
  },
  "javascript": { "formatter": { "quoteStyle": "double" } }
}
```

### 2b. `biome.json` → file filtering を一元管理

`.gitignore` が自動カバー: `node_modules`, `.next`, `build`, `dist`, `coverage`, `.turbo`, `.wrangler`, `.open-next`, `.mastra`, `.pnpm-store`, `.nx`

手動除外が必要 (`.gitignore` に無い):
- `!**/*.config.js`, `!**/*.css`, `!**/tsconfig.json`
- `!**/public/**/*`
- `!**/gen/**/*` (`packages/api/src/gen/openapi.ts` 自動生成)
- `!**/service/vspo-schedule/v2/web/**/*.d.ts`
- `!**/service/vspo-schedule/v2/web/src/features/multiview/**/*`

削除 (対象ディレクトリ不在): `!**/tools/**/*`, `!**/meta/**/*`, `!**/.vscode/**/*`

```jsonc
// biome.json
{
  "$schema": "https://biomejs.dev/schemas/2.3.8/schema.json",
  "extends": ["./biome.base.json"],
  "files": {
    "includes": [
      "**/*.ts", "**/*.tsx", "**/*.js", "**/*.jsx", "**/*.json", "**/*.jsonc",
      "!**/*.config.js",
      "!**/*.css",
      "!**/public/**/*",
      "!**/tsconfig.json",
      "!**/gen/**/*",
      "!**/service/vspo-schedule/v2/web/**/*.d.ts",
      "!**/service/vspo-schedule/v2/web/src/features/multiview/**/*"
    ]
  }
}
```

### 2c. root `package.json` scripts — glob 修正
```diff
- "biome:check": "biome check ./**/**",
- "biome:format": "biome format --write ./**/**",
- "biome:lint": "biome lint --apply ./**/**",
+ "biome:check": "biome check .",
+ "biome:format": "biome format --write .",
+ "biome:lint": "biome lint --apply .",
```

**検証**: `./scripts/post-edit-check.sh` + biome が既存と同じファイルを対象とすることを確認

---

## Phase 3 — TypeScript 共通 Base 作成

現状: 4つの `packages/*/tsconfig.json` が完全同一のコピペ。

### 3a. `tsconfig.base.json` を root に新規作成

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "compilerOptions": {
    "target": "ESNext",
    "module": "CommonJS",
    "noEmit": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "strict": true,
    "exactOptionalPropertyTypes": true,
    "skipLibCheck": true
  }
}
```

削除: `outDir` (noEmit と矛盾), `strictNullChecks`/`strictFunctionTypes`/`strictBindCallApply`/`strictPropertyInitialization` (すべて `strict: true` に含まれる)

### 3b. 各 package tsconfig → extends

`packages/{api,dayjs,errors,logging}/tsconfig.json`:
```json
{ "extends": "../../tsconfig.base.json" }
```

web app は Next.js 固有設定のため変更なし。

**検証**: `pnpm tsc`

---

## Phase 4 — Knip パターン修正 + CI 修正

### 4a. `knip.json` — ワークスペースパターン修正

```json
{
  "workspaces": {
    "packages/*": {
      "entry": "index.ts",
      "project": "**/*.ts"
    },
    "service/vspo-schedule/v2/web": {
      "entry": [
        "src/pages/**/*.{ts,tsx}",
        "next.config.{js,mjs,ts}"
      ],
      "project": "**/*.{ts,tsx}"
    }
  },
  "ignoreBinaries": ["lint"]
}
```

### 4b. `pr-check.yaml` — dead job 削除 + knip/textlint 追加

- `service/server/**` を `on.paths` から削除
- `changes` job の `server` filter 削除
- `server-check` job 全体を削除
- `knip-check` job 追加:

```yaml
knip-check:
  runs-on: ubuntu-latest
  timeout-minutes: 10
  steps:
    - uses: actions/checkout@v6
    - name: Setup PNPM
      uses: ./.github/actions/setup-pnpm
    - name: Knip Check
      run: pnpm knip
```

- `textlint-check` job 追加:

```yaml
textlint-check:
  runs-on: ubuntu-latest
  timeout-minutes: 10
  steps:
    - uses: actions/checkout@v6
    - name: Setup PNPM
      uses: ./.github/actions/setup-pnpm
    - name: Textlint Check
      run: pnpm textlint
```

### 4c. `deploy-web-workers.yaml` — composite action 利用

```diff
-      - uses: pnpm/action-setup@v4
-        with:
-          version: 10.28.0
-          run_install: false
-      - name: Install dependencies
-        run: pnpm install
-      - name: Turbo Build(Package)
-        run: pnpm build
+      - name: Setup PNPM
+        uses: ./.github/actions/setup-pnpm
```

**検証**: `./scripts/post-edit-check.sh` + CI YAML 構文確認

---

## Phase 5 — 未使用依存パッケージ削除

### 5a. web app `package.json` — dependencies 削除

| パッケージ | 理由 |
|---|---|
| `gray-matter` | 独自 `parseFrontmatter()` で置換済み (`src/lib/markdown.ts`) |
| `react-resizable-panels` | import なし |
| `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities` | import なし |
| `@mui/lab` | import なし |
| `@emotion/server` | 直接 import なし (MUI peer dep は cache/react/styled で充足) |
| `@emotion/use-insertion-effect-with-fallbacks` | transitive dep |
| `@emotion/utils` | transitive dep |
| `dayjs` | `@vspo-lab/dayjs` 経由でのみ使用 |

### 5b. web app `package.json` — devDependencies 削除 + lint script 削除

| パッケージ | 理由 |
|---|---|
| `eslint` | eslint config なし、biome が唯一のリンター |
| `eslint-config-next` | 同上 |
| `@eslint/eslintrc` | 同上 |

`"lint": "next lint"` script も削除。

### 5c. root `package.json` — lefthook + @types/node 修正
- `"lefthook": "^1.13.6"` 削除 (aqua v2.1.1 と重複、メジャーバージョン不一致)
- `"@types/node": "^22.19.5"` → `"@types/node": "catalog:"` に変更

**検証**: `pnpm install` → `./scripts/post-edit-check.sh` → `pnpm dev:vspo-schedule-web` 起動確認

---

## Phase 6 — Security Scan 修正

### 6a. `scripts/security-scan.sh` — aqua 管理の trivy を優先利用

trivy が PATH にあれば aqua 管理版を使用、なければ Docker fallback:

```bash
# Trivy: prefer aqua-managed binary, fallback to Docker
if command -v trivy &>/dev/null; then
  trivy fs --severity CRITICAL,HIGH --exit-code 1 --ignorefile .trivyignore .
else
  docker run --rm -v "$(pwd)":/work -w /work aquasec/trivy:0.67.2 fs ...
fi
```

- Docker image タグを `latest` → `0.67.2` に固定 (aqua.yaml と一致)
- Docker image scan の `services/api/Dockerfile` パスは存在しないため、条件付きで存在チェックを追加

### 6b. `.gitignore` — `.trivyignore` の除外を解除

現在 `.gitignore` に `.trivyignore` が記載されておりコミットできない。
`.trivyignore` はプロジェクト共通の設定ファイルなのでコミット対象にする。

- `.gitignore` から `.trivyignore` 行を削除
- 空の `.trivyignore` ファイルを作成 (コメントのみ)

**検証**: `./scripts/security-scan.sh` をローカル実行

---

## 対象ファイル一覧

| ファイル | Phase |
|---|---|
| `biome.base.json` | 1b, 2a |
| `biome.json` | 1b, 2b |
| `knip.json` | 1a, 4a |
| `package.json` (root) | 1c, 2c, 5c |
| `tsconfig.base.json` (新規) | 3a |
| `packages/api/tsconfig.json` | 3b |
| `packages/dayjs/tsconfig.json` | 3b |
| `packages/errors/tsconfig.json` | 3b |
| `packages/logging/tsconfig.json` | 3b |
| `service/vspo-schedule/v2/web/package.json` | 5a, 5b |
| `.github/workflows/pr-check.yaml` | 4b |
| `.github/workflows/deploy-web-workers.yaml` | 4c |
| `scripts/security-scan.sh` | 6a |
| `.gitignore` | 6b |
| `.trivyignore` (新規) | 6b |

## 検証手順 (End-to-End)

1. 各 Phase 完了後に `./scripts/post-edit-check.sh` (biome:check + knip + tsc)
2. Phase 5 完了後に `pnpm install` で lockfile 更新
3. Phase 5 完了後に `pnpm dev:vspo-schedule-web` で dev server 起動確認
4. Phase 6 完了後に `./scripts/security-scan.sh` をローカル実行
5. 全 Phase 完了後に `pnpm build` でフルビルド確認
