# Utility Classes

## Overview

Custom utility classes defined in `@layer utilities` of `globals.css`. These provide project-specific styles used alongside MUI and Emotion.

---

## Text Utilities

### text-balance

Adjusts text line-end balance for more beautiful typesetting.

```css
.text-balance {
  text-wrap: balance;
}
```

**Use case**: Headings, taglines, and other short text

### text-2xs / text-3xs

Extra-small text size utilities.

| Class | Size | Line Height | Usage |
|-------|------|-------------|-------|
| `text-2xs` | 0.7rem (11.2px) | 1rem | Small labels, supplementary info |
| `text-3xs` | 0.65rem (10.4px) | 0.9rem | Extra small text, timestamps |

---

## Animation Utilities

### animate-fade-up / animate-fade-up-slow

Fade-in animation from bottom to top.

| Class | Duration | Usage |
|-------|----------|-------|
| `animate-fade-up` | 0.8s | Standard fade-in |
| `animate-fade-up-slow` | 1.2s | Slow fade-in |

```tsx
<div className="animate-fade-up">
  Content fades in
</div>
```

### animate-floaty

Floating up-and-down animation (infinite loop).

```css
.animate-floaty {
  animation: floaty 8s ease-in-out infinite;
}
```

**Use case**: Hero section avatars, decorative elements

### animate-soft-pulse

Soft pulse animation (infinite loop).

```css
.animate-soft-pulse {
  animation: softPulse 2.8s ease-in-out infinite;
}
```

**Use case**: CTA buttons, elements that draw attention

### animate-fade-in

Simple fade-in animation.

```css
.animate-fade-in {
  animation: fadeIn 0.3s ease-out;
}
```

**Use case**: Modals, tooltip display

---

## Shadow Utilities

| Class | Usage | Value |
|-------|-------|-------|
| `shadow-card` | Cards, panels | `var(--shadow-card)` |
| `shadow-action` | Buttons, interactive elements | `var(--shadow-action)` |
| `shadow-hero` | Hero elements, emphasis | `var(--shadow-hero)` |

```tsx
<div className="shadow-card">Card</div>
<button className="shadow-action">Button</button>
```

---

## Motion Utilities

| Class | Value | Usage |
|-------|-------|-------|
| `duration-fast` | 150ms | Hover, focus |
| `duration-md` | 300ms | Panel open/close, state changes |
| `ease-standard` | `cubic-bezier(0.2, 0.7, 0.2, 1)` | Standard easing |
| `transition-width` | `width` | Width transition |

```tsx
<div className="transition-width duration-fast ease-standard">
  Width changes smoothly
</div>
```

---

## Surface Utilities

Panel styles with semi-transparent backgrounds and borders.

### surface-panel / surface-panel-compact / surface-panel-input

| Class | Font Size | Background Opacity | Usage |
|-------|-----------|-------------------|-------|
| `surface-panel` | 0.875rem | 80% | Standard panel |
| `surface-panel-compact` | 0.75rem | 80% | Compact panel |
| `surface-panel-input` | 0.75rem | 90% | Input field style |

```css
.surface-panel {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-2xl);
  background-color: color-mix(in srgb, var(--color-card) 80%, transparent);
  padding: 0.75rem 1rem;
}
```

### input-surface

Surface for input fields.

```css
.input-surface {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-2xl);
  background-color: color-mix(in srgb, var(--color-card) 90%, transparent);
  padding: 0.75rem 1rem;
}
```

### surface-info / surface-alert

Surfaces for information and alert displays.

| Class | Background Color | Usage |
|-------|-----------------|-------|
| `surface-info` | `var(--color-info-soft)` | Information panel |
| `surface-alert` | `var(--color-accent-soft)` | Alert panel |

### surface-metric / surface-metric-lg

Surfaces for metric displays.

| Class | Padding | Usage |
|-------|---------|-------|
| `surface-metric` | 0.5rem 0.75rem | Small metrics |
| `surface-metric-lg` | 0.75rem | Large metrics |

---

## Pill / Badge Utilities

### pill-outline

Outline-style pill.

