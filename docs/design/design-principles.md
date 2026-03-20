# Design Principles

## Overview

Design principles are the foundation for providing consistent, excellent user experiences. This guideline defines a 22-item checklist centered on usability.

## Usability Checklist

### Information Architecture (Items 1-5)

Items related to understanding user tasks and information structure.

| # | Check Item | Description |
|---|-----------|-------------|
| 1 | Explain understanding of user tasks | Have you clearly understood and reflected in the design what tasks users perform? |
| 2 | Explain the conceptual model | Are you communicating the system's structure and behavior to users in an understandable way? |
| 3 | Are the properties and actions associated with objects sufficient for user task completion? | Are the necessary information and operations available? |
| 4 | Explain view navigation relationships | Are screen transitions logical and predictable? |
| 5 | Is main navigation organized according to user interests? | Does the navigation structure align with the user's mental model? |

### Design Patterns (Items 6-16)

Items related to visual design and interaction.

| # | Check Item | Related Guidelines |
|---|-----------|-------------------|
| 6 | Does it follow "Eye Flow Guidance" standards? | [Design Patterns - Eye Flow Guidance](./design-patterns.md#eye-flow-guidance) |
| 7 | Does it follow "Visual Grouping" standards? | [Design Patterns - Visual Grouping](./design-patterns.md#visual-grouping) |
| 8 | Does it follow "Page Layout" standards? | [Design Patterns - Page Layout](./design-patterns.md#page-layout) |
| 9 | Does it follow "Spacing" standards? | [Styling](../web-frontend/styling.md) |
| 10 | Does it follow "Mobile Layout" standards? | [Design Patterns - Mobile Layout](./design-patterns.md#mobile-layout) |
| 11 | Does user notification/feedback follow "Feedback" standards? | [Design Patterns - Feedback](./design-patterns.md#feedback) |
| 12 | For modal UIs, does it follow "Modal UI" standards? | [Design Patterns - Modal UI](./design-patterns.md#modal-ui) |
| 13 | For tables, does it follow appropriate standards? | Data table design principles |
| 14 | Do input elements follow "Default Values" standards? | Setting appropriate default values |
| 15 | Have error states been considered with feedback to help users recover from errors? | [Content Guidelines - Error Messages](./content-guidelines.md) |
| 16 | Is there a confirmation step before dangerous or irreversible actions including deletion? | Display confirmation dialogs |

### Components (Items 17-18)

Items related to UI component usage.

| # | Check Item | Description |
|---|-----------|-------------|
| 17 | Are there custom components that duplicate existing UI library components? | Utilize existing components and avoid custom implementations |
| 18 | Are components being used according to their intended standards? | Follow the design intent of each component |

### Writing (Items 19-21)

Items related to text content.

| # | Check Item | Related Guidelines |
|---|-----------|-------------------|
| 19 | Are names consistent with core concepts? | [Writing Guidelines](./writing.md) |
| 20 | Do navigation flows and action names follow standards? | Unify button labels and link text |
| 21 | Do error messages follow standards? | [Content Guidelines](./content-guidelines.md) |

### Accessibility (Item 22)

| # | Check Item | Related Guidelines |
|---|-----------|-------------------|
| 22 | Has the accessibility quick checklist been used for verification? | [Accessibility Guidelines](./accessibility.md) |

## Item Details

### 1. Understanding User Tasks

Clarify the following before design:

- Who are the users (personas)
- What problems are they trying to solve
- In what context will they use it
- What constitutes success

### 2. Conceptual Model

Design the mental model for users to understand the system:

- What are the main "objects" in the system
- What are the relationships between objects
- What operations are possible

### 6. Eye Flow Guidance

Design the flow of the user's gaze:

- F-pattern (screens with vertically stacked information)
- Z-pattern (first-visit screens or screens with little scrolling)
- Eye movement from large elements to small elements

### 15. Error State Consideration

When errors occur:

1. **Event**: Explain what happened
2. **Cause**: Explain why it happened
3. **Resolution**: Explain how to resolve it

### 16. Confirmation Step

Display a confirmation dialog before dangerous actions:

```tsx
// Delete confirmation example
<Dialog>
  <DialogTitle>Delete this article?</DialogTitle>
  <DialogDescription>
    This action cannot be undone. The article "{title}" will be permanently deleted.
  </DialogDescription>
  <DialogActions>
    <Button variant="ghost" onClick={onCancel}>Cancel</Button>
    <Button variant="destructive" onClick={onConfirm}>Delete</Button>
  </DialogActions>
</Dialog>
```

## When to Use the Checklist

| Timing | Purpose |
|--------|---------|
| At design start | Confirm design direction |
| At design completion | Check for omissions |
| During review | Ensure quality |
| Before release | Final verification |

## References

- [Design Patterns](./design-patterns.md)
- [Accessibility Checklist](./accessibility.md)
- [Content Guidelines](./content-guidelines.md)
- [Design Review](./design-review.md)
