# TypeScript Type System Usage Instructions

## Core Policy

1. Use Zod schemas as the Single Source of Truth for type definitions
2. Infer types from schemas instead of explicit interfaces
3. Use generics in utilities, keeping app code JavaScript-like
4. Ensure type flow through inference, avoiding redundant annotations
5. Limit `as` to library boundaries; do not use in app logic
6. Isolate unavoidable `as` usage in utils and leave a comment

## TypeScript Implementation

### Schema-First Development

- Define Zod schemas as the Single Source of Truth for data structures
- Infer TypeScript types from schemas with `z.infer<typeof schemaName>`
- When extending schemas, import the base schema and use `z.extend()` or union types
- Use schema composition for complex types

Example:

```typescript
// Base schema (Single Source of Truth)
const baseSchema = z.object({
  id: z.string(),
  createdAt: z.date()
});

// Extended schema
const extendedSchema = baseSchema.extend({
  additionalField: z.boolean()
});

// Inferred types
type Base = z.infer<typeof baseSchema>;
type Extended = z.infer<typeof extendedSchema>;
```

### Type Safety

- Enable `strict` in `tsconfig.json` to maximize type safety
- Use `Partial`, `Pick`, `Omit` for schema/type variations
- Use mapped types for dynamic transformations within libraries
- Isolate `as` in utils; do not use in app logic
- Use early returns with control flow analysis for type narrowing
- **Use `satisfies` for type-checking object literals** (see below)

### Type-Checking Object Literals with the `satisfies` Operator

When defining object literals, always use `satisfies` instead of type annotations (`: Type`). This prevents type widening while maintaining compile-time type checking.

**Why use `satisfies`:**

1. Validates object shape at compile time (detects missing or extra properties)
2. Preserves literal types (e.g., `"candidate"` does not widen to `string`)
3. Enables exhaustiveness checking for Discriminated Unions
4. Prevents field omission bugs in API response transformations

**Pattern: Use `satisfies` instead of type annotations**

```typescript
// ❌ BAD: Type annotation widens literal types
const turn: LiveTranscript = {
  role: "candidate",  // Type becomes string (not "candidate")
  text: "Hello"
};

// ✅ GOOD: satisfies preserves literal types
const turn = {
  role: "candidate",  // Type is "candidate" (literal)
  text: "Hello"
} satisfies LiveTranscript;
```

**Pattern: `satisfies` in function return values**

```typescript
// ❌ BAD: Missing properties not detected at definition site
function createProfile(): UserProfile {
  return {
    name: "John",
    // Missing 'email' - error appears at call site
  };
}

// ✅ GOOD: satisfies catches the error immediately
function createProfile(): UserProfile {
  return {
    name: "John",
    // error: Property 'email' is missing
  } satisfies UserProfile;
}
```

#### Pattern: Discriminated Unions

```typescript
// ✅ GOOD: satisfies preserves literal types, enabling discrimination
function processResult(success: boolean) {
  if (success) {
    return { isMerged: true, data: result } satisfies MergeResult;
  }
  return { isMerged: false, error: "Failed" } satisfies MergeResult;
}
```

#### Pattern: Configuration objects

```typescript
// ✅ GOOD: Validates config shape while preserving inference
const config = {
  apiEndpoint: "/api/v1",
  timeout: 5000,
  retries: 3,
} satisfies ApiConfig;
```

**When to use `satisfies`:**

- All object literal assignments: `const x = {...} satisfies Type`
- Return statements with object literals: `return {...} satisfies Type`
- Configuration objects and constants
- API response transformations
- Discriminated Union type objects

**When type annotations are appropriate:**

- Variable declarations without initial values: `let x: Type;`
- Function parameters: `function foo(x: Type)`
- Generic type parameters: `useState<Type>()`

### Schema Patterns

1. **Field Selection Pattern**:

```typescript
// Base schema
const dataSchema = z.object({ /* ... */ });

// Selection schema
const selectionSchema = z.object({
  field1: z.boolean().optional(),
  field2: z.union([z.boolean(), z.array(z.number())]).optional()
});

type Selection = z.infer<typeof selectionSchema>;
```

1. **Metadata Pattern**:

```typescript
const MetadataSchema = z.object({
  total: z.number(),
  results: z.array(z.object({
    status: z.enum(["success", "failed"]),
    data: z.any()
  }))
});

type Metadata = z.infer<typeof MetadataSchema>;
```

### Best Practices

1. Always import base schemas from their Single Source of Truth
2. Prefer schema composition over type composition
3. Leverage Zod's built-in validations
4. Include validation logic within schema definitions
5. Use Discriminated Unions for complex state handling

Complex pattern example:

```typescript
// Task result pattern
const TaskResultSchema = z.discriminatedUnion("ok", [
  z.object({
    ok: z.literal(true),
    data: z.any()
  }),
  z.object({
    ok: z.literal(false),
    error: z.object({
      code: z.string(),
      message: z.string()
    })
  })
]);

type TaskResult = z.infer<typeof TaskResultSchema>;
```
