# Suggested Commands for Development

## Essential Development Commands (Run from root)

### Initial Setup
```bash
pnpm install          # Install all dependencies
```

### Code Quality Commands (MUST RUN AFTER CHANGES)
```bash
pnpm tsc              # TypeScript type checking (run from root)
pnpm biome:unsafe-fix # Auto-fix linting issues
pnpm biome:format     # Format code
pnpm build            # Build all packages
```

### Development Servers
```bash
# Frontend
pnpm dev:vspo-schedule-web  # Start Next.js dev server on port 4000

# Backend (from service/server directory)
pnpm dev:gateway     # Start API gateway server
pnpm dev:internal    # Start internal API server
pnpm dev:cron        # Start cron job server
```

### Database Commands (from service/server)
```bash
pnpm db:up           # Start PostgreSQL with Docker
pnpm db:generate     # Generate Drizzle migrations
pnpm db:migrate      # Apply migrations
pnpm db:studio       # Open Drizzle Studio on port 3004
```

### Testing
```bash
pnpm test            # Run tests with Vitest
```

### API Generation
```bash
pnpm generate-openapi  # Generate TypeScript types from OpenAPI
```

### Build Commands
```bash
pnpm build           # Build all packages with Turbo
turbo build          # Alternative build command
```

### Linting and Formatting
```bash
pnpm biome:check     # Check for issues without fixing
pnpm biome:lint      # Apply safe lint fixes
pnpm knip            # Find unused dependencies and exports
```

### Deployment (from service/server)
```bash
pnpm deploy:all      # Deploy all services
pnpm deploy          # Deploy single service with Wrangler
```

### Git and System Commands (macOS/Darwin)
```bash
git status           # Check git status
git diff             # View unstaged changes
git add .            # Stage all changes
git commit -m "msg"  # Commit with message
ls -la               # List files with details
find . -name "*.ts"  # Find TypeScript files
grep -r "pattern" .  # Search for pattern in files
```

## Workflow After Making Changes
1. `pnpm tsc` - Check TypeScript types
2. `pnpm biome:unsafe-fix` - Auto-fix lint issues
3. `pnpm biome:format` - Format code
4. `pnpm build` - Build to verify everything works
5. `pnpm test` - Run tests if applicable

## Important Notes
- Always run commands from the project root unless specified otherwise
- Use `pnpm` not `npm` or `yarn`
- The project uses Turbo for efficient builds - it caches results
- Biome replaces ESLint and Prettier for faster performance
- Database commands require Docker to be running