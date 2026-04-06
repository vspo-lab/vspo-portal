# Scripts and Styles Patterns

## Current State

The bot-dashboard uses a mix of approaches for client-side scripts and styles:

- **Scripts**: Vanilla JS in `<script>` tags with AbortController pattern, `data-action-*` attributes
- **Styles**: Tailwind CSS v4 via `@tailwindcss/vite`, scoped Astro `<style>` tags, some `is:global`
- **CSS Variables**: `define:vars` used in some components for theme-dependent values

### Issues

| # | Issue | Impact |
|---|-------|--------|
| 1 | Scripts use `document.querySelector` across component boundaries | Brittle, breaks with component changes |
| 2 | No custom element pattern for Astro components with scripts | Missing encapsulation |
| 3 | `define:vars` on `<script>` implies `is:inline` (not bundled) | Larger HTML, no deduplication |
| 4 | Mixed approaches for passing server data to client | Inconsistent patterns |
| 5 | No script loading strategy documentation | Unclear when to use `is:inline` vs bundled |
| 6 | Some `<style>` tags need `:global()` for child component styling | Potential style leaks |

---

## 1. Script Directives Reference

| Directive | Behavior | Bundled? | Deduped? |
|-----------|----------|----------|----------|
| (none) | Processed and bundled by Astro | Yes | Yes |
| `is:inline` | Rendered as-is in HTML | No | No |
| `define:vars={...}` | Implies `is:inline` on scripts | No | No |

> **Key rule**: Astro bundles and deduplicates `<script>` tags by default. A script in a component used 5 times on a page is only included once. Using `is:inline` disables this optimization.

### When to Use `is:inline`

- Third-party scripts that must not be processed (e.g., analytics snippets)
- Scripts that need `define:vars` (consider alternatives first)
- Scripts that must appear exactly where written in the HTML

### When NOT to Use `is:inline`

