# End-to-End Type Safety

## Current State

### Type Flow Overview

```text
Go Backend (vspo-server)
  → Cloudflare Workers RPC (Service Binding)
    → Repository layer (TypeScript)
      → Domain types (Zod schemas)
        → UseCase layer
          → Astro Actions (Zod input schemas)
            → Astro Pages (Astro.getActionResult)
              → Astro Components (Props interfaces)
```

### Type Definition Inventory

| Layer | File | Type Mechanism | Issues |
|-------|------|---------------|--------|
| Domain | `channel-config.ts` | Zod schemas + `z.infer<>` | Good, follows Zod Schema First |
| Domain | `member-type.ts` | String literal union | Good |
| Domain | `guild.ts` | Zod schemas + `z.infer<>` | Good |
| Domain | `discord-user.ts` | Zod schemas + `z.infer<>` | Good |
| Domain | `creator.ts` | Zod schemas + `z.infer<>` | Good |
| Repository | `vspo-channel-api.ts` | Returns `Result<T, AppError>` | RPC response typed via `parseResult()` |
| Repository | `vspo-guild-api.ts` | Returns `Result<T, AppError>` | RPC response typed via `parseResult()` |
| Repository | `discord-api.ts` | Returns `Result<T, AppError>` | External API response parsed |
| UseCase | `add-channel.ts` | Pass-through Result types | Thin, types preserved |
| UseCase | `list-guilds.ts` | Assembles `GuildSummary` | Multiple results combined |
| Actions | `index.ts` | Zod input + `unwrapOrThrow` | Input is validated, output loses type info |
| Pages | `[guildId].astro` | `Astro.getActionResult()` | Action result types available |
| Components | Various `.astro` | `interface Props` | Manual prop types |

### `parseResult` Pattern

```typescript
// features/shared/lib/parse.ts
export const parseResult = <T>(
  schema: z.ZodType<T>,
  raw: unknown,
): Result<T, AppError> => {
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return Err(new AppError("BAD_REQUEST", parsed.error.message));
  }
  return Ok(parsed.data);
};
```

This is the key boundary where untyped RPC responses are validated into typed domain objects.

## Issue 1: RPC Response Types Are Untyped

### Problem

The Cloudflare Workers RPC Service Binding (`env.APP_WORKER`) returns untyped responses. The repository layer receives `unknown` and must parse:

```typescript
// Example from vspo-channel-api.ts
const raw = await env.APP_WORKER.getChannelConfigs(guildId);
const result = parseResult(ChannelConfigArraySchema, raw);
```

The `raw` value is `unknown` — if the Go backend changes its response shape, this only fails at runtime, not at compile time.

### Root Cause

Cloudflare Workers RPC does not have a shared type definition between the Go backend and the TypeScript frontend. The type boundary is enforced purely by Zod schemas in the repository layer.

### Proposed: Shared Schema Validation

While true end-to-end type safety with Go requires code generation (e.g., protobuf, OpenAPI), the current Zod validation approach is pragmatic. Improvements:

1. **Strict Zod schemas**: Ensure schemas match the Go backend's response exactly. Use `.strict()` to reject unknown fields:

```typescript
const ChannelConfigSchema = z.object({
  channelId: z.string(),
  guildId: z.string(),
  memberType: z.string(),
  // ...
}).strict(); // Rejects unexpected fields
```

2. **Schema version tests**: Write tests that validate sample RPC responses against schemas:

```typescript
// features/channel/domain/channel-config.test.ts
describe("ChannelConfigSchema", () => {
  it("accepts a valid RPC response", () => {
    const sampleResponse = {
      channelId: "123456789012345678",
      guildId: "987654321098765432",
      memberType: "all",
      // ... all fields from Go backend
    };
    expect(ChannelConfigSchema.safeParse(sampleResponse).success).toBe(true);
  });

  it("rejects unknown fields with .strict()", () => {
    const withExtra = { ...validResponse, unknownField: "test" };
    expect(ChannelConfigSchema.strict().safeParse(withExtra).success).toBe(false);
  });
});
```

## Issue 2: `as` Type Assertions

### Problem

Type assertions (`as`) bypass TypeScript's type checking. They indicate places where type information is lost or inferred incorrectly.

