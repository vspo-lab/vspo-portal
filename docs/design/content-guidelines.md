# Content Guidelines

Guidelines for user-facing text: error messages, help pages, and release notes.

## Error Messages

Every error message should contain: **Cause** > **Resolution** > **Event** (in priority order).

| Element | Example |
|---------|---------|
| Event | "Could not save the article" |
| Cause | "The title has not been entered" |
| Resolution | "Please enter a title" |

### Patterns

| Type | Message |
|------|---------|
| Required field | "Please enter [field name]" |
| Format error | "The format of [field name] is incorrect" |
| Character limit | "Please enter [field name] within [N] characters" |
| Duplicate | "This [field name] is already in use" |
| Communication | "Communication failed. Please try again later" |
| Permission | "You do not have permission to perform this action" |
| Not found | "The page you are looking for was not found" |

**Prohibited**: Technical-only codes (`Error: 500`), blaming the user, vague "An error occurred" without resolution.

## Help Pages

5 types, matched to user intent:

| Type | Purpose |
|------|---------|
| Feature Overview | What the feature is (1-2 sentence overview + key features) |
| Step-by-Step | How to operate (prerequisites + numbered steps) |
| Specification List | Settings and limitations |
| FAQ | Answers to specific questions |
| Glossary | Term definitions |

## Release Notes

Describe **"how users can now use it"** not **"what changed."**

| Category | Example |
|----------|---------|
| New Features | "You can now export articles as CSV" |
| Improvements | "Search result display speed has improved" |
| Fixes | "Fixed an issue where images could not be uploaded under certain conditions" |

Each item: 1-2 sentences, user perspective, specific. Avoid vague "various improvements."

## Accessibility

- Error messages: consider screen reader readability
- Help pages: use proper heading structure for navigation
- Release notes: concise and clear for all users

## References

- [Writing Guidelines](./writing.md)
- [Accessibility Checklist](./accessibility.md)
- [Design Patterns - Feedback](./design-patterns.md#feedback)
