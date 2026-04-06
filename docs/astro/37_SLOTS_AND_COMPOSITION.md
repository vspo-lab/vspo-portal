# Slots and Component Composition

## Current State

The bot-dashboard uses slots extensively in layouts and shared components:

- `Base.astro` — default slot for page content, `head` named slot
- `Dashboard.astro` — default slot for dashboard content
- `Card.astro` — default slot for card body
- `Button.astro` — default slot for button label
- Various dialog/modal components — slots for content injection

### Issues

| # | Issue | Impact |
|---|-------|--------|
| 1 | No fallback content for optional slots | Empty sections render when content not provided |
| 2 | Named slots not used for complex layouts (header/body/footer pattern) | Limited composition flexibility |
| 3 | Slot transfer pattern not used in nested layouts | Repeated boilerplate in nested layout compositions |
| 4 | No `Astro.slots.has()` checks for conditional rendering | Unnecessary wrapper elements rendered |
| 5 | React island children passed as default slot only | Named slot-to-prop conversion not leveraged |

---

## 1. Slot Fundamentals

### Default Slot

```astro
<!-- Card.astro -->
<div class="card">
  <slot />
</div>

<!-- Usage -->
<Card>
  <p>Card content goes here</p>
</Card>
```

### Named Slots

```astro
<!-- Card.astro -->
<div class="card">
  <header class="card-header">
    <slot name="header" />
  </header>
  <div class="card-body">
    <slot />
  </div>
  <footer class="card-footer">
    <slot name="footer" />
  </footer>
</div>

<!-- Usage -->
<Card>
  <h2 slot="header">Title</h2>
  <p>Body content</p>
  <button slot="footer">Action</button>
</Card>
```

> **Important**: Named slots must be immediate children of the component. They cannot be passed through nested elements.

### Multiple Elements in Named Slots

Use `<Fragment>` to pass multiple elements into a named slot without a wrapper:

```astro
<Card>
  <Fragment slot="header">
    <h2>Title</h2>
    <p class="subtitle">Subtitle text</p>
  </Fragment>
  <p>Body content</p>
</Card>
```

---

## 2. Fallback Content

Slots render fallback content only when no matching children are passed:

```astro
<!-- ErrorAlert.astro -->
<div role="alert" class="error-alert">
  <slot name="icon">
    <!-- Default icon when none provided -->
    <svg><!-- error icon --></svg>
  </slot>
  <slot>
    <p>An unexpected error occurred.</p>
  </slot>
</div>
```

> **Gotcha**: An empty slot element (`<Component><span slot="icon"></span></Component>`) does NOT trigger fallback — only the complete absence of a matching slot child does.

### Improvement: Add Fallback Content to Existing Components

```astro
<!-- Card.astro — Current (no fallback) -->
<div class="card">
  <slot name="header" />
  <slot />
</div>

<!-- Card.astro — Improved (with fallback) -->
<div class="card">
  <slot name="header">
    <!-- No header rendered if not provided -->
  </slot>
  <div class="card-body">
    <slot>
      <p class="text-muted">No content available.</p>
    </slot>
  </div>
</div>
```

---

## 3. Conditional Slot Rendering with `Astro.slots.has()`

Avoid rendering wrapper elements when a slot is not provided:

```astro
---
const hasHeader = Astro.slots.has('header');
const hasFooter = Astro.slots.has('footer');
---
<div class="card">
  {hasHeader && (
    <header class="card-header border-b">
      <slot name="header" />
    </header>
  )}

  <div class="card-body">
    <slot />
  </div>

  {hasFooter && (
    <footer class="card-footer border-t">
      <slot name="footer" />
    </footer>
  )}
</div>
```

### Current Component Improvements

| Component | Improvement |
|-----------|-------------|
| `Card.astro` | Add `Astro.slots.has('header')` / `has('footer')` checks |
| `Base.astro` | Add `Astro.slots.has('head')` to conditionally render extra `<head>` content |
| `FlashMessage.astro` | Add fallback content for empty messages |
| `ErrorAlert.astro` | Add default icon fallback and default message |

---

## 4. Slot Transfer (Nested Layouts)

Transfer slots through layout nesting without losing slot assignments:

```astro
<!-- Base.astro -->
<html lang={locale}>
  <head>
    <slot name="head" />
  </head>
  <body>
    <slot />
  </body>
</html>

<!-- Dashboard.astro — transfers slots to Base -->
<Base title={title}>
  <slot name="head" slot="head" />
  <Header />
  <main>
    <slot />
  </main>
  <Footer />
</Base>

<!-- Page usage — slots pass through Dashboard to Base -->
<Dashboard title="Guild Settings">
  <link rel="preload" href="/fonts/custom.woff2" slot="head" />
  <GuildSettings guild={guild} />
</Dashboard>
```

