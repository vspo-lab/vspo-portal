# Task Completion Checklist for VSPO Portal

## MANDATORY: After Making Any Code Changes

Always run these commands from the root directory in this exact order:

1. **Type Checking**
   ```bash
   pnpm tsc
   ```
   - Ensures no TypeScript errors across all packages
   - Must pass before proceeding

2. **Auto-fix Linting Issues**
   ```bash
   pnpm biome:unsafe-fix
   ```
   - Automatically fixes linting issues
   - Uses Biome's unsafe fixes when necessary

3. **Format Code**
   ```bash
   pnpm biome:format
   ```
   - Ensures consistent code formatting
   - Applies 2-space indentation and double quotes

4. **Build All Packages**
   ```bash
   pnpm build
   ```
   - Builds all packages using Turbo
   - Verifies the code compiles correctly

## Additional Checks (When Applicable)

### Database Schema Changes
If you modified database schemas:
```bash
cd service/server
pnpm db:generate   # Generate new migrations
cd ../..           # Return to root
```

### API Changes
If you modified OpenAPI specifications:
```bash
pnpm generate-openapi   # Regenerate TypeScript API client
```

### Before Committing
- Verify all tests pass (if tests exist)
- Ensure no secrets or API keys are exposed
- Check that imports are properly organized
- Confirm no unnecessary files were created

## Important Reminders
- If you cannot find the correct command, ask the user
- If the user provides a command, suggest writing it to CLAUDE.md
- NEVER commit changes unless explicitly asked by the user
- Always run from the root directory unless specified otherwise

## Quick Command Chain
For convenience, you can run all quality commands in sequence:
```bash
pnpm tsc && pnpm biome:unsafe-fix && pnpm biome:format && pnpm build
```