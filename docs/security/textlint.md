# textlint Operational Guide

## Purpose

`textlint` is a tool for mechanically detecting inconsistent terminology and hard-to-read text in documentation.
In this template, it is used to maintain readability and maintainability of `docs/`.

## Operational Policy

1. Text quality is ensured by both `textlint` and manual review
2. `textlint` is limited to items where mechanical detection excels
3. Domain-specific expressions are given final judgment in review

## Check Targets

- `docs/**/*.md`
- `README.md`

## Rule Design Philosophy

Introducing overly strict rules from the start increases correction costs.
Strengthen rules incrementally in the following order:

1. Terminology inconsistency and typo detection (initial adoption)
2. Readability (sentence length, verbose expressions)
3. Project-specific dictionary (terminology standardization)

## Project Configuration

Dependencies:

```json
"textlint": "^15.x",
"textlint-rule-preset-ja-technical-writing": "^12.x",
"@textlint/textlint-plugin-markdown": "^15.x"
```

Configuration files:

- `.textlintrc.json`
- `.textlintignore`

`package.json` scripts:

```json
{
  "scripts": {
    "textlint": "textlint \"{README.md,docs/**/*.md}\"",
    "textlint:fix": "textlint --fix \"{README.md,docs/**/*.md}\""
  }
}
```

## How to Run

```bash
pnpm textlint
pnpm textlint:fix
```

## Initial Adoption Operations

To avoid bulk-fixing existing documentation, some rules are disabled in the initial configuration.
These are documented in `.textlintrc.json` and will be incrementally enabled as existing documents are cleaned up.

## Points to Check in PR Reviews

1. The same type of issue is not recurring in new text
2. Rule disabling (`textlint-disable`) has a documented reason
3. The fix does not change the intended meaning
