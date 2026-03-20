# Accessibility Implementation Guide

This document provides implementation guidance for building accessible components. It targets **WCAG 2.2 Level AA** compliance.

For the design-level checklist of what to verify, see [Accessibility Design Checklist](../design/accessibility.md).

For the full specification, see [W3C WCAG 2.2](https://www.w3.org/TR/WCAG22/).

## Table of Contents

1. [React Aria](#react-aria)
2. [Current State Analysis](#current-state-analysis)
3. [Implementation Guidelines](#implementation-guidelines)
4. [Component-Specific Requirements](#component-specific-requirements)
5. [Testing Methods](#testing-methods)

---

**Note on code examples**: React Aria examples below use utility class names (e.g., `text-sm`, `rounded-full`) for brevity. In this project, implement equivalent styles using MUI `sx` prop or Emotion `styled()` per [Styling Guide](./styling.md).

## React Aria

This project uses **React Aria** for accessibility support.

### What is React Aria

[React Aria](https://react-spectrum.adobe.com/react-aria/) is an accessible UI component library developed by Adobe. It provides over 50 components and hooks with built-in:

- **Accessibility**: WCAG-compliant ARIA attributes, focus management, keyboard interaction
- **Internationalization**: RTL, date/number formatting, translation support
- **Adaptive interactions**: Mouse, touch, keyboard, screen reader support
- **Style freedom**: Compatible with any styling solution (this project uses MUI + Emotion)

### Installation

```bash
pnpm add react-aria-components
```

### Components to Use

| Component | Usage | Replaces |
|-----------|-------|----------|
| `Button` | Buttons | Custom Button |
| `TextField` | Text input | Custom Input |
| `Select` | Select box | Custom Select |
| `Modal` / `Dialog` | Modals | InterruptReasonModal, SurveyModal |
| `Form` | Forms | HTML forms |
| `RadioGroup` | Radio button groups | Custom implementation |
| `Checkbox` | Checkboxes | Custom implementation |
| `ProgressBar` | Progress display | Custom implementation |

### Implementation Examples

#### Button

```tsx
import { Button } from "react-aria-components";

export function PrimaryButton({ children, ...props }: ButtonProps) {
  return (
    <Button
      className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center
                 rounded-full bg-primary px-6 py-3 font-semibold text-white
                 transition duration-fast ease-standard
                 hover:bg-primary/90
                 focus-visible:outline-none focus-visible:ring-2
                 focus-visible:ring-ring focus-visible:ring-offset-2
                 disabled:opacity-60 disabled:cursor-not-allowed"
      {...props}
    >
      {children}
    </Button>
  );
}
```

#### TextField (Input)

```tsx
import { TextField, Label, Input, FieldError, Text } from "react-aria-components";

type TextFieldProps = {
  label: string;
  description?: string;
  errorMessage?: string;
  isRequired?: boolean;
};

export function FormTextField({ label, description, errorMessage, isRequired, ...props }: TextFieldProps) {
  return (
    <TextField isRequired={isRequired} {...props}>
      <Label className="font-medium text-sm">
        {label}
        {isRequired && <span className="text-error ml-1">*</span>}
      </Label>
      <Input
        className="mt-1 w-full rounded-2xl border bg-card px-4 py-3 text-sm
                   transition duration-fast ease-standard
                   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
                   invalid:border-error"
      />
      {description && (
        <Text slot="description" className="mt-1 text-muted text-sm">
          {description}
        </Text>
      )}
      <FieldError className="mt-1 text-error text-sm" />
    </TextField>
  );
}
```

#### Select

```tsx
import {
  Select,
  Label,
  Button,
  SelectValue,
  Popover,
  ListBox,
  ListBoxItem,
} from "react-aria-components";
import { ChevronDown } from "lucide-react";

type SelectOption = { id: string; name: string };

type FormSelectProps = {
  label: string;
  items: SelectOption[];
  placeholder?: string;
};

export function FormSelect({ label, items, placeholder, ...props }: FormSelectProps) {
  return (
    <Select {...props}>
      <Label className="font-medium text-sm">{label}</Label>
      <Button className="mt-1 flex w-full items-center justify-between rounded-2xl
                         border bg-card px-4 py-3 text-sm
                         focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <SelectValue className="truncate">
          {({ selectedText }) => selectedText || placeholder}
        </SelectValue>
        <ChevronDown className="h-4 w-4 text-muted" />
      </Button>
      <Popover className="w-[--trigger-width] rounded-xl border bg-card shadow-lg">
        <ListBox items={items} className="max-h-60 overflow-auto p-1">
          {(item) => (
            <ListBoxItem
              className="cursor-pointer rounded-lg px-3 py-2 text-sm
                         hover:bg-muted/10
                         focus:bg-muted/10 focus:outline-none
                         selected:bg-primary/10 selected:text-primary"
            >
              {item.name}
            </ListBoxItem>
          )}
        </ListBox>
      </Popover>
    </Select>
  );
}
```

#### Modal / Dialog

```tsx
import {
  DialogTrigger,
  Modal,
  Dialog,
  Heading,
  Button,
} from "react-aria-components";

type ConfirmDialogProps = {
  title: string;
  children: React.ReactNode;
  triggerLabel: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
};

export function ConfirmDialog({
  title,
  children,
  triggerLabel,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <DialogTrigger>
      <Button className="...">{triggerLabel}</Button>
      <Modal
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
        isDismissable
      >
        <Dialog className="mx-4 w-full max-w-lg rounded-2xl bg-card p-6 shadow-xl
                          focus:outline-none">
          <Heading slot="title" className="font-bold text-lg">
            {title}
          </Heading>
          <div className="mt-4">{children}</div>
          <div className="mt-6 flex justify-end gap-3">
            <Button
              slot="close"
              className="rounded-full px-4 py-2 text-muted hover:bg-muted/10"
            >
              {cancelLabel}
            </Button>
            <Button
              onPress={onConfirm}
              className="rounded-full bg-primary px-4 py-2 text-white"
            >
              {confirmLabel}
            </Button>
          </div>
        </Dialog>
      </Modal>
    </DialogTrigger>
  );
}
```

#### RadioGroup

```tsx
import { RadioGroup, Radio, Label } from "react-aria-components";

type RadioOption = { value: string; label: string };

type FormRadioGroupProps = {
  label: string;
  options: RadioOption[];
  isRequired?: boolean;
};

export function FormRadioGroup({ label, options, isRequired, ...props }: FormRadioGroupProps) {
  return (
    <RadioGroup isRequired={isRequired} {...props}>
      <Label className="font-medium text-sm">{label}</Label>
      <div className="mt-2 space-y-2">
        {options.map((option) => (
          <Radio
            key={option.value}
            value={option.value}
            className="group flex cursor-pointer items-center gap-3"
          >
            <div className="flex h-5 w-5 items-center justify-center rounded-full border-2
                           group-selected:border-primary group-selected:bg-primary
                           group-focus-visible:ring-2 group-focus-visible:ring-ring">
              <div className="h-2 w-2 rounded-full bg-white opacity-0
                             group-selected:opacity-100" />
            </div>
            <span className="text-sm">{option.label}</span>
          </Radio>
        ))}
      </div>
    </RadioGroup>
  );
}
```

### Focus Management

React Aria manages focus rings with the `useFocusRing` hook.

```tsx
import { useFocusRing, mergeProps } from "react-aria";

function CustomButton({ children, ...props }) {
  const ref = useRef(null);
  const { focusProps, isFocusVisible } = useFocusRing();
  const { buttonProps } = useButton(props, ref);

  return (
    <button
      {...mergeProps(buttonProps, focusProps)}
      ref={ref}
      className={cn(
        "rounded-full px-4 py-2",
        isFocusVisible && "ring-2 ring-ring ring-offset-2"
      )}
    >
      {children}
    </button>
  );
}
```

### Styling (MUI + Emotion)

React Aria components expose state via data attributes. In this project, style them using MUI's `sx` prop or Emotion `styled()`.

```tsx
import { styled } from "@mui/material/styles";
import { Button } from "react-aria-components";

const StyledButton = styled(Button)(({ theme }) => ({
  backgroundColor: theme.vars.palette.primary.main,
  color: theme.vars.palette.primary.contrastText,
  "&[data-hovered]": { opacity: 0.9 },
  "&[data-pressed]": { transform: "scale(0.95)" },
  "&[data-focus-visible]": {
    outline: `2px solid ${theme.vars.palette.primary.main}`,
    outlineOffset: 2,
  },
  "&[data-disabled]": { opacity: 0.5 },
}));
```

**Available data attributes for styling:**
- `[data-hovered]` - On hover
- `[data-focused]` - On focus
- `[data-focus-visible]` - On keyboard focus
- `[data-pressed]` - On press
- `[data-selected]` - On selection
- `[data-disabled]` - When disabled
- `[data-invalid]` - On validation error

### Migration Guide

Steps for replacing existing components with React Aria:

1. **Button**: Replace `<button>` with `<Button>`, change `onClick` to `onPress`
2. **Input**: Replace `<input>` with `<TextField>` + `<Input>` for integrated label/error
3. **Select**: Replace `<select>` with `<Select>` + `<ListBox>` for improved keyboard interaction
4. **Modal**: Replace custom implementation with `<Modal>` + `<Dialog>` for automatic focus trapping

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

Use React Aria's `<Modal>` + `<Dialog>` components (see [React Aria section](#modal--dialog) above), which handle focus trapping, ESC dismissal, and focus restoration automatically.

If building a custom modal without React Aria, ensure:
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
- [React Aria](https://react-spectrum.adobe.com/react-aria/) / [Components](https://react-spectrum.adobe.com/react-aria/components.html)
- [axe-core](https://github.com/dequelabs/axe-core)
- [Biome Accessibility Rules](https://biomejs.dev/linter/rules/#accessibility)
- [Design Checklist](../design/accessibility.md)
