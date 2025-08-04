# VSPO Portal Project Overview

## Project Purpose
VSPO Portal is a VTuber content management system focused on VSPO (Virtual eSports Project) members. The main service is Spodule (https://www.vspo-schedule.com/schedule/all), a site where users can check streams (YouTube/Twitch/Twitcasting/Niconico) and clips of VSPO members.

## Tech Stack
- **Frontend**: Next.js 15 with TypeScript
  - Internationalization support (ja, en, ko, cn, tw)
  - PWA capabilities
  - Feature-based organization using container/presenter pattern
  - Deployed to Cloudflare Pages

- **Backend**: Cloudflare Workers API
  - Hono framework for routing
  - Domain-Driven Design (DDD) architecture
  - PostgreSQL with Drizzle ORM
  - Multiple entry points: gateway (public API), internal, cron jobs
  - OpenTelemetry for observability

- **AI Agent**: Content analysis service
  - Mastra framework
  - LangChain and OpenAI integration
  - Clip categorization and analysis

- **Build Tools**:
  - Turbo for monorepo build orchestration
  - pnpm as package manager (>=10.10.0)
  - Biome for linting and formatting (replaces ESLint/Prettier)
  - Vitest for testing
  - OpenAPI for API documentation and type generation
  - Docker for local PostgreSQL development

## Project Structure
```
vspo-portal/
├── service/
│   ├── vspo-schedule/v2/web/  # Frontend Next.js application
│   ├── server/                 # Backend Cloudflare Workers API
│   └── agent/                  # AI content analysis service
├── packages/
│   ├── api/                    # Generated TypeScript API client from OpenAPI specs
│   ├── errors/                 # Centralized error handling
│   ├── logging/                # Structured logging utilities
│   └── dayjs/                  # Date/time utilities
├── e2e/                        # End-to-end tests
└── .devcontainer/              # Development container configuration
```

## Key Architectural Patterns
1. **Type Safety**: Extensive TypeScript usage with generated API types
2. **Edge Computing**: Services deployed on Cloudflare Workers
3. **Event-Driven**: Queue-based processing for async tasks
4. **Multi-Platform Support**: Integrates YouTube, Twitch, Twitcasting, Niconico
5. **Feature Organization**: Frontend features are self-contained modules
6. **DDD Backend**: Clear separation between domain, infrastructure, and use cases

## Development Requirements
- Node.js: >=20.18.0
- pnpm: >=10.10.0
- TypeScript: ^5.8.3