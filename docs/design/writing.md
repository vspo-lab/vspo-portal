# Writing Guidelines

## Overview

Writing clear text is an important element for improving the user experience. This guideline establishes principles and rules for creating consistent, readable, and understandable text.

## 3 Core Principles

### 1. Select Information Based on Purpose

Carefully choose what to express and how to express it, considering the reader's context (reading situation, prior knowledge, etc.).

| Point to Consider | Example |
|-------------------|---------|
| Reader's knowledge level | Whether to use technical terms or simpler language |
| Reading context | Whether they are reading in a hurry or at leisure |
| Desired information | Whether they want just an overview or full details |

### 2. Choose Appropriate Words

Select words carefully while being mindful of the impression the reader receives.

- Prioritize positive expressions
- Avoid ambiguous expressions
- Use words familiar to the reader

### 3. Use Correct Grammar

Be mindful of the elements that compose sentences and use proper grammar.

- Subject-predicate agreement
- Modifier placement
- Appropriate use of particles

## Practical Rules

### Keep sentences around 50 characters

Long sentences are hard to read and understand. Aim for approximately 50 characters per sentence.

```
NG: By using this feature, users will be able to change
    notification reception settings from their own account
    settings screen. (too long)

OK: This feature lets you change notification settings from account settings. (concise)
```

### Clarify subjects and particles

Make subjects clear and do not omit particles.

```
NG: Data deleted.
OK: The data has been deleted.

NG: Can change settings.
OK: You can change the settings.
```

### Use punctuation appropriately

Place commas at meaningful chunk boundaries. However, avoid excessive commas that fragment the text.

```
NG: Tomorrow, I will, have a meeting, with Mr. Tanaka, in the conference room.
OK: Tomorrow, I will have a meeting with Mr. Tanaka in the conference room.
```

### Avoid double negatives

Double negatives are difficult to understand; prioritize affirmative sentences.

```
NG: You cannot complete without entering.
OK: You can complete by entering.

NG: It is not the case that you will not be notified unless you configure.
OK: You will be notified even without configuration.
```

### Maintain consistent notation

Use standard characters as the baseline and unify notation within the project.

| Category | Rule |
|----------|------|
| Characters | Use standard character sets as the baseline |
| Numbers | Half-width digits, commas every 3 digits (e.g., 100,000) |
| Symbols | Use full-width characters (punctuation, parentheses, etc.) |
| Units | No space between numbers and units (e.g., 10px) |

## Writing Documents (Markdown)

Apply the same quality standards to technical documents in `docs/`, not just UI text.

### Heading Design

- Use only one `#` per file
- Use `##` for sections, and `###` as needed as the standard
- Use heading names that convey the content at a glance

### State the Purpose at the Beginning

Write 1-2 sentences at the start of the document about "what this document defines."
Create a state where the reader can immediately judge whether the information is relevant.

### Distinguish Between Bullet Lists and Numbered Steps

- Use numbered lists for sequential explanations
- Use bullet lists for non-sequential explanations
- Follow the rule of one message per item

### Code Block Principles

- Include code in executable units
- Specify the language: `bash`, `ts`, `json`, etc.
- Write prerequisites immediately before the code block

### Link Management

- Use relative paths for within-repository references
- Use link text that indicates the destination instead of "here" or "click here"
- Prioritize primary sources (official documentation) as specification references

### Combined Use with textlint

Text quality is ensured through a combination of human review and `textlint`.
See [docs/security/textlint.md](../security/textlint.md) for detailed operational policies.

## 5 Writing Goals

### 1. Consistency

Use unified expressions to prevent notation variations across screens.

```
NG: "Save" on screen A, "Save changes" on screen B
OK: Use "Save" consistently across all screens
```

### 2. Cohesion

Unify the language used across the entire product so users do not feel inconsistencies between screens.

### 3. Searchability

Structure content so users can easily find the information they need, and use familiar language.

- Prioritize commonly used terminology
- Include keywords that are likely to be searched

### 4. Standardization

By publishing the rationale behind word choices, maintain consistent quality regardless of individual skill or preference.

### 5. Efficiency

Utilize writing patterns and examples to enable smooth decision-making for choosing the right words.

## UI Text Rules

### Button Labels

| Type | Format | Example |
|------|--------|---------|
| Action button | End with a verb | Save, Delete |
| Confirmation button | Noun or verb | OK, Cancel, Close |
| Navigation | Noun | Home, Settings |

### Error Messages

See [Content Guidelines](./content-guidelines.md).

### Placeholders

```
NG: Please enter
OK: e.g., John Smith
```

### Labels

```
NG: Enter your name:
OK: Name
```

## Prohibited Practices

- Using machine translations as-is
- Using specialized terms without explanation
- Overuse of honorifics (overly polite expressions)
- Using imperative forms (except for user instructions)
- Excessive use of "etc." or "and so on"

## References

- [Content Guidelines](./content-guidelines.md)
- [Accessibility Guidelines](./accessibility.md)
