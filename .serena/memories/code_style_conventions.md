# Code Style and Conventions for VSPO Portal

## General Code Style
- **Language**: TypeScript (strict type safety)
- **Indentation**: 2 spaces (configured in biome.json)
- **Quotes**: Double quotes for strings (configured in biome.json)
- **Semicolons**: Used consistently
- **File naming**: 
  - Components: PascalCase (e.g., `MyComponent.tsx`)
  - Utilities/hooks: camelCase (e.g., `useMyHook.ts`)
  - Constants: UPPER_SNAKE_CASE

## TypeScript Conventions
- Extensive use of TypeScript with generated API types
- Strict type checking enabled (`pnpm tsc` for validation)
- Prefer interfaces over type aliases for object shapes
- Use type imports: `import type { MyType } from './types'`

## Frontend Conventions (Next.js)
- **Architecture**: Feature-based organization using container/presenter pattern
- **Components**: Self-contained feature modules
- **Internationalization**: Support for ja, en, ko, cn, tw
- **PWA**: Progressive Web App capabilities
- **Deployment**: Cloudflare Pages

## Backend Conventions (Cloudflare Workers)
- **Framework**: Hono for routing
- **Architecture**: Domain-Driven Design (DDD)
  - Clear separation between domain, infrastructure, and use cases
- **Database**: PostgreSQL with Drizzle ORM
- **Entry points**: Multiple (gateway, internal, cron jobs)
- **Observability**: OpenTelemetry integration

## Biome Configuration
```json
{
  "formatter": {
    "enabled": true,
    "formatWithErrors": true,
    "indentStyle": "space",
    "indentWidth": 2
  },
  "organizeImports": {
    "enabled": true
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true
    }
  },
  "javascript": {
    "formatter": {
      "quoteStyle": "double"
    }
  }
}
```

## Import Organization
- Biome automatically organizes imports
- Order: external packages → internal packages → relative imports

## Package Conventions
- Monorepo structure with shared packages
- Packages under `@vspo-lab/` namespace
- Clear separation of concerns:
  - `@vspo-lab/api`: API client
  - `@vspo-lab/errors`: Error handling
  - `@vspo-lab/logging`: Logging utilities
  - `@vspo-lab/dayjs`: Date utilities

## Testing
- Vitest for unit testing
- E2E tests in dedicated `e2e/` directory

## Documentation
- OpenAPI for API documentation
- Type generation from OpenAPI specs
- README files for each major service/package

## Security Best Practices
- Never commit secrets or API keys
- Use environment variables for sensitive data
- Follow Cloudflare Workers security guidelines

## IMPORTANT Rules from CLAUDE.md
- NEVER create files unless absolutely necessary
- ALWAYS prefer editing existing files
- NEVER proactively create documentation files unless explicitly requested
- NEVER add comments unless asked by the user