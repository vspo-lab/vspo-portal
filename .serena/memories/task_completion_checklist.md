# Task Completion Checklist

## Required Steps After Code Changes

### 1. Type Checking (MANDATORY)
```bash
pnpm tsc
```
- Run from project root
- Ensures no TypeScript errors
- Must pass before considering task complete

### 2. Code Formatting and Linting (MANDATORY)
```bash
pnpm biome:unsafe-fix  # Auto-fix all issues
pnpm biome:format      # Format code
```
- Automatically fixes code style issues
- Ensures consistent formatting
- Required for all code changes

### 3. Build Verification (MANDATORY)
```bash
pnpm build
```
- Builds all affected packages
- Verifies no build errors
- Uses Turbo cache for efficiency

### 4. Test Execution (If Tests Exist)
```bash
pnpm test
```
- Run if tests are affected by changes
- Ensure all tests pass
- Add tests for new functionality

### 5. Database Changes (If Applicable)
```bash
# From service/server directory
pnpm db:generate  # Generate migrations for schema changes
pnpm db:migrate   # Apply migrations locally
```

### 6. API Changes (If Applicable)
```bash
pnpm generate-openapi  # Regenerate TypeScript types
```

## Verification Checklist
- [ ] TypeScript compilation successful (`pnpm tsc`)
- [ ] Code formatted and linted (`pnpm biome:unsafe-fix && pnpm biome:format`)
- [ ] Build successful (`pnpm build`)
- [ ] Tests passing (if applicable)
- [ ] Database migrations generated (if schema changed)
- [ ] API types regenerated (if OpenAPI changed)
- [ ] No console errors in development
- [ ] Feature works as expected

## Common Issues and Solutions

### TypeScript Errors
- Check imports are correct
- Verify types match expected interfaces
- Ensure strict mode compliance

### Build Failures
- Clear Turbo cache: `turbo daemon clean`
- Clean install: `rm -rf node_modules && pnpm install`
- Check for circular dependencies

### Biome Issues
- Run `pnpm biome:unsafe-fix` for automatic fixes
- Manual intervention needed for complex issues
- Check biome.json for rule configuration

## Final Verification
Before marking any task as complete:
1. All commands run without errors
2. Code follows project conventions
3. No regression in existing functionality
4. Changes are tested (manually or automated)

## Important Notes
- NEVER skip the type checking and formatting steps
- Always run commands from project root unless specified
- If unsure about command location, check CLAUDE.md
- Consider impact on other packages in monorepo