# Accessibility Checklist

## Overview

Accessibility is a critical element for ensuring that all users can use the product. This checklist is based on WCAG 2.1 criteria and is organized into 7 categories.

## 1. Alternative Text

Provide appropriate alternative text for images and media content.

| Check Item | Details |
|------------|--------|
| Images have alternative text | Set the `alt` attribute on all `<img>` tags |
| Decorative images can be ignored | Set `alt=""` or `role="presentation"` on decorative images |

### Implementation Examples

```tsx
// Images that convey information
<img src="/article-image.jpg" alt="Aerial photograph of Tokyo's night skyline" />

// Decorative images
<img src="/decorative-line.png" alt="" role="presentation" />

// Images within links
<a href="/home">
  <img src="/logo.svg" alt="Return to home" />
</a>
```

## 2. Video & Audio

Ensure accessibility of video and audio content.

| Check Item | Details |
|------------|--------|
| Video audio has captions | Users with hearing impairments can understand the content |
| There is audio description or content explaining the video | Users with visual impairments can understand the content |
| Audio, video, and animations that auto-play can be paused | Users can control playback |
| No content flashes or strobes more than 3 times per second | Prevention of photosensitive seizures |

### Implementation Examples

```tsx
<video controls>
  <source src="/video.mp4" type="video/mp4" />
  <track kind="captions" src="/captions-ja.vtt" srclang="ja" label="Japanese captions" />
</video>
```

## 3. Markup

Use semantic HTML markup.

| Check Item | Details |
|------------|--------|
| Tables are marked up with `<table>` | Do not use table for layout purposes |
| Headings are marked up with `<h1>` through `<h6>` | Use heading levels in sequential order |
| Lists are marked up with `<ul>`, `<ol>`, `<dl>` | Use appropriate list elements |
| Whitespace characters are not used for layout | Control layout with CSS |
| No duplicate `id` attributes exist on the page | id attributes must be unique |

### Correct Use of Headings

```tsx
// OK: Sequential heading order
<h1>Page Title</h1>
<h2>Section 1</h2>
<h3>Subsection 1-1</h3>
<h2>Section 2</h2>

// NG: Skipping heading levels
<h1>Page Title</h1>
<h3>Section 1</h3>  {/* Skipped h2 */}
```

## 4. Perceivability and Distinguishability

Ensure that visual and auditory information is conveyed appropriately.

| Check Item | Details |
|------------|--------|
| Information remains accessible when the screen is zoomed to 200% or font size is doubled | Responsive design |
| Contrast ratio between background and text colors is at least 4.5:1 (3:1 for large text 29px+) | Ensure readability |
| Content is not described solely by color, shape, sound, or layout | Convey information through multiple means |

### Contrast Ratio Standards

| Target | Minimum Contrast Ratio |
|--------|----------------------|
| Normal text (below 14px) | 4.5:1 |
| Large text (18px+ or 14px+ bold) | 3:1 |
| UI components | 3:1 |

### Information Conveyance Not Dependent on Color Alone

```tsx
// NG: Indicating error with color only
<input className="border-red-500" />

// OK: Indicating error with color + icon + text
<div>
  <input className="border-red-500" aria-invalid="true" aria-describedby="error-msg" />
  <span id="error-msg" className="text-red-600">
    <ErrorIcon /> The input contains errors
  </span>
</div>
```

## 5. Operability

Ensure operability with keyboard and other input devices.

| Check Item | Details |
|------------|--------|
| Operable via keyboard | All interactive elements can receive focus |
| Keyboard navigation order matches visual order | Set tabindex appropriately |
| No time limits are imposed on content | Allow extension or removal if time limits are necessary |

### Keyboard Focus Visibility

```css
:focus-visible {
  outline: 2px solid var(--color-border-focus);
  outline-offset: 2px;
}
```

## 6. Navigation

Clarify navigation within the page.

| Check Item | Details |
|------------|--------|
| Page language is specified on `<html>` | `<html lang="ja">` |
| Page title reflects the content of the page | Specific and unique titles |
| Main content of the page has headings | Facilitate navigation with screen readers |
| Link destination can be determined from the link text | Avoid links with only "click here" |

### Improving Link Text

```tsx
// NG: Unclear link destination
Please check <a href="/policy">here</a>.

// OK: Clear link destination
Please check our <a href="/policy">Privacy Policy</a>.
```

## 7. Forms

Ensure accessibility of form inputs.

| Check Item | Details |
|------------|--------|
| Input content and actions are displayed as labels | Use `<label>` elements |
| Form elements have accessible names | `aria-label` or `aria-labelledby` |
| Error occurrence and error content can be identified | Display error messages clearly |
| Selecting or entering input fields does not cause unexpected major changes | Avoid unintended user actions |

### Form Implementation Example

```tsx
<div>
  <label htmlFor="email">Email Address</label>
  <input
    id="email"
    type="email"
    aria-required="true"
    aria-invalid={hasError}
    aria-describedby={hasError ? "email-error" : undefined}
  />
  {hasError && (
    <span id="email-error" role="alert" className="text-error">
      Please enter a valid email address
    </span>
  )}
</div>
```

## How to Use This Checklist

1. Review this checklist upon completion of development
2. Verify each item and fix any issues found
3. After fixes, review the checklist again
4. Confirm all items are cleared before release

## References

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [axe DevTools](https://www.deque.com/axe/devtools/)
- [Lighthouse Accessibility Audit](https://developers.google.com/web/tools/lighthouse)
