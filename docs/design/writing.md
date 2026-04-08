# Writing Guidelines

Principles and rules for consistent, readable text in UI and documentation.

## 3 Core Principles

1. **Select information for the reader's context** -- consider knowledge level, reading situation, desired depth.
2. **Choose appropriate words** -- positive expressions, avoid ambiguity, use familiar terms.
3. **Use correct grammar** -- subject-predicate agreement, proper modifier placement.

## Practical Rules

| Rule | Bad | Good |
|------|-----|------|
| ~50 chars/sentence | "By using this feature, users will be able to change notification reception settings from their own account settings screen." | "Change notification settings from account settings." |
| Clarify subjects | "Data deleted." | "The data has been deleted." |
| No double negatives | "You cannot complete without entering." | "You can complete by entering." |
| Consistent notation | "Save" on A, "Save changes" on B | "Save" everywhere |

### Notation Standards

| Category | Rule |
|----------|------|
| Numbers | Half-width, commas every 3 digits (100,000) |
| Units | No space between number and unit (10px) |

## Markdown Documents

- One `#` per file, `##` for sections, `###` as needed
- State purpose in the first 1-2 sentences
- Numbered lists for sequential steps, bullets for non-sequential
- Code blocks in executable units with language specified
- Relative paths for internal links, descriptive link text
- See [textlint policy](../security/textlint.md) for automated checks

## UI Text

| Element | Rule | Example |
|---------|------|---------|
| Action button | End with verb | Save, Delete |
| Confirmation | Noun or verb | OK, Cancel |
| Navigation | Noun | Home, Settings |
| Placeholder | Show example | "e.g., John Smith" |
| Label | Noun only | "Name" (not "Enter your name:") |
| Error messages | See [Content Guidelines](./content-guidelines.md) | |

## Prohibited

- Machine translations without review
- Unexplained specialized terms
- Imperative forms (except user instructions)
- Excessive "etc." or "and so on"

## References

- [Content Guidelines](./content-guidelines.md)
- [Accessibility Guidelines](./accessibility.md)