> **Key syntax**: `<slot name="head" slot="head" />` — the `name` attribute defines what this slot receives, the `slot` attribute defines where it gets placed in the parent.

---

## 5. Slots with React Islands

When passing children to React islands, Astro converts slots:

### Default Slot → `children` Prop

```astro
<ReactComponent client:load>
  <p>This becomes props.children in React</p>
</ReactComponent>
```

### Named Slots → Props (kebab-case → camelCase)

```astro
<ReactSidebar client:load>
  <h2 slot="title">Menu</h2>
  <p>Default content (children)</p>
  <ul slot="social-links">
    <li>Link 1</li>
  </ul>
</ReactSidebar>
```

```tsx
// ReactSidebar.tsx
export default function ReactSidebar(props: {
  title: React.ReactNode;
  children: React.ReactNode;
  socialLinks: React.ReactNode;  // kebab-case → camelCase
}) {
  return (
    <aside>
      <header>{props.title}</header>
      <main>{props.children}</main>
      <footer>{props.socialLinks}</footer>
    </aside>
  );
}
```

> **Important**: Named slot names using `kebab-case` are converted to `camelCase` when passed to React/Preact/Solid components.

---

## 6. `Astro.slots.render()` for Advanced Composition

Render slot content as a string (useful for wrapping or transforming):

```astro
---
const headerContent = await Astro.slots.render('header');
const hasContent = headerContent.trim().length > 0;
---
{hasContent && (
  <header set:html={headerContent} />
)}
```

> **Note**: `Astro.slots.render()` is async and returns an HTML string. Use sparingly as it prevents streaming optimizations.

---

## 7. Dynamic Slot Names

Dynamic slot names are not supported in Astro components:

```astro
<!-- This does NOT work -->
{items.map(item => (
  <slot name={item.id} />  <!-- Error: dynamic slot name -->
))}
```

If dynamic slots are needed, use a React island where this pattern is natural:

```tsx
// DynamicTabs.tsx
export function DynamicTabs({ tabs }: { tabs: Record<string, React.ReactNode> }) {
  const [active, setActive] = useState(Object.keys(tabs)[0]);
  return (
    <div>
      {Object.keys(tabs).map(key => (
        <button key={key} onClick={() => setActive(key)}>{key}</button>
      ))}
      <div>{tabs[active]}</div>
    </div>
  );
}
```

---

## 8. Composition Patterns for the Dashboard

### Recommended Layout Hierarchy

```text
Base.astro
  ├── slot:head (optional page-specific <head> content)
  └── slot:default (page body)
      └── Dashboard.astro
          ├── slot:head → transfers to Base slot:head
          ├── Header component (static)
          ├── slot:sidebar (optional)
          └── slot:default (page main content)
              └── [Page].astro
                  ├── slot:sidebar → guild nav (optional)
                  └── slot:default → page content
```

### Component Composition Example

```astro
<!-- Dashboard.astro -->
---
const hasSidebar = Astro.slots.has('sidebar');
---
<Base title={title}>
  <slot name="head" slot="head" />
  <Header />
  <div class:list={['dashboard-layout', { 'has-sidebar': hasSidebar }]}>
    {hasSidebar && (
      <aside class="sidebar">
        <slot name="sidebar" />
      </aside>
    )}
    <main class="main-content">
      <slot />
    </main>
  </div>
  <Footer />
</Base>
```

---

## Checklist

- [ ] Add `Astro.slots.has()` checks to `Card.astro`, `Base.astro`, `ErrorAlert.astro`
- [ ] Add fallback content to all optional slots
- [ ] Implement slot transfer in `Dashboard.astro` → `Base.astro` for `head` slot
- [ ] Document named slot-to-prop conversion for React islands
- [ ] Use `<Fragment slot="...">` for multi-element slot content
- [ ] Audit all layouts for slot transfer opportunities

## Cross-References

- [01_ISLANDS_ARCHITECTURE.md](./01_ISLANDS_ARCHITECTURE.md) — React island hydration with slots
- [04_COMPONENT_IMPROVEMENTS.md](./04_COMPONENT_IMPROVEMENTS.md) — Component-level improvements
- [08_ACCESSIBILITY.md](./08_ACCESSIBILITY.md) — ARIA patterns in slotted content
- [30_DESIGN_SYSTEM.md](./30_DESIGN_SYSTEM.md) — Component API design
