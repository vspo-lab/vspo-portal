# Suggested Commands for VSPO Portal Development

## Initial Setup
```bash
pnpm install              # Install all dependencies from root directory
```

## Development Commands
```bash
# Frontend development
pnpm dev:vspo-schedule-web   # Start the Next.js frontend development server

# Build all packages
pnpm build                   # Build all packages using Turbo

# API Generation
pnpm generate-openapi        # Generate TypeScript API client from OpenAPI specs
```

## Code Quality Commands (MUST RUN AFTER MAKING CHANGES)
Always run these commands from the root directory to ensure code quality:

```bash
pnpm tsc                     # Type checking across all packages
pnpm biome:unsafe-fix        # Auto-fix linting issues
pnpm biome:format            # Format code
pnpm build                   # Build all packages
```

## Additional Quality Commands
```bash
pnpm biome:check             # Check code quality without fixing
pnpm biome:lint              # Apply linting fixes
pnpm knip                    # Check for unused dependencies and exports
```

## Database Commands
When modifying database schemas, run from the `service/server` directory:

```bash
cd service/server
pnpm db:generate             # Generate new migrations
```

## Git Commands (Darwin/macOS specific)
```bash
git status                   # Check current status
git diff                     # View unstaged changes
git log                      # View commit history
git add .                    # Stage all changes
git commit -m "message"      # Commit with message
git push                     # Push to remote
```

## Common Darwin/macOS Commands
```bash
ls -la                       # List files with details
cd <directory>               # Change directory
grep -r "pattern" .          # Search for pattern recursively
find . -name "*.ts"          # Find files by pattern
open .                       # Open current directory in Finder
```

## Important Notes
- Always run quality commands (`tsc`, `biome:unsafe-fix`, `biome:format`, `build`) after making changes
- Run commands from the root directory unless specified otherwise
- The project uses pnpm workspaces, so dependencies are managed centrally
- Biome replaces ESLint and Prettier for linting and formatting