### Specific Locations

| File | Line | Pattern | Risk |
|------|------|---------|------|
| `actions/index.ts` | 26 | `result.val as T` | Low — guarded by `err` check above |
| `middleware.ts` | 63 | `(env as Record<string, unknown>).DEV_MOCK_AUTH` | Medium — unsafe env access |
| `features/shared/dev-mock.ts` | 19 | `(env as Record<string, unknown>).DEV_MOCK_AUTH` | Medium — unsafe env access |
| `features/auth/repository/discord-api.ts` | 9 | `(env as unknown as Record<string, unknown>).DEV_MOCK_AUTH` | Medium — double cast |
| `features/shared/components/dialog-helpers.ts` | 8 | `document.getElementById(dialogId) as HTMLDialogElement \| null` | Low — properly narrowed |
| `features/auth/usecase/login.test.ts` | 125 | `id: 123 as unknown as string` | Low — test data only |
| `features/channel/repository/vspo-channel-api.ts` | 208-209 | `as const` string literals | Low — type narrowing |

### Proposed Fixes

1. **`unwrapOrThrow` assertion**: This is acceptable — the Result type's discriminated union narrows `val` to `T` after checking `err`, but TypeScript may not infer it. The assertion is safe here.

2. **DOM query assertions**: Replace with type-safe patterns:

```typescript
// Before
const el = document.querySelector("#foo") as HTMLButtonElement;
el.disabled = true;

// After
const el = document.querySelector<HTMLButtonElement>("#foo");
if (el) {
  el.disabled = true;
}
```

After React migration, DOM queries will be replaced by refs, eliminating this class of assertion entirely.

## Issue 3: Action Input/Output Type Safety

### Current State

Action inputs use Zod schemas (good). But action outputs lose type information:

```typescript
// actions/index.ts
addChannel: defineAction({
  input: z.object({
    guildId: z.string(),
    channelId: z.string(),
  }),
  handler: async (input, context) => {
    // ...
    return { success: true as const };
  },
}),
```

### Issue

The `as const` assertion on `true` is needed to narrow the return type from `boolean` to `true`. Without it, `result.data?.success` would be `boolean | undefined` instead of `true | undefined`.

### Proposed: Typed Action Results

Define result types explicitly for complex actions:

```typescript
const AddChannelResultSchema = z.object({
  success: z.literal(true),
});

type AddChannelResult = z.infer<typeof AddChannelResultSchema>;
```

For simple success/failure actions, the current `{ success: true as const }` pattern is adequate.

## Issue 4: Component Props Type Consistency

### Current State

Astro components use `interface Props` while React components use inline type annotations or separate interfaces. There's no consistent pattern:

```astro
---
// Astro: interface Props
interface Props {
  variant?: "primary" | "secondary";
  size?: "sm" | "md" | "lg";
}
---
```

```tsx
// React: inline props
export const ThemeToggle = () => { ... }
// No props currently, but future components will need them
```

### Specific Issue: `ChannelConfigForm.astro`

At line 12, `ChannelConfigForm.astro` receives channel data as an inline object shape (`{ channelId, channelName, language, memberType, customMembers }`) instead of importing and using the `ChannelConfig` domain type. This creates a maintenance burden: if the domain type changes, the component props must be updated separately.

### Proposed Convention

1. **Astro components**: Use `interface Props` in frontmatter (Astro convention), import domain types where applicable
2. **React components**: Use Zod Schema First for complex props, inline types for simple:

```tsx
// Simple props: inline type
interface Props {
  label: string;
  onClick: () => void;
}

// Complex props with validation: Zod schema
const ChannelFormPropsSchema = z.object({
  guildId: z.string(),
  channels: z.array(ChannelConfigSchema),
  locale: z.enum(["ja", "en"]),
});

type ChannelFormProps = z.infer<typeof ChannelFormPropsSchema>;
```

## Issue 5: Locale Type Safety

### Current State

The locale is passed through the system as a string:

```typescript
// middleware.ts
locals.locale = locale; // string

// Pages
const locale = Astro.currentLocale ?? "ja"; // string

// dict.ts
export const t = (locale: string, key: string): string => { ... }
```

