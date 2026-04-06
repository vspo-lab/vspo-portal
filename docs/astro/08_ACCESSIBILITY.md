# アクセシビリティ改善

## 現状の評価

### 良い点
- `skip-to-content` リンクが Base.astro にある
- semantic HTML (`<main>`, `<nav>`, `<header>`, `<footer>`) を使用
- `FlashMessage` に `role="status"` あり

### 主要な課題
1. **keyboard navigation** — dialog, dropdown, menu で不十分
2. **focus management** — dialog open/close 時の focus 制御なし
3. **ARIA attributes** — ほとんどのインタラクティブ要素で不足
4. **color contrast** — ステータスインジケータが色のみに依存
5. **motion** — `prefers-reduced-motion` 未対応のアニメーション

## コンポーネント別改善

### Dialog (ChannelConfigForm, ChannelAddModal, DeleteChannelDialog)

```tsx
// useDialog.ts — アクセシブルな dialog hook
function useDialog(ref: RefObject<HTMLDialogElement>) {
  const open = useCallback(() => {
    ref.current?.showModal();
    // 最初のフォーカス可能要素にフォーカス
    const firstFocusable = ref.current?.querySelector<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    firstFocusable?.focus();
  }, [ref]);

  const close = useCallback(() => {
    ref.current?.close();
    // トリガー要素にフォーカスを戻す
  }, [ref]);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;

    // backdrop click で close
    const handleClick = (e: MouseEvent) => {
      if (e.target === dialog) close();
    };

    // focus trap
    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const focusable = dialog.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    };

    dialog.addEventListener("click", handleClick);
    dialog.addEventListener("keydown", handleKeydown);
    return () => {
      dialog.removeEventListener("click", handleClick);
      dialog.removeEventListener("keydown", handleKeydown);
    };
  }, [ref, close]);

  return { open, close };
}
```

**dialog の ARIA 属性**:
```html
<dialog
  aria-labelledby="dialog-title"
  aria-describedby="dialog-description"
  aria-modal="true"
>
  <h2 id="dialog-title">Edit Channel</h2>
  <p id="dialog-description">Configure notification settings for this channel.</p>
</dialog>
```

### Dropdown / Menu (UserMenu, LanguageSelector)

現在の `<details data-auto-close>` は WAI-ARIA menu pattern に準拠していない。

