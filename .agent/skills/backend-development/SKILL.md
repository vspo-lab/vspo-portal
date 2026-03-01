---
name: Backend Development
description: "Next.js 15 + Cloudflare Workers + @vspo-lab/api client. Result-type error handling, OpenAPI-generated client, feature-based architecture."
---

# Trigger

- When creating or editing files related to API client usage, data fetching, or server-side logic
- When adding new API integrations or modifying data flow patterns
- When working with `packages/api/`, `packages/errors/`, `packages/dayjs/`, or `packages/logging/`

# Execution Checklist

1. Use `@vspo-lab/api` (`VSPOApi`) for all external API calls
2. Handle all results with `Result<T, AppError>` — no try-catch
3. Add JSDoc with preconditions and postconditions to public functions
4. Define types with Zod Schema First (`z.infer<typeof schema>`)
5. Use `@vspo-lab/dayjs` for all date/time operations — no raw `Date`

# Reference Documents

- `docs/backend/server-architecture.md` - Next.js 15 on Cloudflare Workers, VSPOApi client, Result type, mock system
- `docs/backend/function-documentation.md` - JSDoc conventions (preconditions, postconditions)
- `docs/backend/pr-guidelines.md` - PR guidelines (current state, problem, implementation)
- `docs/backend/datetime-handling.md` - UTC-first date handling with @vspo-lab/dayjs
