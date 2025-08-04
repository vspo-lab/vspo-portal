# Development Workflow for VSPO Portal

## Project Setup
1. Clone the repository
2. Install dependencies: `pnpm install`
3. Set up environment variables (if needed)
4. Start development server: `pnpm dev:vspo-schedule-web`

## Development Tools
- **Build Orchestration**: Turbo (configured in turbo.json)
- **Linting & Formatting**: Biome (replaces ESLint/Prettier)
- **Testing**: Vitest
- **API Documentation**: OpenAPI with type generation
- **Local Database**: Docker for PostgreSQL

## Workflow Best Practices

### 1. Before Starting Work
- Check git status: `git status`
- Pull latest changes: `git pull`
- Install/update dependencies: `pnpm install`

### 2. During Development
- Use feature-based organization for frontend components
- Follow DDD principles for backend services
- Utilize TypeScript's type safety features
- Keep components self-contained and modular

### 3. After Making Changes
**ALWAYS run these commands:**
```bash
pnpm tsc                # Type checking
pnpm biome:unsafe-fix   # Fix linting issues
pnpm biome:format       # Format code
pnpm build              # Build all packages
```

### 4. Git Workflow
- Current branch visible in git status
- Main branch for PRs: `develop`
- Create meaningful commit messages
- Never commit without running quality checks

## Package Management
- Monorepo managed with pnpm workspaces
- Shared packages under `@vspo-lab/` namespace
- Turbo handles build dependencies and caching

## Environment Details
- Platform: Darwin (macOS)
- Node.js: >=20.18.0
- pnpm: >=10.10.0
- All commands assume macOS/Unix environment

## Key Configuration Files
- `biome.json`: Linting and formatting rules
- `turbo.json`: Build pipeline configuration
- `pnpm-workspace.yaml`: Workspace configuration
- `lefthook.yml`: Git hooks configuration
- `CLAUDE.md`: AI assistant instructions

## Deployment
- Frontend: Cloudflare Pages
- Backend: Cloudflare Workers
- Database: PostgreSQL (production setup varies)

## Debugging Tips
- Use structured logging from `@vspo-lab/logging`
- Check OpenTelemetry traces for backend issues
- Verify type safety with `pnpm tsc`
- Use browser DevTools for frontend debugging