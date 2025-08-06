# Code Style and Conventions

## General Conventions
- **TypeScript**: Strict mode enabled across all packages
- **Module System**: ESNext modules
- **Package Manager**: pnpm with workspaces
- **Build System**: Turbo for monorepo orchestration

## Code Formatting
- **Tool**: Biome (replaces ESLint and Prettier)
- **Indentation**: 2 spaces
- **Quotes**: Double quotes for strings
- **Semicolons**: Required (enforced by Biome)
- **Line Width**: Default Biome settings

## TypeScript Configuration
- **Target**: ESNext
- **Module Resolution**: Bundler
- **Strict Mode**: Enabled
- **JSX**: React JSX (Hono JSX for server)
- **Skip Lib Check**: Enabled for faster builds

## Naming Conventions
- **Files**: camelCase for TypeScript files (e.g., `creator.ts`, `clipAnalysis.ts`)
- **Components**: PascalCase for React components
- **Functions/Variables**: camelCase
- **Constants**: UPPER_SNAKE_CASE for environment variables, camelCase for others
- **Types/Interfaces**: PascalCase

## Architecture Patterns

### Backend (DDD)
- **Domain Layer**: Pure business logic, no external dependencies
- **Use Case Layer**: Application logic, orchestrates domain objects
- **Infrastructure Layer**: External services, database, APIs
- **Command/Query Separation**: CQRS pattern implementation

### Frontend
- **Feature-Based Organization**: Each feature is self-contained
- **Container/Presenter Pattern**: Separation of logic and presentation
- **Component Structure**:
  ```
  features/
  └── feature-name/
      ├── containers/    # Smart components with logic
      ├── components/    # Presentational components
      ├── hooks/         # Custom React hooks
      └── utils/         # Feature-specific utilities
  ```

## Import Organization
- Biome automatically organizes imports on save
- Order: External → Internal → Relative

## Error Handling
- Use @vspo-lab/error package for consistent error handling
- Structured error responses with proper HTTP status codes
- Error boundary components in React

## Testing
- **Framework**: Vitest
- **Test Files**: `*.test.ts` or `*.spec.ts`
- **Test Location**: Alongside source files or in `test/` directory

## Documentation
- JSDoc comments for public APIs
- README files for each major package/service
- OpenAPI specifications for API documentation

## Security
- Never commit secrets or API keys
- Use environment variables for configuration
- Follow OWASP best practices
- Input validation using Zod schemas

## Git Conventions
- Feature branches: `feat/`, `fix/`, `chore/`, `refactor/`
- Commit messages: Conventional commits format
- PR reviews required before merge to main branches