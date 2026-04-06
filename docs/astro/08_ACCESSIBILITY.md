# Accessibility Improvements

## Current Assessment

### Strengths

- `skip-to-content` link exists in Base.astro
- Uses semantic HTML (`<main>`, `<nav>`, `<header>`, `<footer>`)
- `FlashMessage` has `role="status"`

### Key Issues

1. **keyboard navigation** — Insufficient for dialog, dropdown, and menu
2. **focus management** — No focus control on dialog open/close
3. **ARIA attributes** — Missing on most interactive elements
4. **color contrast** — Status indicators rely on color alone
5. **motion** — Animations not respecting `prefers-reduced-motion`

## Per-Component Improvements

### Dialog (ChannelConfigForm, ChannelAddModal, DeleteChannelDialog)

```tsx
// useDialog.ts — Accessible dialog hook
function useDialog(ref: RefObject<HTMLDialogElement>) {
  const open = useCallback(() => {
    ref.current?.showModal();
    // Focus the first focusable element
    const firstFocusable = ref.current?.querySelector<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    firstFocusable?.focus();
  }, [ref]);

  const close = useCallback(() => {
    ref.current?.close();
    // Return focus to the trigger element
  }, [ref]);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;

    // Close on backdrop click
    const handleClick = (e: MouseEvent) => {
      if (e.target === dialog) close();
    };

    // Focus trap
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

**Dialog ARIA attributes**:

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

The current `<details data-auto-close>` does not conform to the WAI-ARIA menu pattern.

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

### Radio Group (ChannelConfigForm MemberType)

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

### Table (ChannelTable)

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
        <!-- Status shows text in addition to color -->
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

## Global Improvements

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

Detect system preference in theme.ts (future Nano Store):

```typescript
// Initial theme determination
const prefersDark = window.matchMedia("(prefers-color-scheme: dark)");
const storedTheme = localStorage.getItem("theme");
const initialTheme = storedTheme ?? (prefersDark.matches ? "dark" : "light");
```

### 3. Focus Visible

```css
/* Show ring only for keyboard focus */
:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

/* Do not show ring for mouse clicks */
:focus:not(:focus-visible) {
  outline: none;
}
```

### 4. Screen Reader Only Utility

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

In Tailwind CSS v4, the `sr-only` class is built-in.

### 5. Live Regions

```html
<!-- Notification of operation results -->
<div aria-live="polite" aria-atomic="true" class="sr-only" id="status-announcer">
  <!-- Text set dynamically via JS -->
</div>
```

Inside React islands:

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

## Testing

### Automated Testing with axe-core

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

### Keyboard Navigation Testing

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

## WCAG 2.1 AA Checklist

- [ ] **1.1.1** Alternative text for non-text content
- [ ] **1.3.1** Information and relationships conveyed through structure (semantic HTML)
- [ ] **1.4.1** Not relying on color alone (status indicators)
- [ ] **1.4.3** Contrast ratio of 4.5:1 or higher
- [ ] **1.4.11** Non-text contrast ratio of 3:1 or higher
- [ ] **2.1.1** All functionality operable via keyboard
- [ ] **2.1.2** No keyboard traps
- [ ] **2.4.1** Block skip mechanism (skip-to-content)
- [ ] **2.4.3** Logical focus order
- [ ] **2.4.7** Focus is visually apparent
- [ ] **3.2.1** No unexpected changes on focus
- [ ] **4.1.2** All UI elements have name, role, and value
- [ ] **4.1.3** Status messages are programmatically determinable
