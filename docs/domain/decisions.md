# Decisions

Architectural and specification decisions are recorded here in chronological order.

## Recording Rules

- One entry per decision.
- Each entry must include: **what**, **why**, **alternatives considered**, and **impact**.
- When a decision is revised, do not delete the original -- append an update.

---

## Decision Log

### D-001: Frontend-Only Repository (External API Backend)

- **Date**: 2026-03-01
- **Status**: Accepted
- **Decision**: vspo-portal is a frontend-only repository. All data comes from an external backend API (`@vspo-lab/api`).
- **Context**: The backend API for stream, clip, event, and creator data is maintained separately. This repository focuses solely on presentation and user experience.
- **Rationale**: Separation of concerns -- the backend handles data aggregation, normalization, and caching from multiple platforms, while the frontend focuses on rendering and user interaction. This allows independent deployment and scaling.
- **Alternatives Considered**: (1) Full-stack monorepo with embedded API -- rejected due to increased complexity and coupling. (2) BFF (Backend-for-Frontend) layer -- unnecessary given the external API already provides well-structured endpoints.
- **Impact**: All data access goes through `@vspo-lab/api`. No database, ORM, or server-side data mutations in this repo (except admin event creation via API).

---

### D-002: OpenAPI Client Generation via Orval

- **Date**: 2026-03-01
- **Status**: Accepted
- **Decision**: Use Orval to generate a type-safe API client from the backend's OpenAPI specification.
- **Context**: The external backend exposes an OpenAPI spec. Manual API client maintenance is error-prone and drifts from the actual API.
- **Rationale**: Code generation ensures the frontend client is always in sync with the backend API contract. Orval generates TypeScript types and request functions directly from the OpenAPI spec.
- **Alternatives Considered**: (1) Manual fetch wrappers -- rejected due to maintenance burden and type drift. (2) Other codegen tools (openapi-typescript, swagger-codegen) -- Orval was chosen for its TypeScript-first approach and React Query integration support.
- **Impact**: `@vspo-lab/api` package contains generated code. Regeneration is required when the backend API spec changes.

---

### D-003: Result<T, AppError> Error Handling (No try-catch)

- **Date**: 2026-03-01
- **Status**: Accepted
- **Decision**: Use the `Result` type pattern (`Ok`, `Err`, `AppError`) from `@vspo-lab/error` for all error handling. `try-catch` blocks are prohibited.
- **Context**: Unhandled exceptions and inconsistent error handling lead to poor user experience and difficult debugging.
- **Rationale**: The Result type makes error paths explicit in function signatures. Every function that can fail returns `Result<T, AppError>`, forcing callers to handle both success and failure cases. This eliminates silent failures and unhandled promise rejections.
- **Alternatives Considered**: (1) Standard try-catch with custom error classes -- rejected because error paths are invisible in type signatures. (2) neverthrow library -- similar concept but `@vspo-lab/error` is a lightweight custom implementation tailored to the project's needs.
- **Impact**: All async operations, API calls, and data transformations that can fail must return `Result<T, AppError>`. The `wrap` utility converts promise-based operations into Result-returning functions.

---

### D-004: Multi-Platform Stream Unification

- **Date**: 2026-03-01
- **Status**: Accepted
- **Decision**: Streams from YouTube, Twitch, Twitcasting, and Niconico are normalized into a single `Stream` entity shape.
- **Context**: VSPO! creators stream on multiple platforms. Each platform has different data formats, IDs, and metadata structures.
- **Rationale**: A unified Stream type allows the frontend to render content identically regardless of source platform. Platform-specific details (embed URLs, chat URLs) are abstracted into `videoPlayerLink` and `chatPlayerLink`. The `platform` field preserves the origin for display and filtering purposes.
- **Alternatives Considered**: (1) Platform-specific entity types (YouTubeStream, TwitchStream, etc.) -- rejected because it would require platform-specific rendering logic throughout the UI. (2) Union type approach -- rejected due to excessive type narrowing boilerplate in components.
- **Impact**: The `Stream` entity includes `platform` as a discriminator. Embed logic uses `videoPlayerLink`/`chatPlayerLink` which are pre-computed by the backend.

---

### D-005: Cloudflare Workers via OpenNext Adapter

- **Date**: 2026-03-01
- **Status**: Accepted
- **Decision**: Deploy the Next.js application to Cloudflare Workers using the OpenNext adapter.
- **Context**: The application needs edge deployment for global performance (users across 5+ locales). Cloudflare Workers provides edge computing with low latency worldwide.
- **Rationale**: Cloudflare Workers offers a globally distributed edge runtime. The OpenNext adapter bridges the gap between Next.js's Node.js-centric runtime and Cloudflare's V8 isolate environment, enabling SSR at the edge.
- **Alternatives Considered**: (1) Vercel -- natural fit for Next.js but vendor lock-in concerns and pricing. (2) AWS Lambda@Edge -- higher cold start latency and more complex infrastructure management. (3) Static export -- not viable because the app requires server-side rendering for dynamic schedule data.
- **Impact**: Runtime constraints of Cloudflare Workers must be respected (V8 isolates, no Node.js native modules, memory/CPU limits). Dependencies must be compatible with the Workers runtime.

---

### D-006: Mock System for Local Development (MockHandler)

- **Date**: 2026-03-01
- **Status**: Accepted
- **Decision**: Implement a MockHandler system that intercepts API calls during local development with realistic fixture data.
- **Context**: The external backend API may be unavailable during development, or developers may need deterministic data for testing UI states.
- **Rationale**: A mock system enables frontend development without backend dependency. MockHandler provides fixture data that matches the OpenAPI schema, allowing developers to work on UI features independently and test edge cases (empty states, error states, large datasets).
- **Alternatives Considered**: (1) Shared staging backend -- rejected because it requires network access and data is non-deterministic. (2) MSW (Mock Service Worker) -- viable alternative; MockHandler was chosen for its simplicity and tight integration with the existing `@vspo-lab/api` package.
- **Impact**: MockHandler must be kept in sync with the OpenAPI schema. Mock fixtures should cover representative data for all entity types and status combinations.

---

### D-007: UTC-First Datetime Handling (@vspo-lab/dayjs)

- **Date**: 2026-03-01
- **Status**: Accepted
- **Decision**: Store and transmit all datetime values in UTC (ISO 8601). Convert to the user's local timezone only at the presentation layer using `@vspo-lab/dayjs`.
- **Context**: Users span multiple timezones (JST, CST, KST, EST, etc.). Stream times must be displayed correctly regardless of the viewer's location.
- **Rationale**: UTC-first avoids timezone conversion bugs in data processing. The `@vspo-lab/dayjs` package wraps dayjs with timezone and locale plugins pre-configured, providing a consistent API for timezone conversion at render time. Users can override the display timezone (UC-009).
- **Alternatives Considered**: (1) Store in JST (most users are Japanese) -- rejected because it complicates display for non-JST users and introduces conversion errors. (2) Native `Intl.DateTimeFormat` only -- insufficient for timezone arithmetic and relative time display.
- **Impact**: All API responses use UTC timestamps. The frontend must never assume a specific timezone. All datetime formatting goes through `@vspo-lab/dayjs` utilities.
