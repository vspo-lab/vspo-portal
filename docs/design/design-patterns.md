# Design Patterns

Proven solutions to recurring UI challenges.

## Eye Flow Guidance

| Pattern | Use When |
|---------|----------|
| F-pattern (left-to-right, then down) | Lists, settings, vertically stacked content |
| Z-pattern (top-left -> top-right -> bottom-left -> bottom-right) | Modals, login, low-scroll screens |

Use heading levels in order, make inner padding narrower than outer padding. Combine with accessibility -- do not rely solely on visual flow.

## Visual Grouping

| Method | Use When |
|--------|----------|
| Whitespace | Elements can be arranged by relevance |
| Rectangle | Contains multiple sub-groups |
| Divider line | Last resort when whitespace/rectangles are insufficient |

Maintain consistent grouping at each hierarchy level. Use TabBar/SideNav for section switching.

## Page Layout

6 types:

| Type | Usage |
|------|-------|
| Collection (Table/List) | Article list, user list |
| Single (1-Column) | Detail page, settings |
| Single (2-Column) | Profile, dashboard |
| Single (Custom View) | Map, chart |
| Side Navigation + Content | Settings, documentation |
| Collection + Single | Email, chat |

Include lead text so users quickly understand the page purpose. Manage page length with disclosure widgets, TabBar, or reduced density.

## Mobile Layout

| Aspect | Mobile Approach |
|--------|----------------|
| Columns | Single column |
| Scrolling | Vertical only |
| Information | Selected info only |
| Operations | Simple operations |

```tsx
const { isMobile } = useEnvironment();
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">{/* Cards */}</div>
```

## Feedback

Core: passive recognition, proximity display, screen reader support.

```tsx
// Validation
<FormControl error={!!errors.email}>
  <Input {...register("email")} />
  {errors.email && <ErrorMessage>{errors.email.message}</ErrorMessage>}
</FormControl>

// Processing state
<Button loading={isSubmitting}>{isSubmitting ? "Submitting..." : "Submit"}</Button>

// Completion
<ResponseMessage status="success">Saved successfully</ResponseMessage>
```

## Modal UI

| Pattern | Component | When |
|---------|-----------|------|
| Modal dialog | Dialog | Small-medium forms |
| Full-page | FloatArea | Large information |
| Drawer | Drawer | Maintain context |
| Step-based | StepFormDialog | Multi-step operations |

**Avoid disabling submit buttons** -- let users press the button, then show error feedback.

## Wizard

Use only for: complex multi-step operations, conditional branching, confirmation with parameters.

Always show progress (current step / total steps). Avoid overuse -- it restricts user behavior.

## Permission-Based Display

| Pattern | Behavior |
|---------|----------|
| A | Hide UI, hide reason |
| B | Hide UI, show reason |
| C | Disable UI, show reason (via Tooltip/disabledReason) |
| D | Show and enable |

## References

- [Design Principles](./design-principles.md)
- [Accessibility Guidelines](./accessibility.md)
- [Styling](../web-frontend/styling.md)
