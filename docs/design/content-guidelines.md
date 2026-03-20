# Content Guidelines

## Overview

Content guidelines provide direction for creating user-facing text content with consistency. This guideline defines how to write error messages, help pages, and release notes.

## Error Messages

### Purpose

The role of an error message is to **enable users to understand the problem and proceed to the next action** upon seeing the message.

### 3 Core Elements

| Element | Description | Example |
|---------|-------------|---------|
| Event | What happened (from the user's perspective) | "Could not save the article" |
| Cause | Why it happened | "The title has not been entered" |
| Resolution | How to resolve it | "Please enter a title" |

### Priority

When not all elements can be displayed, show them in the following priority order:

```
1. Cause -> 2. Resolution -> 3. Event
```

**Reason**: The user's top priority is "completing the action," so information about the resolution is most important.

### Implementation Examples

#### Full Message (when sufficient space is available)

```tsx
<ErrorMessage>
  <p>Could not save the article.</p>
  <p>The title has not been entered. Please enter a title.</p>
</ErrorMessage>
```

#### Concise Message (when space is limited)

```tsx
<ErrorMessage>
  Please enter a title
</ErrorMessage>
```

### Error Message Patterns

#### Input Errors

| Type | Message Example |
|------|-----------------|
| Required field empty | "Please enter [field name]" |
| Format error | "The format of [field name] is incorrect" |
| Character limit | "Please enter [field name] within [N] characters" |
| Duplicate error | "This [field name] is already in use" |

#### System Errors

| Type | Message Example |
|------|-----------------|
| Communication error | "Communication failed. Please try again later" |
| Permission error | "You do not have permission to perform this action" |
| Non-existent resource | "The page you are looking for was not found" |

### Prohibited Practices

- Displaying only technical error codes (e.g., `Error: 500`)
- Expressions that blame the user (e.g., "Input mistake")
- Vague expressions (e.g., only "An error occurred")
- Warnings without a resolution

## Help Pages

### 5 Types of Structure

Prepare 5 types of help pages tailored to what users "want to know."

| Type | Purpose | Content |
|------|---------|---------|
| Feature Overview | Explain what the feature is | Feature definition, design philosophy, capabilities |
| Step-by-Step Instructions | Explain how to operate | Step-by-step procedures, precautions |
| Specification List | Organize settings and limitations | Setting values, restrictions, supported formats |
| FAQ | Answer specific questions | Error resolution, specification questions, common questions |
| Glossary | Define specialized terms | App-specific terms, industry terms |

### Feature Overview Page Structure

```markdown
# Feature Name

## What You Can Do with This Feature
[Explain the feature overview in 1-2 sentences]

## Key Features
- [Feature 1]
- [Feature 2]
- [Feature 3]

## Related Features
- [Link to related feature]
```

### Step-by-Step Instructions Page Structure

```markdown
# How to [Action]

## Prerequisites
[Required settings or permissions beforehand]

## Steps
1. [Step 1]
2. [Step 2]
3. [Step 3]

## Notes
- [Note 1]
- [Note 2]

## Related Operations
- [Link to related operation]
```

### FAQ Page Structure

```markdown
# Frequently Asked Questions

## Category 1
### Q. [Question]
A. [Answer]

### Q. [Question]
A. [Answer]

## Category 2
### Q. [Question]
A. [Answer]
```

### Writing Considerations

- Consider the user's mental model
- Appropriately judge the necessary depth of information
- Eliminate unnecessary information (noise)
- Add explanations for specialized terms as needed

## Release Notes

### Purpose

Release notes are documents that communicate update content such as feature additions and bug fixes to users.

### Core Principle

Describe **"how users can now use it"** rather than **"what changed."**

| Approach | Example |
|----------|---------|
| NG: List feature changes | "Added filter functionality to notifications" |
| OK: Describe the user experience | "You can now filter notifications by type" |

### Structure

```markdown
# Release Notes

## YYYY-MM-DD

### New Features
- [What users can now do]
- [What users can now do]

### Improvements
- [What became more convenient]
- [What became more convenient]

### Fixes
- [Issue that was resolved]
- [Issue that was resolved]
```

### Categories

| Category | Description | Example |
|----------|-------------|---------|
| New Features | Newly added features | "You can now export articles as CSV" |
| Improvements | Enhancements to existing features | "Search result display speed has improved" |
| Fixes | Bug fixes | "Fixed an issue where images could not be uploaded under certain conditions" |

### Writing Tips

| Tip | Description |
|-----|-------------|
| Be specific | Rather than "improved," describe what improved and how |
| Write from the user's perspective | Focus on user impact, not technical changes |
| Be concise | 1-2 sentences per item |
| Use positive expressions | Prefer "you can now [action]" over "fixed issue where [action] failed" |

### Prohibited Practices

- Listing only technical changes
- Including internal changes unrelated to users
- Vague expressions (only "various improvements" or "performance enhancements")

## Accessibility-Related Writing

### Classification

Text related to user support is also important from an accessibility perspective.

| Target | Consideration |
|--------|---------------|
| Error messages | Consider that they will be read aloud by screen readers |
| Help pages | Set heading structure appropriately to facilitate navigation |
| Release notes | Write concise and clear sentences so all users can understand |

## References

- [Writing Guidelines](./writing.md)
- [Accessibility Checklist](./accessibility.md)
- [Design Patterns - Feedback](./design-patterns.md#feedback)
