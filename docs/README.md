# Documentation

Technical documentation for the vspo-portal monorepo.

## Structure

### Project Overview

| Document | Description |
|----------|-------------|
| [Monorepo Structure](./overview/monorepo-structure.md) | Workspace layout, packages, services, tooling |

### Domain

| Document | Description |
|----------|-------------|
| [Domain README](./domain/README.md) | Domain modeling overview |
| [Overview](./domain/overview.md) | Project vision, scope, and target users |
| [Entities](./domain/entities.md) | Entity catalog, attributes, relationships, and business rules |
| [Use Cases](./domain/usecases.md) | User stories organized by priority phase |
| [Glossary](./domain/glossary.md) | Ubiquitous language and naming conventions |
| [Decisions](./domain/decisions.md) | Architecture Decision Records (ADRs) |

### Web Frontend

| Document | Description |
|----------|-------------|
| [Architecture](./web-frontend/architecture.md) | Feature modules, Container/Presenter pattern, dependency direction |
| [Routing](./web-frontend/routing.md) | Pages Router, route map, layout system |
| [Middleware](./web-frontend/middleware.md) | Locale routing, timezone, session tracking |
| [Data Fetching](./web-frontend/data-fetching.md) | serverSideProps, dual API support, Result pattern |
| [State Management](./web-frontend/state-management.md) | Context providers, cookies, LocalStorage |
| [i18n](./web-frontend/i18n.md) | Internationalization setup and locale resolution |
| [Styling](./web-frontend/styling.md) | MUI v7 + Emotion theming and component patterns |
| [Shared Components](./web-frontend/shared-components.md) | Layout, VideoCard, VideoModal, common UI elements |
| [Multiview](./web-frontend/multiview.md) | Multi-stream viewer, grid layouts, playback controls |
| [PWA](./web-frontend/pwa.md) | Progressive Web App configuration and caching |
| [TypeScript](./web-frontend/typescript.md) | Zod Schema First, type inference, strict mode conventions |
| [Error Handling](./web-frontend/error-handling.md) | Result type pattern, domain error codes |
| [React Hooks](./web-frontend/react-hooks.md) | Hook guidelines and patterns |
| [Accessibility](./web-frontend/accessibility.md) | Implementation guide for accessibility with React Aria |

### Web Frontend — Testing

| Document | Description |
|----------|-------------|
| [Unit Testing](./web-frontend/unit-testing.md) | Project-specific test patterns (Vitest, mocks, Result type) |
| [API Testing](./web-frontend/api-testing.md) | API data fetching tests with VSPOApi client mock and MockHandler |
| [TDD Strategy](./web-frontend/twada-tdd.md) | t_wada-style Red-Green-Refactor |

### Backend

| Document | Description |
|----------|-------------|
| [Server Architecture](./backend/server-architecture.md) | Frontend-only architecture with Cloudflare Workers |
| [DateTime Handling](./backend/datetime-handling.md) | UTC-first convention with `@vspo-lab/dayjs` |
| [Function Documentation](./backend/function-documentation.md) | JSDoc requirements |
| [PR Guidelines](./backend/pr-guidelines.md) | Pull request structure and review |

### Packages

| Document | Description |
|----------|-------------|
| [Shared Packages](./packages/README.md) | `@vspo-lab/error`, `@vspo-lab/api`, `@vspo-lab/dayjs`, `@vspo-lab/logging`, mock system |

### Infrastructure

| Document | Description |
|----------|-------------|
| [Cloudflare Workers](./infra/cloudflare-workers.md) | Deployment architecture, wrangler config, OpenNextJS, service bindings |
| [CI/CD](./infra/ci-cd.md) | GitHub Actions pipelines |
| [Terraform](./infra/terraform.md) | Infrastructure as Code |
| [tfaction](./infra/tfaction.md) | Terraform CI/CD with tfaction |
| [Terraform + tfaction Guidelines](./infra/terraform-tfaction-guidelines.md) | Combined Terraform and tfaction best practices |
| [Multi-Cloud Best Practices](./infra/multi-cloud-best-practices.md) | Multi-cloud deployment patterns |
| [Draw.io MCP](./infra/drawio-mcp.md) | Draw.io diagram generation via MCP |

### Testing

| Document | Description |
|----------|-------------|
| [Testing Overview](./testing/README.md) | Test strategy and coverage policy |
| [E2E Testing](./testing/e2e-testing.md) | End-to-end testing |
| [Integration Testing](./testing/integration-testing.md) | Integration testing |
| [UI Testing](./testing/ui-testing.md) | UI component testing |
| [VRT Testing](./testing/vrt-testing.md) | Visual regression testing |
| [Unit Testing](./testing/unit-testing.md) | Unit testing implementation guidelines |
| [API Testing](./testing/api-testing.md) | API testing |

### Design System

| Document | Description |
|----------|-------------|
| [Design Principles](./design/design-principles.md) | Core design principles |
| [Design Tokens](./design/design-tokens.md) | Token system, spacing, breakpoints |
| [Colors](./design/colors.md) | Color palette and usage |
| [Typography](./design/typography.md) | Font system and scale |
| [Icons](./design/icons.md) | Icon guidelines |
| [Design Patterns](./design/design-patterns.md) | Reusable UI patterns |
| [Accessibility](./design/accessibility.md) | Design checklist for WCAG 2.2 Level AA |
| [Content Guidelines](./design/content-guidelines.md) | Content and copy guidelines |
| [Writing](./design/writing.md) | Writing style guide |
| [Design Review](./design/design-review.md) | Design review process |
| [Meta](./design/meta.md) | Design system meta information |
| [Utilities](./design/utilities.md) | Design utility classes |

### Security

| Document | Description |
|----------|-------------|
| [Linting](./security/lint.md) | Linting and security scanning |
| [Textlint](./security/textlint.md) | Text linting rules |
