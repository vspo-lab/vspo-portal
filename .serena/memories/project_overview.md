# VSPO Portal Project Overview

## Purpose
VSPO Portal is a monorepo for a VTuber content management system focused on VSPO (Virtual eSports Project) members. The main user-facing service is Spodule (vspo-schedule.com), where users can check streams (YouTube/Twitch/Twitcasting/Niconico) and clips of VSPO members.

## Tech Stack

### Frontend (service/vspo-schedule/v2/web)
- **Framework**: Next.js 15 with App Router
- **UI Libraries**: MUI (Material-UI), Emotion for styling
- **Internationalization**: i18next, next-i18next (supports ja, en, ko, cn, tw)
- **PWA**: next-pwa for Progressive Web App capabilities
- **Deployment**: Cloudflare Pages via OpenNext.js
- **State Management**: React hooks and context
- **Build Tools**: Turbo, pnpm

### Backend (service/server)
- **Runtime**: Cloudflare Workers (Edge computing)
- **Framework**: Hono (lightweight web framework)
- **Architecture**: Domain-Driven Design (DDD) with clear separation of concerns
- **Database**: PostgreSQL with Drizzle ORM
- **API Design**: OpenAPI specification with TypeScript generation
- **Authentication**: JWT tokens
- **Observability**: OpenTelemetry, Sentry
- **Queue Processing**: Cloudflare Queues for async tasks

### AI Agent (service/agent)
- **Framework**: Mastra
- **AI Integration**: LangChain, OpenAI
- **Purpose**: Content analysis and clip categorization

### Shared Packages
- **@vspo-lab/api**: Generated TypeScript API client from OpenAPI specs
- **@vspo-lab/errors**: Centralized error handling utilities
- **@vspo-lab/logging**: Structured logging utilities
- **@vspo-lab/dayjs**: Date/time utilities with timezone support

## Project Structure
```
vspo-portal/
├── service/
│   ├── server/          # Backend API (Cloudflare Workers)
│   │   ├── cmd/         # Entry points (gateway, internal, cron)
│   │   ├── domain/      # Domain models and business logic
│   │   ├── usecase/     # Application use cases
│   │   ├── infra/       # Infrastructure layer (DB, external services)
│   │   └── pkg/         # Shared utilities
│   ├── vspo-schedule/   # Frontend applications
│   │   └── v2/web/      # Next.js web application
│   └── agent/           # AI content analysis service
├── packages/            # Shared npm packages
├── e2e/                 # End-to-end tests
└── docs/                # Documentation

## Key Features
- Multi-platform streaming support (YouTube, Twitch, Twitcasting, Niconico)
- Real-time stream tracking and notifications
- Clip analysis and categorization
- Discord bot integration
- Multi-language support
- PWA with offline capabilities
- Edge-first architecture for global performance

## Development Requirements
- Node.js: >=22.15.0
- pnpm: >=10.10.0
- Docker (for local PostgreSQL development)
```