```css
.pill-outline {
  border: 1px solid var(--color-border);
  border-radius: 9999px;
  background-color: color-mix(in srgb, var(--color-card) 80%, transparent);
  padding: 0.5rem 1rem;
  font-size: 0.75rem;
}
```

### field-surface

Surface for form fields.

```css
.field-surface {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  background-color: var(--color-card);
  padding: 0.5rem 0.75rem;
}
```

---

## Video UI Utilities

Dedicated classes for video overlays.

### badge-video-overlay

```css
.badge-video-overlay {
  border-radius: 9999px;
  background-color: oklch(0 0 0 / 0.5);
  padding: 0.25rem 0.75rem;
  font-size: 0.7rem;
  color: oklch(1 0 0 / 0.8);
  backdrop-filter: blur(4px);
}
```

**Use case**: Timestamps and status displays on top of videos

### badge-alert

Alert badge with pulse animation.

```css
.badge-alert {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  background-color: oklch(0.63 0.24 25 / 0.8);
  color: oklch(1 0 0);
  font-weight: 700;
  backdrop-filter: blur(4px);
}
```

**Use case**: Important warnings, time limit exceeded

### badge-speaking

Badge indicating active speaking.

```css
.badge-speaking {
  background-color: oklch(0.70 0.17 162);
  box-shadow: var(--shadow-action);
}
```

**Use case**: Indicating that a user or AI is currently speaking

### badge-name / badge-name-sm

Badges for name display.

| Class | Font Size | Usage |
|-------|-----------|-------|
| `badge-name` | 0.875rem | Standard name display |
| `badge-name-sm` | 0.75rem | Small name display |

### overlay-panel-dark / overlay-panel-alert

Overlay panels.

| Class | Background Color | Usage |
|-------|-----------------|-------|
| `overlay-panel-dark` | `oklch(0 0 0 / 0.7)` | Dark overlay |
| `overlay-panel-alert` | `oklch(0.63 0.24 25 / 0.9)` | Alert overlay |

### badge-pose-feedback

Badge for posture feedback.

```css
.badge-pose-feedback {
  background-color: oklch(0.55 0.18 250 / 0.85);
  box-shadow: 0 2px 8px oklch(0 0 0 / 0.3);
  backdrop-filter: blur(4px);
}
```

**Use case**: Real-time feedback on posture

---

## Layout Utilities

| Class | Value | Usage |
|-------|-------|-------|
| `min-h-stage` | 80vh | Hero section |
| `min-w-pricing-table` | 600px | Pricing table minimum width |
| `min-h-answer` | 140px | Answer area |
| `min-h-suspense` | 60vh | Loading state |
| `min-h-textarea` | 150px | Text area |
| `min-w-action-btn` | 120px | Action button |
| `max-w-chat-bubble` | 80% | Chat bubble |
| `aspect-avatar` | 4:5 | Avatar display |

```tsx
<section className="min-h-stage">
  Hero Section
</section>

<div className="aspect-avatar">
  <img src="/avatar.png" alt="Avatar" />
</div>
```

---

## Grid Utilities

### lg:grid-cols-mic-check

Grid layout dedicated to the mic check page.

```css
@media (min-width: 1024px) {
  .lg\:grid-cols-mic-check {
    grid-template-columns: 1.1fr 0.9fr;
  }
}
```

---

## Background Utilities

### bg-app-gradient

Gradient background used across the application.

```css
.bg-app-gradient {
  background: radial-gradient(
      45% 45% at 10% 8%,
      rgba(255, 215, 194, 0.55),
      transparent 70%
    ),
    radial-gradient(
      50% 40% at 85% 12%,
      rgba(215, 230, 255, 0.6),
      transparent 72%
    ),
    radial-gradient(
      42% 40% at 70% 88%,
      rgba(231, 244, 239, 0.7),
      transparent 70%
    ),
    linear-gradient(160deg, #fbf6ef 0%, #f4f0ff 100%);
}
```

**Use case**: Landing pages, onboarding

---

## References

- [Design Tokens](./design-tokens.md)
- [Styling](../web-frontend/styling.md)
- [Accessibility](./accessibility.md)
