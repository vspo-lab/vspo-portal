# Accessibility Implementation Guide

This document provides implementation guidance for building accessible components. It targets **WCAG 2.2 Level AA** compliance.

For the design-level checklist of what to verify, see [Accessibility Design Checklist](../design/accessibility.md).

For the full specification, see [W3C WCAG 2.2](https://www.w3.org/TR/WCAG22/).

## Table of Contents

1. [Accessibility Foundation](#accessibility-foundation)
2. [Current State Analysis](#current-state-analysis)
3. [Implementation Guidelines](#implementation-guidelines)
4. [Component-Specific Requirements](#component-specific-requirements)
5. [Testing Methods](#testing-methods)

---

## Accessibility Foundation

This project relies on **MUI (Material UI) components** for its accessibility foundation. MUI components provide built-in ARIA attributes, keyboard interaction, and focus management out of the box.

### MUI Built-in Accessibility

MUI components used in this project include accessibility features by default:

- **`Button`**: Keyboard-focusable, `Enter`/`Space` activation, focus-visible styles
- **`Tabs`**: Arrow key navigation, `role="tablist"` / `role="tab"`, `aria-selected`
- **`Dialog` / `Modal`**: Focus trapping, `Escape` to close, `role="dialog"`, `aria-modal`
- **`TextField`**: Label association via `InputLabel`, `aria-describedby` for helper/error text
- **`Select`**: Keyboard navigation, `role="combobox"`, `aria-expanded`
- **`IconButton`**: Supports `aria-label` for icon-only buttons
- **`Tooltip`**: `aria-describedby` linking, keyboard-accessible

### Styling with `sx` Prop

MUI's `sx` prop and Emotion `styled()` are used for all component styling, including accessibility-related styles (focus rings, contrast adjustments). See [Styling Guide](./styling.md) for details.

---

## Current State Analysis

### Implemented Features

| Feature | Status | Notes |
|---------|--------|-------|
| `htmlFor`/`id` pairs | ✅ Good | Form element associations |
| `focus-visible` styles | ✅ Partial | Implemented on Button, Input, Select |
| `disabled` attribute support | ✅ Good | Visual feedback present |
| `aria-label` | ⚠️ Limited | Only on some elements |
| `lang="ja"` | ✅ Good | Set in root layout |

### Features Needing Improvement

| Feature | Priority | Target |
|---------|----------|--------|
| Modal accessibility | 🔴 High | Focus trap, role, ESC key |
| Color contrast | 🔴 High | Improve coral color |
| `aria-describedby` | 🟡 Medium | Error message association |
| `aria-required` | 🟡 Medium | Required field indication |
| Skip links | 🟡 Medium | Jump to main content |
| Keyboard navigation | 🟡 Medium | Focus on navigation elements |

---

## Implementation Guidelines

### 1. Semantic HTML

Use appropriate HTML elements and avoid re-implementing with custom elements.

```tsx
// Good: Semantic HTML
<button onClick={handleClick}>Submit</button>
<nav aria-label="Main navigation">
  <ul>
    <li><a href="/home">Home</a></li>
  </ul>
</nav>

// Bad: Substituting with div/span
<div onClick={handleClick} role="button">Submit</div>
```

### 2. Form Accessibility

#### Label Association

```tsx
// Explicit label (recommended)
<label htmlFor="email">Email address</label>
<Input id="email" type="email" aria-describedby="email-error" />
{error && <p id="email-error" role="alert">{error}</p>}
```

#### Required Fields

```tsx
<label htmlFor="name">
  Name <span aria-hidden="true">*</span>
</label>
<Input
  id="name"
  aria-required="true"
  aria-invalid={!!error}
  aria-describedby={error ? "name-error" : undefined}
/>
```

#### Fieldset/Legend

Group related form elements.

```tsx
<fieldset>
  <legend>Job search type</legend>
  <label>
    <input type="radio" name="userType" value="individual" />
    Individual
  </label>
  <label>
    <input type="radio" name="userType" value="business" />
    Business
  </label>
</fieldset>
```

### 3. Modal/Dialog

MUI's `<Dialog>` / `<Modal>` components handle focus trapping, ESC dismissal, and focus restoration automatically.

When building a custom modal without MUI, ensure:

- `role="dialog"` and `aria-modal="true"` are set
- Title is associated via `aria-labelledby`
- Focus is trapped inside the dialog
- `Escape` key closes the dialog
- Focus returns to the trigger element on close

### 4. Focus Management

#### Focus Ring Styles

```css
/* globals.css */
:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}

/* Prevent focus from being hidden behind sticky elements */
html {
  scroll-padding-top: 80px; /* Header height + margin */
}

*:focus {
  scroll-margin-top: 100px;
}
```

#### Skip Links

```tsx
// pages/_app.tsx (Pages Router)
import type { AppProps } from "next/app";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <a
        href="#main-content"
        style={{
          position: "absolute",
          left: "-9999px",
          zIndex: 50,
        }}
        onFocus={(e) => {
          e.currentTarget.style.left = "0";
        }}
        onBlur={(e) => {
          e.currentTarget.style.left = "-9999px";
        }}
      >
        Skip to main content
      </a>
      <Header />
      <main id="main-content" tabIndex={-1}>
        <Component {...pageProps} />
      </main>
    </>
  );
}
```

### 5. Color Contrast

#### Contrast Ratio Requirements

| Usage | Minimum Ratio (AA) | Minimum Ratio (AAA) |
|-------|--------------------|--------------------|
| Normal text | 4.5:1 | 7:1 |
| Large text (18px+) | 3:1 | 4.5:1 |
| UI elements/graphics | 3:1 | - |

#### Color Definition Improvements

```css
/* globals.css - Improving error/warning colors */
:root {
  /* Current: coral (oklch 0.90) - Insufficient contrast */
  /* Improved: Darker red */
  --color-error: oklch(0.55 0.20 25);     /* Approximately #D32F2F */
  --color-error-text: oklch(0.45 0.18 25); /* Darker red */

  /* Success color */
  --color-success: oklch(0.50 0.15 145);   /* Approximately #388E3C */

  /* Warning color */
  --color-warning: oklch(0.55 0.15 85);    /* Approximately #F57C00 */
}
```

#### Design That Does Not Rely on Color Alone

Use visual cues other than color alongside state changes.

```tsx
// Good: Color + icon + text
<Box sx={{ display: "flex", alignItems: "center", gap: 1, color: "error.main" }}>
  <AlertCircleIcon aria-hidden="true" />
  <Typography variant="body2" color="error">Error: Please check your input</Typography>
</Box>

// Bad: Color only
<Typography color="error">Please check your input</Typography>
```

### 6. Target Size

Touch targets must be at least 24x24px (recommended 44x44px).

```tsx
// Button component
const buttonVariants = cva(
  "inline-flex items-center justify-center min-h-[44px] min-w-[44px] px-4 py-2",
  // ...
);

// Icon button
<button
  aria-label="Open settings"
  className="flex h-11 w-11 items-center justify-center rounded-full"
>
  <SettingsIcon className="h-5 w-5" />
</button>
```

### 7. Dynamic Content

#### Live Regions

```tsx
// Operation result notification
<div aria-live="polite" aria-atomic="true" className="sr-only">
  {statusMessage}
</div>

// Error message (notify immediately)
<div role="alert" aria-live="assertive">
  {errorMessage}
</div>
```

#### Loading State

```tsx
<button disabled={isLoading} aria-busy={isLoading}>
  {isLoading ? (
    <>
      <Spinner aria-hidden="true" />
      <span className="sr-only">Loading</span>
    </>
  ) : (
    "Submit"
  )}
</button>
```

### 8. Images and Media

#### Alternative Text

```tsx
// Meaningful image
<img src="/avatar.png" alt="User profile image" />

// Decorative image
<img src="/decoration.svg" alt="" aria-hidden="true" />

// Complex image
<figure>
  <img src="/chart.png" alt="Sales trend graph for 2024" aria-describedby="chart-desc" />
  <figcaption id="chart-desc">
    Sales increased by 20% from January to December
  </figcaption>
</figure>
```

#### Video/Audio

This application uses speech recognition and synthesis, so the following are provided:

- Visual feedback for voice input (waveform display)
- Text display of AI responses (caption feature)
- Volume control

---

## Component-Specific Requirements

### Button

```tsx
// shared/components/ui/button.tsx
const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, disabled, children, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled}
        aria-disabled={disabled}
        {...props}
      >
        {children}
      </button>
    );
  }
);
```

**Requirements:**

- `min-h-[44px]` for target size
- `focus-visible` for focus ring
- Visual change and `aria-disabled` when `disabled`
- `aria-label` required for icon-only buttons

### Input

```tsx
// shared/components/ui/input.tsx
type InputProps = {
  id: string;
  label: string;
  error?: string;
  required?: boolean;
} & React.InputHTMLAttributes<HTMLInputElement>;

export function Input({ id, label, error, required, ...props }: InputProps) {
  const errorId = `${id}-error`;

  return (
    <div>
      <label htmlFor={id}>
        {label}
        {required && <span aria-hidden="true"> *</span>}
      </label>
      <input
        id={id}
        aria-required={required}
        aria-invalid={!!error}
        aria-describedby={error ? errorId : undefined}
        {...props}
      />
      {error && (
        <p id={errorId} role="alert" className="text-error text-sm">
          {error}
        </p>
      )}
    </div>
  );
}
```

### Select

```tsx
// shared/components/ui/select.tsx
type SelectProps = {
  id: string;
  label: string;
  options: { value: string; label: string }[];
  error?: string;
} & React.SelectHTMLAttributes<HTMLSelectElement>;

export function Select({ id, label, options, error, ...props }: SelectProps) {
  return (
    <div>
      <label htmlFor={id}>{label}</label>
      <select
        id={id}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p id={`${id}-error`} role="alert">{error}</p>}
    </div>
  );
}
```

### Navigation

```tsx
// DesktopSideNav.tsx
<nav aria-label="Main navigation">
  <ul role="list">
    {navItems.map((item) => (
      <li key={item.href}>
        <Link
          href={item.href}
          aria-current={isActive ? "page" : undefined}
          className="focus-visible:ring-2 focus-visible:ring-ring"
        >
          <item.icon aria-hidden="true" />
          <span>{item.label}</span>
        </Link>
      </li>
    ))}
  </ul>
</nav>
```

---

## Testing Methods

### Automated Testing

| Tool | Purpose | Detection Range |
|------|---------|----------------|
| axe-core | Automated checks in CI/CD | Approx. 40% |
| Biome lint rules | Static analysis (replaces eslint-plugin-jsx-a11y) | Basic issues |
| Lighthouse | Comprehensive evaluation including performance | Score-based |

#### axe-core Integration Example

```tsx
// tests/accessibility.test.tsx
import { axe, toHaveNoViolations } from "jest-axe";
import { render } from "@testing-library/react";

expect.extend(toHaveNoViolations);

describe("Accessibility", () => {
  it("should have no accessibility violations", async () => {
    const { container } = render(<YourComponent />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
```

### Manual Testing

#### Keyboard Testing

1. Can all interactive elements be reached with `Tab`?
2. Do buttons work with `Enter`/`Space`?
3. Does `Escape` close modals?
4. Is the focus ring always visible?
5. Is the focus order logical?

#### Screen Reader Testing

| OS | Screen Reader |
|----|--------------|
| macOS | VoiceOver (built-in) |
| Windows | NVDA (free) / JAWS |
| iOS | VoiceOver |
| Android | TalkBack |

**Check items:**

- Is the heading structure read correctly?
- Are form labels associated?
- Is alternative text for images appropriate?
- Are dynamic content changes announced?

#### Color Contrast Testing

- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- Chrome DevTools > Rendering > Emulate vision deficiencies

---

## References

- [WCAG 2.2](https://www.w3.org/TR/WCAG22/)
- [WAI-ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [MUI Accessibility](https://mui.com/material-ui/getting-started/accessibility/)
- [axe-core](https://github.com/dequelabs/axe-core)
- [Biome Accessibility Rules](https://biomejs.dev/linter/rules/#accessibility)
- [Design Checklist](../design/accessibility.md)
