# Accessibility Design Checklist

## Overview

This checklist defines the accessibility criteria to verify during design and review. It targets **WCAG 2.2 Level AA** compliance.

For implementation details and code examples, see [Web Frontend Accessibility Guide](../web-frontend/accessibility.md).

For the full WCAG 2.2 specification, see [W3C WCAG 2.2](https://www.w3.org/TR/WCAG22/).

## 1. Alternative Text

| Check Item | Details |
|------------|--------|
| Images have alternative text | All `<img>` tags have a meaningful `alt` attribute |
| Decorative images can be ignored | Decorative images use `alt=""` or `role="presentation"` |

## 2. Video & Audio

| Check Item | Details |
|------------|--------|
| Video audio has captions | Users with hearing impairments can understand the content |
| Audio description or text alternative exists | Users with visual impairments can understand the content |
| Auto-playing media can be paused | Users can control playback |
| No content flashes more than 3 times per second | Prevention of photosensitive seizures |

## 3. Semantic Markup

| Check Item | Details |
|------------|--------|
| Tables use `<table>` semantically | Not used for layout purposes |
| Headings use `<h1>` through `<h6>` in order | No skipped heading levels |
| Lists use `<ul>`, `<ol>`, `<dl>` | Appropriate list elements for list content |
| Landmark elements are present | `<header>`, `<nav>`, `<main>`, `<footer>` |
| No duplicate `id` attributes on the page | `id` attributes must be unique |

## 4. Perceivability & Contrast

| Check Item | Details |
|------------|--------|
| Content is usable at 200% zoom | Responsive design, no overflow/clipping |
| Text contrast ratio is at least 4.5:1 (3:1 for large text 18px+) | Meets WCAG 2.2 AA |
| UI component contrast ratio is at least 3:1 | Borders, icons, focus indicators |
| Information is not conveyed by color alone | Use color + icon + text together |

## 5. Operability

| Check Item | Details |
|------------|--------|
| All interactive elements are keyboard-operable | Can receive focus and be activated |
| Focus order matches visual reading order | Logical tab sequence |
| Focus indicator is always visible | `focus-visible` styles applied |
| No time limits are imposed | Or users can extend/remove them |
| Touch targets are at least 24x24px (44x44px recommended) | WCAG 2.2 criterion 2.5.8 |
| Drag actions have alternative input methods | WCAG 2.2 criterion 2.5.7 |

## 6. Navigation

| Check Item | Details |
|------------|--------|
| Page language is specified | `<html lang="ja">` |
| Page title reflects page content | Specific and unique `<title>` |
| Skip link to main content is provided | Visible on keyboard focus |
| Link text describes the destination | No ambiguous "click here" links |
| Focused elements are not obscured by sticky headers | WCAG 2.2 criterion 2.4.11 |

## 7. Forms

| Check Item | Details |
|------------|--------|
| All inputs have associated `<label>` elements | Using `htmlFor`/`id` pairs |
| Required fields are indicated | `aria-required="true"` and visual indicator |
| Errors are clearly identified | `aria-invalid`, `aria-describedby`, `role="alert"` |
| No unexpected changes on input | No unintended side effects |
| Previously entered data is not re-requested | WCAG 2.2 criterion 3.3.7 |
| Authentication has low cognitive burden | WCAG 2.2 criterion 3.3.8 |

## 8. Modal / Dialog

| Check Item | Details |
|------------|--------|
| Has `role="dialog"` and `aria-modal="true"` | Proper ARIA semantics |
| Title is associated with `aria-labelledby` | Screen readers announce the dialog title |
| Focus is trapped inside the dialog | Cannot tab to background content |
| Closes with `Escape` key | Standard dismissal pattern |
| Focus returns to trigger element on close | Maintains user context |

## How to Use This Checklist

1. Review during design and after development
2. Verify each item; fix any failures
3. Re-verify after fixes
4. Confirm all items pass before release

## References

- [WCAG 2.2 Guidelines](https://www.w3.org/TR/WCAG22/)
- [WCAG 2.2 Quick Reference](https://www.w3.org/WAI/WCAG22/quickref/?levels=aaa)
- [Implementation Guide](../web-frontend/accessibility.md)
