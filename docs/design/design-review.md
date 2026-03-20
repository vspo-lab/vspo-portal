# Design Review

Two review types: **Information Architecture (IA) Review** and **UI Review**.

## Information Architecture Review

**Scope**: New applications and large-scale feature development.
**Timing**: When broad design is finalized and ready to share with the dev team.

### Process

1. Reviewee shares IA deliverables + screen layouts (2+ business days before)
2. Presentation: explain IA intent (15 min)
3. Q&A (20 min)
4. Feedback (15 min)
5. Determine evaluation and next actions (10 min)

### Evaluation Scale

| Rating | Next Action |
|--------|-------------|
| Good | Proceed |
| Minor issues | Fix, no re-review |
| Clear issues | Fix/redesign, re-review |
| Fundamental issues | Restart design phase |

## UI Review

**Scope**: New applications and medium-to-large feature development.
**Format**: Asynchronous (1 reviewee + 1 reviewer).

### Process

1. Reviewee shares design file
2. Reviewer comments with: checklist #, target screen/element, issue + suggestion
3. Reviewee responds and corrects

Goal: **one round-trip** of communication.

### Key Checklist Items (from [Design Principles](./design-principles.md))

| # | Item |
|---|------|
| 6 | Eye Flow Guidance |
| 7 | Visual Grouping |
| 8 | Page Layout |
| 9 | Spacing |
| 10 | Mobile Layout |
| 11 | Feedback |
| 17 | Avoiding Custom Components |
| 21 | Error Messages |

### Feedback Format Example

```
[#7 Visual Grouping] Settings screen, "Notification Settings" section
Issue: Spacing between groups too narrow (24px).
Suggestion: Increase to 40px to clarify boundaries.
```

## Review Flow (New Development)

```
Design Start -> IA Deliverables -> [IA Review] -> UI Design -> [UI Review] -> Development
```

Re-review if IA rated "Clear issues" or above. UI corrections confirmed as needed.

## References

- [Design Principles](./design-principles.md)
- [Design Patterns](./design-patterns.md)
- [Accessibility Checklist](./accessibility.md)
