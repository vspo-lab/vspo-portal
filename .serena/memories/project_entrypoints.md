# Project Entry Points and How to Run Them

## Frontend Application

### Main Web Application (Spodule)
**Location**: `service/vspo-schedule/v2/web`
**Purpose**: User-facing web application for viewing VSPO streams and clips

```bash
# Development (from root)
pnpm dev:vspo-schedule-web  # Starts on http://localhost:4000

# Or from service directory
cd service/vspo-schedule/v2/web
pnpm dev

# Production build
pnpm build
pnpm start
```

**Key Features**:
- Stream schedule viewer
- Clip browser
- Multi-language support (ja, en, ko, cn, tw)
- PWA with offline support
- Responsive design

## Backend Services

### 1. API Gateway
**Location**: `service/server/cmd/server/gateway.ts`
**Purpose**: Public-facing API for frontend and external clients

```bash
# From service/server directory
pnpm dev:gateway

# Wrangler direct command
wrangler dev --config config/wrangler/dev/vspo-portal-gateway/wrangler.toml --script cmd/server/gateway.ts
```

**Endpoints**:
- `/api/v1/*` - Public API routes
- OpenAPI documentation available
- CORS enabled for web clients

### 2. Internal Application Server
**Location**: `service/server/cmd/server/internal/application/index.ts`
**Purpose**: Internal API for service-to-service communication

```bash
# From service/server directory
pnpm dev:internal

# Wrangler direct command
wrangler dev --config config/wrangler/dev/vspo-portal-app/wrangler.toml --script cmd/server/internal/application/index.ts
```

**Features**:
- Protected internal endpoints
- Service mesh communication
- Queue processing

### 3. Cron Job Server
**Location**: `service/server/cmd/cron/index.ts`
**Purpose**: Scheduled tasks and background jobs

```bash
# From service/server directory
pnpm dev:cron

# With test scheduled trigger
wrangler dev --test-scheduled --config config/wrangler/dev/vspo-portal-cron/wrangler.toml --script cmd/cron/index.ts
```

**Jobs**:
- Stream fetching from platforms
- Clip analysis
- Data synchronization
- Cleanup tasks

## AI Agent Service
**Location**: `service/agent`
**Purpose**: Content analysis and categorization

```bash
# From service/agent directory
pnpm dev
```

**Capabilities**:
- Clip categorization
- Content analysis
- Thumbnail generation suggestions

## Database Access

### PostgreSQL with Docker
```bash
# From service/server directory
pnpm db:up      # Start PostgreSQL container
pnpm db:studio  # Open Drizzle Studio UI on http://localhost:3004
```

## Discord Bot
**Location**: `service/server/cmd/discord`

```bash
# Register commands (from service/server)
pnpm register:local  # For local development
pnpm register:prd    # For production
```

## Development Workflow

### Full Stack Development
1. Start database: `pnpm db:up` (in service/server)
2. Start backend: `pnpm dev:gateway` (in service/server)
3. Start frontend: `pnpm dev:vspo-schedule-web` (from root)
4. Optional: Start cron jobs: `pnpm dev:cron`

### Frontend Only
```bash
pnpm dev:vspo-schedule-web
```

### Backend Only
```bash
cd service/server
pnpm db:up          # Start database
pnpm dev:gateway    # Start API
pnpm dev:internal   # If needed
pnpm dev:cron       # If needed
```

## Deployment

### Frontend to Cloudflare Pages
```bash
cd service/vspo-schedule/v2/web
pnpm cf:build    # Build for Cloudflare
pnpm cf:deploy   # Deploy to production
pnpm cf:preview  # Deploy preview
```

### Backend to Cloudflare Workers
```bash
cd service/server
pnpm deploy:all  # Deploy all services
pnpm deploy      # Deploy specific service
```

## Environment Variables
- Development: `.env.local` files
- Production: Configured in Cloudflare dashboard
- Required vars documented in `.dev.example.vars`

## Ports Used in Development
- 4000: Frontend Next.js application
- 3004: Drizzle Studio (database UI)
- 8787: Default Wrangler port (backend)
- 5432: PostgreSQL (Docker)