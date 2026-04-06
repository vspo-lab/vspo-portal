# Dev Toolbar

## Current State

The bot-dashboard does not currently leverage the Astro Dev Toolbar beyond its default functionality. The toolbar provides built-in apps (Inspect, Audit, Settings) and supports custom app extensions.

### Issues

| # | Issue | Impact |
|---|-------|--------|
| 1 | Not leveraging Inspect app during development | Missing visibility into island props and hydration directives |
| 2 | Audit app results not documented or tracked | Known accessibility issues not systematically addressed |
| 3 | No custom toolbar app for project-specific debugging | Missing dev tools for channel config, session state, etc. |
| 4 | Dev Toolbar not mentioned in onboarding docs | New contributors unaware of available dev tools |

---

## 1. Built-in Apps

### Inspect

Shows information about each [island](https://docs.astro.build/en/concepts/islands/) on the current page:
- Component name and file path
- Props passed to the island
- Client directive used (`client:load`, `client:idle`, etc.)

**Usage during migration**: When converting vanilla JS components to React islands, use Inspect to verify:
- Correct props are passed
- Appropriate client directive is selected
- Server Islands are rendering with fallback

### Audit

Runs automated audits on the current page:
- **Performance**: Image dimensions, font loading, CLS indicators
- **Accessibility**: Missing alt text, color contrast, ARIA attributes

> **Note**: The audit is a development aid, not a replacement for dedicated tools like Lighthouse or Pa11y. Use it for catching obvious issues during development.

### Settings

Configure toolbar behavior:
- Verbose logging
- Notification preferences
- Toolbar placement (bottom-left, bottom-center, bottom-right)

---

## 2. Custom Toolbar App: Dashboard Inspector

Create a project-specific toolbar app for debugging the bot-dashboard:

### Integration Setup

```typescript
// integrations/dashboard-inspector.ts
import type { AstroIntegration } from "astro";

export default function dashboardInspector(): AstroIntegration {
  return {
    name: "dashboard-inspector",
    hooks: {
      "astro:config:setup": ({ addDevToolbarApp }) => {
        addDevToolbarApp({
          id: "dashboard-inspector",
          name: "Dashboard Inspector",
          icon: "gear",
          entrypoint: new URL("./toolbar/dashboard-app.ts", import.meta.url),
        });
      },
    },
  };
}
```

### Toolbar App

```typescript
// integrations/toolbar/dashboard-app.ts
import type { DevToolbarApp } from "astro";

export default {
  id: "dashboard-inspector",
  init(canvas) {
    const container = document.createElement("astro-dev-toolbar-window");

    // Session info card
    const sessionCard = document.createElement("astro-dev-toolbar-card");
    sessionCard.innerHTML = `
      <h3>Session State</h3>
      <p>Check browser cookies and session data</p>
    `;

    // Island count
    const islands = document.querySelectorAll("astro-island");
    const islandCard = document.createElement("astro-dev-toolbar-card");
    islandCard.innerHTML = `
      <h3>Islands on Page</h3>
      <p>${islands.length} interactive islands detected</p>
    `;

    // Highlight islands
    islands.forEach((island) => {
      const highlight = document.createElement("astro-dev-toolbar-highlight");
      const rect = island.getBoundingClientRect();
      highlight.style.top = `${rect.top + window.scrollY}px`;
      highlight.style.left = `${rect.left + window.scrollX}px`;
      highlight.style.width = `${rect.width}px`;
      highlight.style.height = `${rect.height}px`;
      highlight.icon = "puzzle";
      canvas.appendChild(highlight);
    });

    container.appendChild(sessionCard);
    container.appendChild(islandCard);
    canvas.appendChild(container);
  },
} satisfies DevToolbarApp;
```

### Register in Config

```typescript
// astro.config.ts
import dashboardInspector from "./integrations/dashboard-inspector";

export default defineConfig({
  integrations: [
    // Only in dev
    ...(import.meta.env.DEV ? [dashboardInspector()] : []),
  ],
});
```

---

## 3. Dev Toolbar Component Library

Available components for custom apps:

| Component | Purpose |
|-----------|---------|
| `astro-dev-toolbar-window` | Main container window |
| `astro-dev-toolbar-card` | Card element with optional `link` |
| `astro-dev-toolbar-highlight` | Overlay highlight on page elements |
| `astro-dev-toolbar-tooltip` | Multi-section tooltip |
| `astro-dev-toolbar-toggle` | Checkbox toggle |
| `astro-dev-toolbar-radio-checkbox` | Radio button (astro@4.8.0+) |
| `astro-dev-toolbar-select` | Select dropdown (astro@4.6.0+) |
| `astro-dev-toolbar-badge` | Status badge |
| `astro-dev-toolbar-button` | Styled button |
| `astro-dev-toolbar-icon` | Icon from built-in set or custom SVG |

### Available Icons

`astro:logo`, `warning`, `arrow-down`, `bug`, `check-circle`, `gear`, `lightbulb`, `file-search`, `star`, `checkmark`, `dots-three`, `copy`, `compress`, `grid`, `puzzle`, `robot`, `sitemap`, `gauge`, `person-arms-spread`, `image`, and more.

### Style Variants

All visual components support: `"purple"`, `"gray"`, `"red"`, `"green"`, `"yellow"`, `"blue"`.

---

## 4. Practical Dev Toolbar Ideas for This Project

### A. Channel Config Validator

Highlight channel configuration forms and validate their state:

```typescript
// Validate channel config forms on the page
const forms = document.querySelectorAll('form[data-channel-config]');
forms.forEach(form => {
  const inputs = form.querySelectorAll('input[required]');
  const hasEmpty = Array.from(inputs).some(i => !i.value);

  const highlight = document.createElement('astro-dev-toolbar-highlight');
  highlight.style = /* position to form */;
  highlight.highlightStyle = hasEmpty ? 'red' : 'green';
  canvas.appendChild(highlight);
});
```

### B. i18n Coverage Checker

Check for untranslated strings on the current page:

```typescript
// Find text nodes that might be untranslated
const walker = document.createTreeWalker(
  document.body,
  NodeFilter.SHOW_TEXT,
);
let untranslated = 0;
while (walker.nextNode()) {
  const text = walker.currentNode.textContent?.trim();
  // Check for Japanese characters in English mode or vice versa
  if (text && /[\u3000-\u9FFF]/.test(text) && document.documentElement.lang === 'en') {
    untranslated++;
  }
}
```

### C. Auth State Inspector

Display current authentication and session state:

```typescript
const cookies = document.cookie.split(';').map(c => c.trim());
const sessionCookie = cookies.find(c => c.startsWith('session='));
// Display session info in toolbar
```

---

## 5. Third-Party Toolbar Apps

Explore community toolbar apps from the [Astro integrations directory](https://astro.build/integrations/?search=&categories%5B%5D=toolbar):

| App | Purpose | Relevance |
|-----|---------|-----------|
| `astro-devtool-breakpoints` | Visual breakpoint indicator | Responsive design debugging |
| `@storyblok/astro` | Storyblok visual editor | CMS integration (future) |

---

## Checklist

- [ ] Document Inspect app usage for island debugging in dev onboarding
- [ ] Create baseline Audit report and track improvements
- [ ] Build `dashboard-inspector` custom toolbar app
- [ ] Add i18n coverage checker as toolbar app
- [ ] Evaluate community toolbar apps for responsive debugging

## Cross-References

- [23_DEV_TOOLING.md](./23_DEV_TOOLING.md) — Dev tooling improvements (Storybook, CI, etc.)
- [01_ISLANDS_ARCHITECTURE.md](./01_ISLANDS_ARCHITECTURE.md) — Island debugging with Inspect
- [07_I18N.md](./07_I18N.md) — i18n coverage checking
- [08_ACCESSIBILITY.md](./08_ACCESSIBILITY.md) — Audit app for a11y issues
