# Monorepo Structure

## Overview

pnpm workspaces + Turborepo monorepo. Two services consuming four shared packages.

```text
vspo-portal/
├── packages/                  # Shared libraries (@vspo-lab/*)
│   ├── api/                   # API client (Axios + Result type)
│   ├── dayjs/                 # UTC date utilities
│   ├── errors/                # Result type + AppError
│   └── logging/               # Structured async-context logger
├── service/
│   ├── vspo-schedule/v2/web/  # Next.js 16 frontend (Cloudflare Workers)
│   └── bot-dashboard/         # Astro 6 Discord bot management UI (Cloudflare Workers)
├── docs/                      # Technical documentation
├── scripts/                   # Post-edit checks, security scans
└── (root configs)             # Tooling configuration
```

## Packages

| Package | Purpose |
|---------|---------|
| `@vspo-lab/error` | Result type (`Ok`/`Err`/`wrap`) + `AppError` with error codes |
| `@vspo-lab/api` | Type-safe API client generated from OpenAPI spec via Orval |
| `@vspo-lab/dayjs` | UTC-first date utilities with locale/timezone mapping |
| `@vspo-lab/logging` | Structured async-context logger via `AsyncLocalStorage` |

See [Shared Packages](../packages/README.md) for API details and usage examples.

## Service: vspo-schedule/web

Next.js 16 application deployed to Cloudflare Workers via OpenNextJS. See [Frontend Architecture](../web-frontend/architecture.md) for the full tech stack and patterns.

## Service: bot-dashboard

Astro 6 server-rendered application for managing the Spodule Discord Bot. Deployed to Cloudflare Workers. Uses Clean Architecture (domain/repository/usecase), Tailwind CSS, and Zod-based type definitions. Minimal client-side JavaScript (inline scripts for theme toggle) — primarily server-side rendering. Authentication via Discord OAuth2. Form handling via Astro Actions. Custom i18n system (`dict.ts`) for ja/en localization. Light/dark mode support with CSS variables.

```text
service/bot-dashboard/
├── src/
│   ├── pages/           # File-based routing (SSR)
│   │   ├── index.astro  # Login page
│   │   ├── dashboard/   # Protected dashboard pages
│   │   ├── auth/        # OAuth endpoints (discord, callback, logout)
│   │   └── api/         # API routes (change-locale)
│   ├── layouts/         # Base + Dashboard layouts
│   ├── components/      # UI, auth, guild, channel components
│   ├── features/        # Clean Architecture (auth, guild, channel, shared)
│   ├── actions/         # Astro Actions (form handlers)
│   ├── i18n/            # Custom i18n (dict.ts)
│   ├── middleware.ts    # Session + auth middleware
│   └── app.css          # Tailwind CSS theme (light/dark)
├── astro.config.ts
└── wrangler.jsonc       # Cloudflare Workers config
```

## Root Tooling

| Tool | Config File | Purpose |
|------|-------------|---------|
| pnpm | `pnpm-workspace.yaml` | Workspace management, catalog versions |
| Turborepo | `turbo.json` | Build orchestration and caching |
| TypeScript | `tsconfig.base.json` | Shared compiler options (ESNext, strict) |
| Biome | `biome.json` / `biome.base.json` | Formatter + linter (replaces ESLint + Prettier) |
| Knip | `knip.json` | Unused code/dependency detection |
| Lefthook | `lefthook.yml` | Pre-commit hooks (tsc, biome, knip) |
| Renovate | `renovate.json` | Automated dependency updates |
| aqua | `aqua.yaml` | Dev tool version management (terraform, trivy, etc.) |
| textlint | `.textlintrc.json` | Markdown documentation linting |

### Key Scripts

```bash
pnpm build                   # Build all packages + services (via Turbo)
pnpm dev:vspo-schedule-web   # Dev server on port 4000
pnpm tsc                     # Type check across all workspaces
pnpm biome:check             # Format + lint check
pnpm knip                    # Detect unused exports/dependencies
pnpm generate-openapi        # Regenerate API types from OpenAPI spec
pnpm textlint                # Lint markdown docs
pnpm security-scan           # Run Trivy + gitleaks + Semgrep
# Test commands (per-service)
pnpm --filter vspo-schedule-v2-web test:coverage   # Run schedule tests with coverage
pnpm --filter bot-dashboard test:coverage           # Run bot-dashboard tests with coverage
```

### Post-Edit Check (`scripts/post-edit-check.sh`)

Runs automatically after Claude Code edits via hook:

1. `pnpm biome:check` - formatting and lint
2. `pnpm knip` - unused code detection
3. `pnpm tsc` - type checking