### Problem

The locale value is always `"ja"` or `"en"`, but it's typed as `string` everywhere. This means:

1. `t("invalid-locale", "key")` compiles without error
2. No autocomplete for valid locales
3. Typos are not caught at compile time

### Proposed: Locale Union Type

```typescript
// i18n/types.ts
export type Locale = "ja" | "en";

export const isLocale = (value: unknown): value is Locale =>
  value === "ja" || value === "en";

// Or with Zod
export const LocaleSchema = z.enum(["ja", "en"]);
export type Locale = z.infer<typeof LocaleSchema>;
```

Update all usages:

```typescript
// dict.ts
export const t = (locale: Locale, key: string): string => { ... }

// middleware.ts
const locale: Locale = isLocale(rawLocale) ? rawLocale : "ja";
```

## Issue 6: `any` Types in the Codebase

### Action Items

Search for and eliminate `any` types:

```bash
grep -rn ": any\b\|as any\b\|<any>" src/ --include="*.ts" --include="*.tsx"
```

Common fixes:

| Pattern | Fix |
|---------|-----|
| `catch (error: any)` | `catch (error: unknown)` + type narrowing |
| `JSON.parse(str) as any` | Parse with Zod schema |
| `event: any` | Use specific event type from DOM/Astro |
| `Record<string, any>` | Use `Record<string, unknown>` or specific type |

## Issue 7: Missing Discriminated Union for Action Results

### Current State

In `[guildId].astro`, multiple action results are checked independently:

```typescript
const addResult = Astro.getActionResult(actions.addChannel);
const updateResult = Astro.getActionResult(actions.updateChannel);
const deleteResult = Astro.getActionResult(actions.deleteChannel);
const resetResult = Astro.getActionResult(actions.resetChannel);
```

Each result is `{ data?: T; error?: ActionError } | undefined`. The page must check all four independently.

### Proposed: Unified Action Result Helper

```typescript
// lib/action-result.ts
import type { ActionError } from "astro:actions";

type ActionResultEntry<T> = {
  type: string;
  result: { data?: T; error?: ActionError } | undefined;
};

export const findCompletedAction = <T>(
  entries: ActionResultEntry<T>[],
): { type: string; data?: T; error?: ActionError } | null => {
  const completed = entries.find(
    (e) => e.result?.data !== undefined || e.result?.error !== undefined,
  );
  if (!completed?.result) return null;
  return {
    type: completed.type,
    data: completed.result.data,
    error: completed.result.error,
  };
};
```

## Issue 7: Not Using `ComponentProps` for Wrapper Components

### Problem

When wrapping or extending existing Astro components, the wrapper must manually redeclare all prop types. If the inner component's props change, the wrapper's types become stale.

### Proposed: Use `ComponentProps` Utility Type

Astro provides `ComponentProps` from `astro/types` to extract a component's props type:

```astro
---
import type { ComponentProps } from "astro/types";
import Button from "./Button.astro";

// Extract Button's Props — no need to redeclare
type ButtonProps = ComponentProps<typeof Button>;

interface Props extends ButtonProps {
  icon?: string; // Add wrapper-specific props
}

const { icon, ...buttonProps } = Astro.props;
---
<div class="icon-button">
  {icon && <span class="icon">{icon}</span>}
  <Button {...buttonProps} />
</div>
```

### Benefits

- Props stay in sync automatically when the inner component changes
- Works even when the inner component doesn't export its `Props` interface
- Enables safe component composition without manual type maintenance

## Migration Checklist

- [ ] Add `.strict()` to Zod schemas for RPC response validation
- [ ] Write schema validation tests with sample RPC responses
- [ ] Replace `as HTMLElement` DOM assertions with `querySelector<T>` + null checks
- [ ] Create `Locale` union type and replace `string` locale types
- [ ] Search for and eliminate `any` types
- [ ] Add typed action result helper for multi-action pages
- [ ] Document type flow from RPC → Domain → Action → Page
- [ ] Evaluate shared schema generation (OpenAPI/protobuf) for Go ↔ TypeScript boundary
- [ ] Use `ComponentProps<typeof Component>` for wrapper components instead of manual prop redeclaration