```tsx
// WAI-ARIA menu button pattern
function DropdownMenu({ trigger, items }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const menuRef = useRef<HTMLUListElement>(null);

  const handleKeydown = (e: KeyboardEvent) => {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActiveIndex(i => Math.min(i + 1, items.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setActiveIndex(i => Math.max(i - 1, 0));
        break;
      case "Escape":
        setIsOpen(false);
        break;
      case "Home":
        setActiveIndex(0);
        break;
      case "End":
        setActiveIndex(items.length - 1);
        break;
    }
  };

  return (
    <div>
      <button
        aria-haspopup="menu"
        aria-expanded={isOpen}
        onClick={() => setIsOpen(!isOpen)}
      >
        {trigger}
      </button>
      {isOpen && (
        <ul
          ref={menuRef}
          role="menu"
          aria-orientation="vertical"
          onKeyDown={handleKeydown}
        >
          {items.map((item, i) => (
            <li
              key={item.id}
              role="menuitem"
              tabIndex={i === activeIndex ? 0 : -1}
              aria-current={i === activeIndex ? "true" : undefined}
            >
              {item.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

### Radio Group (ChannelConfigForm の MemberType)

```tsx
// WAI-ARIA radio group pattern
function MemberTypeRadioGroup({ value, onChange, options }) {
  return (
    <div role="radiogroup" aria-labelledby="member-type-label">
      <span id="member-type-label">Member Type</span>
      {options.map(option => (
        <label key={option.value}>
          <input
            type="radio"
            name="memberType"
            value={option.value}
            checked={value === option.value}
            onChange={() => onChange(option.value)}
            aria-describedby={`member-type-desc-${option.value}`}
          />
          <span>{option.label}</span>
          <span id={`member-type-desc-${option.value}`} className="sr-only">
            {option.description}
          </span>
        </label>
      ))}
    </div>
  );
}
```

### Multi-select Combobox (Custom Member Picker)

```tsx
// WAI-ARIA combobox + listbox pattern
function CustomMemberPicker({ members, selected, onChange }) {
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  return (
    <div>
      {/* Selected chips */}
      <div role="list" aria-label="Selected members">
        {selected.map(member => (
          <span key={member.id} role="listitem">
            {member.name}
            <button
              aria-label={`Remove ${member.name}`}
              onClick={() => onChange(selected.filter(m => m.id !== member.id))}
            >
              ×
            </button>
          </span>
        ))}
      </div>

      {/* Search input */}
      <input
        role="combobox"
        aria-expanded={isOpen}
        aria-controls="member-listbox"
        aria-activedescendant={activeIndex >= 0 ? `member-${activeIndex}` : undefined}
        aria-autocomplete="list"
        aria-label="Search members"
        value={search}
        onChange={e => setSearch(e.target.value)}
      />

      {/* Options listbox */}
      {isOpen && (
        <ul id="member-listbox" role="listbox" aria-multiselectable="true">
          {filteredMembers.map((member, i) => (
            <li
              key={member.id}
              id={`member-${i}`}
              role="option"
              aria-selected={selected.some(s => s.id === member.id)}
            >
              {member.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

### テーブル (ChannelTable)

```html
<table aria-label="Channel configurations">
  <thead>
    <tr>
      <th scope="col">Channel</th>
      <th scope="col">Language</th>
      <th scope="col">Member Type</th>
      <th scope="col">Status</th>
      <th scope="col"><span class="sr-only">Actions</span></th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><!-- channel name --></td>
      <td><!-- language --></td>
      <td><!-- member type --></td>
      <td>
        <!-- ステータスは色だけでなくテキストも表示 -->
        <span aria-label="Active">
          <span class="status-dot bg-green-500" aria-hidden="true" />
          Active
        </span>
      </td>
      <td>
        <button aria-label="Edit general channel settings">Edit</button>
        <button aria-label="Delete general channel">Delete</button>
      </td>
    </tr>
  </tbody>
</table>
```

## グローバル改善

### 1. `prefers-reduced-motion`

```css
@media (prefers-reduced-motion: reduce) {
  /* ScrollReveal */
  .scroll-reveal {
    animation: none !important;
    opacity: 1 !important;
  }

  /* DigitRoll */
  .digit-roll {
    animation: none !important;
    transform: none !important;
  }

  /* View Transitions */
  ::view-transition-group(*),
  ::view-transition-old(*),
  ::view-transition-new(*) {
    animation: none !important;
  }

  /* Flash message */
  .flash-message {
    animation: none !important;
  }
}
```

### 2. `prefers-color-scheme`

theme.ts (将来の Nano Store) で system preference を検出:

```typescript
// 初期テーマ判定
const prefersDark = window.matchMedia("(prefers-color-scheme: dark)");
const storedTheme = localStorage.getItem("theme");
const initialTheme = storedTheme ?? (prefersDark.matches ? "dark" : "light");
```

### 3. Focus Visible

```css
/* keyboard focus のみリングを表示 */
:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

/* mouse click ではリングを表示しない */
:focus:not(:focus-visible) {
  outline: none;
}
```

### 4. Screen Reader Only ユーティリティ

```css
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
```

Tailwind CSS v4 では `sr-only` クラスがビルトイン。

### 5. Live Regions

```html
<!-- 操作結果の通知 -->
<div aria-live="polite" aria-atomic="true" class="sr-only" id="status-announcer">
  <!-- JS で動的にテキストを設定 -->
</div>
```

React island 内:
```tsx
function StatusAnnouncer() {
  const flash = useStore($flash);
  return (
    <div aria-live="polite" aria-atomic="true" className="sr-only">
      {flash?.message}
    </div>
  );
}
```

## テスト

### axe-core による自動テスト

```typescript
// vitest + @axe-core/react
import { render } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";

expect.extend(toHaveNoViolations);

test("ChannelConfigModal has no a11y violations", async () => {
  const { container } = render(<ChannelConfigModal {...props} />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

### keyboard navigation テスト

```typescript
import { screen, fireEvent } from "@testing-library/react";

test("dialog traps focus", () => {
  render(<ChannelConfigModal open />);
  const firstButton = screen.getByRole("button", { name: "Save" });
  const lastButton = screen.getByRole("button", { name: "Cancel" });

  lastButton.focus();
  fireEvent.keyDown(lastButton, { key: "Tab" });
  expect(document.activeElement).toBe(firstButton);
});
```

## WCAG 2.1 AA チェックリスト

- [ ] **1.1.1** 非テキストコンテンツに代替テキスト
- [ ] **1.3.1** 情報と関係性が構造で伝わる (semantic HTML)
- [ ] **1.4.1** 色だけに依存しない (ステータスインジケータ)
- [ ] **1.4.3** コントラスト比 4.5:1 以上
- [ ] **1.4.11** 非テキストのコントラスト比 3:1 以上
- [ ] **2.1.1** すべての機能がキーボードで操作可能
- [ ] **2.1.2** キーボードトラップなし
- [ ] **2.4.1** ブロックスキップメカニズム (skip-to-content)
- [ ] **2.4.3** フォーカス順序が論理的
- [ ] **2.4.7** フォーカスが視覚的に見える
- [ ] **3.2.1** フォーカス時に予期しない変更なし
- [ ] **4.1.2** すべてのUI要素に name, role, value
- [ ] **4.1.3** ステータスメッセージがプログラムで判断可能
