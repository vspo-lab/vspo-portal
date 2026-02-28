# アイコンガイドライン

## 概要

アイコンは、UIの視認性と操作性を高める重要な視覚要素です。本ガイドラインでは、Lucide Reactを基本とし、必要に応じてオリジナルアイコンを作成する方針を定めます。

## 基本方針

アイコンは、基本的に **Lucide React** から選定します。適したアイコンがない場合は、トンマナを合わせてオリジナルで作成します。

### Lucide React の使用

| 項目 | 推奨事項 |
|------|----------|
| パッケージ | lucide-react |
| スタイル | アウトライン（デフォルト）を基本とする |
| サイズ | 用途に応じて16px〜24pxを基本とする |
| カラー | セマンティックカラーに従う |

```tsx
// Lucide React の使用例
import { Search, User, Menu } from "lucide-react";

<Search className="w-4 h-4 text-text-secondary" />
<User className="w-5 h-5 text-text-primary" />
```

### NavIconコンポーネントの使用

プロジェクトでは、`NavIcon`コンポーネントを通じてアイコンを使用します。これにより、アイコン名の一貫性を保ちつつ、Lucide Reactのアイコンを利用できます。

```tsx
import { NavIcon } from "@/shared/components/presenters/NavIcon";

// ナビゲーション用
<NavIcon name="home" className="w-5 h-5" />
<NavIcon name="settings" className="w-5 h-5 text-muted-foreground" />
```

#### 利用可能なアイコン名

| 名前 | 説明 | Lucideアイコン |
|------|------|---------------|
| home | ホーム | Home |
| play | 再生 | Play |
| clock | 時計 | Clock |
| credit-card | クレジットカード | CreditCard |
| settings | 設定 | Settings |
| file-text | ファイル | FileText |
| sparkles | スパークル | Sparkles |
| pencil | ペンシル | Pencil |
| target | ターゲット | Target |
| chart-bar | 棒グラフ | BarChart3 |

## オリジナルアイコン作成ルール

Lucide Reactに適切なアイコンがない場合は、以下のルールに従ってオリジナルアイコンを作成します。

### アートボードとサイズ

| 項目 | 値 |
|------|-----|
| アートボードサイズ | 128 x 128 px |
| 余白（上下左右） | 各 8px |
| 実作成エリア | 112 x 112 px |

```
+---------------------+
|        8px          |
|   +-----------+     |
|8px|  112x112  |8px  |
|   |   作成    |     |
|   |   エリア  |     |
|   +-----------+     |
|        8px          |
+---------------------+
     128x128px
```

### 線と角丸

| 項目 | 基本値 | 備考 |
|------|--------|------|
| 線の太さ | 10px | 調整可能 |
| 角丸（基本） | 半径 8px | - |
| 角丸（小） | 半径 4px | 基本と組み合わせ可 |

### Solidスタイル作成時

Solidスタイルを作成する場合、隣接する色の間隔は **6px** を推奨します。

## スタイルバリエーション

Lucide Reactの仕様に合わせて、アウトラインスタイルを基本とします。

### Outline（デフォルト）

- 線のみで構成されたアイコン
- 通常状態での使用を推奨
- strokeWidth: 2（デフォルト）

### カスタマイズ

```tsx
// 線の太さを変更
<Search strokeWidth={1.5} className="w-5 h-5" />

// 色を変更
<User className="w-5 h-5 text-primary" />
```

## 作成ワークフロー

1. **Lucide Reactで検索**: まずLucide Reactで適切なアイコンを探す
2. **マスターデータの複製**: オリジナル作成時は、作業開始前に必ずマスターデータを複製する
3. **Keylineへの整列**: 視覚的統一のため、Keylineに合わせてデザインする
4. **レビュー依頼**: 完成後、デザインチームにレビューを依頼する

## アイコンの使用パターン

### ナビゲーション

```tsx
// ヘッダーナビゲーション
import { NavIcon } from "@/shared/components/presenters/NavIcon";

<nav className="flex items-center gap-4">
  <NavIcon name="home" className="w-5 h-5" />
  <NavIcon name="clock" className="w-5 h-5" />
  <NavIcon name="settings" className="w-5 h-5" />
</nav>
```

### ボタン

```tsx
// アイコン付きボタン
import { Plus } from "lucide-react";

<button className="flex items-center gap-2">
  <Plus className="w-4 h-4" />
  <span>追加する</span>
</button>
```

### ステータス表示

```tsx
// ステータスアイコン
import { CheckCircle } from "lucide-react";

<span className="flex items-center gap-1">
  <CheckCircle className="w-4 h-4 text-success" />
  <span>完了</span>
</span>
```

## サイズガイド

| 用途 | サイズ | クラス |
|------|--------|--------|
| インラインテキスト | 14px | `w-3.5 h-3.5` |
| 小ボタン・バッジ | 16px | `w-4 h-4` |
| 標準ボタン | 18px | `w-4.5 h-4.5` |
| ナビゲーション | 20px | `w-5 h-5` |
| 大見出し・ヒーロー | 24px | `w-6 h-6` |

## 禁止事項

- Lucide Reactのアイコンを変形・加工すること
- オリジナルアイコンでLucide Reactと著しく異なるスタイルにすること
- アイコンのみで情報を伝えること（テキストラベルを併用する）
- 装飾目的での過剰なアイコン使用

## 参考リンク

- [Lucide Icons](https://lucide.dev/icons/)
- [Lucide React ドキュメント](https://lucide.dev/guide/packages/lucide-react)
- [アクセシビリティガイドライン](./accessibility.md)
