# t_wada-style TDD Strategy

This document defines the minimal rules for practicing t_wada-based TDD in this template.

## Purpose

- Grow code that is resilient to change through small steps
- Add regression-prevention tests first when fixing bugs
- Draw out design decisions during test creation, not after implementation

## Core Principles

- Run Red-Green-Refactor in short cycles
- Verify only one behavior per test
- Create a test list first and fix the implementation order
- In Green, only add the minimal implementation; defer generalization
- Only refactor when tests are passing

## Implementation Patterns

### Start with Fake Implementation

- Start with a fake implementation such as returning a constant to achieve Green
- Confirm the failure with the next case addition and grow the implementation

### Generalize with Triangulation

- Converge toward an implementation that passes with two or more concrete examples
- Avoid abstracting too early

### Choose Obvious Implementation

- When the implementation is sufficiently clear, write the real implementation directly
- However, do not break the test-first approach

## Application Order in This Template

1. Domain models
2. Use cases
3. Hono endpoints
4. Critical frontend use cases

Use the table-driven tests from `docs/web-frontend/unit-testing.md` as the base format.

## How to Progress Through One Story

1. Pick the next item from the test list
2. Write a failing test (Red)
3. Pass it with the minimal implementation (Green)
4. Remove duplication and improve naming (Refactor)
5. Add the next case and triangulate if needed

## Bug Fix Flow

1. Add a failing test that reproduces the bug first
2. Apply the minimal fix to pass only that test
3. Add neighboring cases to reduce regression risk

## Operational Checklist

- Are test names readable as specifications?
- Is test data duplication organized with `it.each`?
- Are external dependencies mocked at the boundary while testing domain with real objects?
- Has the refactoring changed no behavior?

## References

- https://speakerdeck.com/twada/growing-reliable-code-php-conference-fukuoka-2025