- Component scripts that benefit from bundling (most cases)
- Scripts with `import` statements (imports won't resolve with `is:inline`)
- Scripts where deduplication matters (used in multiple instances)

---

## 2. Passing Server Data to Client Scripts

### Pattern A: `data-*` Attributes (Recommended)

```astro
---
const { channelId, channelName } = Astro.props;
---
<channel-actions data-channel-id={channelId} data-channel-name={channelName}>
  <button class="edit-btn">Edit</button>
</channel-actions>

<script>
  class ChannelActions extends HTMLElement {
    connectedCallback() {
      const id = this.dataset.channelId;
      const name = this.dataset.channelName;
      this.querySelector('.edit-btn')?.addEventListener('click', () => {
        // Use id and name
      });
    }
  }
  customElements.define('channel-actions', ChannelActions);
</script>
```

**Advantages**: Bundled, deduped, scoped to custom element instance, works with multiple instances.

### Pattern B: `define:vars` (Use Sparingly)

```astro
---
const apiEndpoint = "/api/guilds";
---
<script define:vars={{ apiEndpoint }}>
  // This is inlined in every instance
  fetch(apiEndpoint).then(/* ... */);
</script>
```

**Disadvantages**: Not bundled, not deduped, no import support.

### Pattern C: Hidden Input / JSON Script (For Complex Data)

```astro
---
const config = { channels: [...], guild: {...} };
---
<script type="application/json" id="page-data">
  {JSON.stringify(config)}
</script>

<script>
  const data = JSON.parse(
    document.getElementById('page-data')?.textContent ?? '{}'
  );
</script>
```

---

## 3. Custom Elements Pattern

The project's vanilla JS should migrate to the custom element pattern before full React migration:

### Current (Fragile)

```astro
<div class="flash-message" data-message={message}>
  <span class="flash-text"></span>
</div>

<script>
  // Searches entire page - breaks with multiple instances
  const el = document.querySelector('.flash-message');
</script>
```

### Improved (Custom Element)

```astro
<flash-message data-message={message} data-type={type}>
  <span class="flash-text"></span>
  <button class="close-btn" aria-label="Close">&times;</button>
</flash-message>

<script>
  class FlashMessage extends HTMLElement {
    connectedCallback() {
      const text = this.querySelector('.flash-text');
      const btn = this.querySelector('.close-btn');
      if (text) text.textContent = this.dataset.message ?? '';
      btn?.addEventListener('click', () => this.remove());

      // Auto-dismiss after 5 seconds
      setTimeout(() => this.remove(), 5000);
    }
  }
  customElements.define('flash-message', FlashMessage);
</script>
```

**Advantages**:
- `this.querySelector()` scopes queries to the element instance
- `connectedCallback()` runs per instance (safe for multiple uses)
- Bundled and deduped by Astro
- Progressive enhancement: content visible before JS loads

---

## 4. Style Directives Reference

| Directive | Scope | Use Case |
|-----------|-------|----------|
| `<style>` | Scoped (data attribute) | Default for component styles |
| `<style is:global>` | Global | Reset styles, third-party overrides |
| `:global()` selector | Per-selector global | Style child component elements |
| `<style define:vars={...}>` | Scoped | Pass server values as CSS variables |
| `class:list` | N/A (utility) | Conditional class composition |

### Scoped Styles

```astro
<style>
  /* Only applies to <h1> in THIS component */
  h1 { color: red; }

  /* Compiles to: h1[data-astro-cid-xxxxx] { color: red; } */
</style>
```

### Styling Child Components

```astro
<style>
  /* Scoped to this component */
  .card { border: 1px solid; }

  /* Applies to child component elements */
  .card :global(h2) { font-size: 1.5rem; }
</style>
<div class="card">
  <ChildComponent />
</div>
```

### `define:vars` for CSS

```astro
---
const accentColor = isDarkMode ? '#60a5fa' : '#2563eb';
---
<style define:vars={{ accentColor }}>
  .accent {
    color: var(--accentColor);
  }
</style>
```

> **Note**: `define:vars` on `<style>` does NOT imply `is:inline` (unlike on `<script>`). Styles are still scoped normally.

---

## 5. `class:list` Utility

```astro
---
const { isActive, variant = 'primary' } = Astro.props;
---
<button
  class:list={[
    'btn',
    `btn-${variant}`,
    { 'btn-active': isActive },
    isActive && 'ring-2',
  ]}
>
  <slot />
</button>
```

Supports: strings, objects (key = class, value = boolean), arrays, falsy values (ignored).

---

## 6. Tailwind CSS v4 Integration

The project uses Tailwind v4 with CSS-first configuration:

```css
/* src/styles/global.css */
@import "tailwindcss";

@theme {
  --color-primary: #5b65ea;
  --color-surface: #1e1e2e;
  /* ... */
}
```

### Interaction with Astro Scoped Styles

Tailwind utility classes are global by nature. When using scoped `<style>` with Tailwind:

```astro
<style>
  /* This won't work as expected - scoped attribute breaks Tailwind */
  .btn { @apply px-4 py-2; }
</style>

<!-- Better: use Tailwind classes directly in markup -->
<button class="px-4 py-2 bg-primary text-white">Click</button>
```

### Cascade Layers (Tailwind v4)

Tailwind v4 uses cascade layers internally. When combining with Astro's scoped styles or Astro responsive images, be aware of [layer interaction](./25_IMAGE_OPTIMIZATION.md).

---

## 7. Script Ordering

> **Astro 6**: Script and style order preservation is now default behavior (previously `experimental.preserveScriptOrder`). Scripts render in the order they appear in the component template.

This affects components with multiple scripts:

```astro
<!-- Script A runs before Script B -->
<script>
  console.log('First');
</script>
<div>Content</div>
<script>
  console.log('Second');
</script>
```

---

## Migration Candidates

Current `<script>` blocks to migrate to custom elements or React islands:

| File | Lines | Pattern | Migration Target |
|------|-------|---------|-----------------|
| `index.astro` | ~30 | AbortController popup | React island (FeatureShowcase) |
| `ChannelConfigForm.astro` | ~320 | DOM manipulation | React island (ChannelConfigModal) |
| `ChannelAddModal.astro` | ~110 | Template clone | React island (ChannelAddModal) |
| `DeleteChannelDialog.astro` | ~30 | Simple event | React island or custom element |
| `FlashMessage.astro` | ~5 | Auto-dismiss | Custom element (interim) |
| `[guildId].astro` | ~20 | Dialog close | Nano Store event |

---

## Checklist

- [ ] Audit all `<script>` tags for `is:inline` vs bundled decision
- [ ] Replace `document.querySelector` patterns with custom elements
- [ ] Prefer `data-*` attributes over `define:vars` for passing data to scripts
- [ ] Document when to use `:global()` vs `is:global`
- [ ] Ensure `class:list` is used for conditional classes (not string concatenation)
- [ ] Verify script order preservation after Astro 6 upgrade

## Cross-References

- [02_REACT_MIGRATION.md](./02_REACT_MIGRATION.md) — Full React migration targets
- [04_COMPONENT_IMPROVEMENTS.md](./04_COMPONENT_IMPROVEMENTS.md) — Component-level improvements
- [29_VIEW_TRANSITIONS.md](./29_VIEW_TRANSITIONS.md) — Script re-execution during transitions
- [30_DESIGN_SYSTEM.md](./30_DESIGN_SYSTEM.md) — Design tokens and Tailwind v4 theme
