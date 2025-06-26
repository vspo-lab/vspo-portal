# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Setup and Development Commands

### Initial Setup
From the root directory, run:
```bash
pnpm install
```

### After Making Changes
Always run these commands from the root directory to ensure code quality:
```bash
pnpm tsc           # Type checking
pnpm biome:unsafe-fix  # Auto-fix linting issues
pnpm biome:format  # Format code
pnpm build         # Build all packages
```

### Database Schema Changes
When modifying database schemas, run from the `service/server` directory:
```bash
pnpm db:generate   # Generate new migrations
```

## Project Architecture

This is a monorepo for the VSPO Portal, a VTuber content management system focused on VSPO (Virtual eSports Project) members.

### Core Services

1. **Frontend (`service/vspo-schedule/v2/web`)**: Next.js 15 application with:
   - Internationalization (ja, en, ko, cn, tw)
   - PWA capabilities
   - Feature-based organization using container/presenter pattern
   - Deployed to Cloudflare Pages

2. **Backend (`service/server`)**: Cloudflare Workers API using:
   - Hono framework for routing
   - Domain-Driven Design architecture
   - PostgreSQL with Drizzle ORM
   - Multiple entry points: gateway (public API), internal, cron jobs
   - OpenTelemetry for observability

3. **AI Agent (`service/agent`)**: Content analysis service using:
   - Mastra framework
   - LangChain and OpenAI integration
   - Clip categorization and analysis

### Shared Packages
- `packages/api`: Generated TypeScript API client from OpenAPI specs
- `packages/errors`: Centralized error handling
- `packages/logging`: Structured logging utilities
- `packages/dayjs`: Date/time utilities

### Key Architectural Patterns

1. **Type Safety**: Extensive TypeScript usage with generated API types
2. **Edge Computing**: Services deployed on Cloudflare Workers
3. **Event-Driven**: Queue-based processing for async tasks
4. **Multi-Platform Support**: Integrates YouTube, Twitch, Twitcasting, Niconico
5. **Feature Organization**: Frontend features are self-contained modules
6. **DDD Backend**: Clear separation between domain, infrastructure, and use cases

### Development Workflow

1. The project uses Turbo for build orchestration
2. Biome for linting and formatting (replaces ESLint/Prettier)
3. Vitest for testing
4. OpenAPI for API documentation and type generation
5. Docker for local PostgreSQL development