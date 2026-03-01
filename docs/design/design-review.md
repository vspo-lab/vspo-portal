# Design Review

## Overview

Design review is a critical process for ensuring product quality. This guideline defines two types of review processes: Information Architecture Review and UI Review.

## Information Architecture Review

A review that examines whether the product's information structure is appropriate.

### Scope

| Target | Description |
|--------|-------------|
| New application development | Newly developed applications |
| Large-scale feature development | Significant feature additions to existing products |

### Timing

Conducted when the broad design is finalized and ready to be shared with the development team.

### Required Materials

| Material | Description |
|----------|-------------|
| Information architecture deliverables | IA diagrams, site maps, flow charts, etc. |
| Screen layouts | Design files or screen captures |

### Participant Roles

| Role | Assigned To | Responsibility |
|------|-------------|----------------|
| Reviewee | Assigned designer | Accountable for explaining design decisions |
| Support | Development team (optional) | Support the reviewee |
| Facilitator | Facilitator | Manage proceedings and organize discussion |
| Reviewer | Other participants | Provide feedback |

### Evaluation Criteria

Evaluation is performed on a 4-level scale.

| Rating | Description | Next Action |
|--------|-------------|-------------|
| Good | No issues | Proceed as-is |
| Minor issues | Small improvements needed | Fix, no re-review required |
| Clear issues | Clear problems exist | Fix/redesign, then re-review |
| Fundamental issues | Design revision needed | Restart from design phase |

### Expected Feedback

| Perspective | Examples |
|-------------|----------|
| Any concerns with the information architecture deliverables? | Object definitions, screen transitions, navigation structure |
| Any discrepancies between screens and information architecture? | Alignment between design intent and screen representation |

**Note**: Details such as spacing and component selection are addressed in the UI Review.

### Review Process

1. **Preparation**: Reviewee shares materials (at least 2 business days before the review)
2. **Presentation**: Reviewee explains the information architecture intent (15 min)
3. **Q&A**: Answer questions from reviewers (20 min)
4. **Feedback**: Reviewers provide feedback (15 min)
5. **Summary**: Determine evaluation and confirm next actions (10 min)

## UI Review

A review of the product design's concrete surface-level aspects.

### Scope

| Target | Description |
|--------|-------------|
| New application development | Newly developed applications |
| Medium to large-scale feature development | Feature additions to existing products |

### Timing

| Development Type | Timing |
|-----------------|--------|
| New development | After information architecture review is complete |
| Medium-scale development | At the assigned designer's preferred timing |

### Participants

| Role | Number |
|------|--------|
| Assigned designer (reviewee) | 1 |
| Reviewer | 1 (randomly assigned) |

### Review Format

**Asynchronous review** is the standard approach.

1. Reviewee shares the design file
2. Reviewer provides feedback via comments
3. Reviewee responds and makes corrections

### Expected Feedback

Feedback should be provided in the following format:

| Element | Description |
|---------|-------------|
| Checklist number | Checklist number from [Design Principles](./design-principles.md) |
| Target | Specific screen/element |
| Issue | Problem description and improvement suggestion |

#### Feedback Example

```
[#7 Visual Grouping]
Settings screen, "Notification Settings" section

Issue: The whitespace between "Email Notifications" and "Push Notifications"
      is too narrow, making them appear to be in the same group.

Suggestion: Increase the spacing between sections from 24px to 40px
           to clarify group boundaries.
```

### Review Goal

The ideal is **one round-trip of communication**: receiving feedback and responding to judgments outside the checklist.

### Using the Checklist

The UI Review utilizes the 22-item checklist from [Design Principles](./design-principles.md).

Particularly important items:

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

## Review Process Flow

```
+----------------------------------------------------------+
|                    For New Development                     |
+----------------------------------------------------------+
|  Design Start                                             |
|      |                                                    |
|  Create Information Architecture Deliverables             |
|      |                                                    |
|  [Information Architecture Review] <-- Re-review if       |
|      |                                 rated "Clear        |
|      |                                 issues" or above   |
|      |                                                    |
|  Create UI Design                                         |
|      |                                                    |
|  [UI Review] <----------------------- Correct and         |
|      |                                 re-confirm as       |
|      |                                 needed              |
|  Start Development                                        |
+----------------------------------------------------------+
```

## Review Request Templates

### Information Architecture Review Request

```markdown
## Information Architecture Review Request

### Project Name
[Project name]

### Overview
[Brief description of the project]

### Material Links
- Information Architecture: [Link]
- Screen Layouts: [Link]

### Preferred Date
[List candidate dates]

### Points to Focus On
- [Focus point 1]
- [Focus point 2]
```

### UI Review Request

```markdown
## UI Review Request

### Target Screens
[List of target screens]

### Design File
[Link to Figma, etc.]

### Background / Context
[Design background and constraints]

### Points to Focus On
- [Focus point 1]
- [Focus point 2]
```

## References

- [Design Principles](./design-principles.md)
- [Design Patterns](./design-patterns.md)
- [Accessibility Checklist](./accessibility.md)
