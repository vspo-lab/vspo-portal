---
description: Frontend Architecture (Feature-Based Approach with Container/Presentational Pattern)
globs: *.ts,*.tsx
alwaysApply: true
---

## Overview

The frontend architecture follows a feature-based approach, organizing code by domain features rather than technical layers. This structure aligns with Domain-Driven Design (DDD) principles while adapting them for frontend development. Within each feature, we implement the Container/Presentational pattern (Container 1st design) to separate business logic from UI presentation.

## Directory Structure

Example directory structure is as follows:

```
src/
├── features/             # Feature modules
│   ├── users/            # Users feature
│   │   ├── api/          # API services for users
│   │   ├── components/   # Components specific to users
│   │   │   ├── containers/  # Container components with logic
│   │   │   └── presenters/  # Presentational components (UI only)
│   │   ├── domain/       # Domain models and logic
│   │   ├── hooks/        # Custom hooks for users
│   │   ├── pages/        # Page components
│   │   │   ├── UserProfile/   # User profile page
│   │   │   │   ├── container.tsx  # Logic container
│   │   │   │   └── presenter.tsx  # UI presentation
│   │   │   └── ...
│   │   └── utils/        # Utilities for users
│   ├── products/         # Products feature
│   ├── notifications/    # Notifications feature
│   └── ...
├── shared/               # Shared code across features
│   ├── components/       # Reusable UI components
│   │   ├── containers/   # Shared container components
│   │   └── presenters/   # Shared presentational components
│   ├── hooks/            # Custom React hooks
│   ├── utils/            # Utility functions
│   └── api/              # API client code
└── common/               # Application-wide code
    ├── layouts/          # Page layouts
    ├── providers/        # Context providers
    ├── styles/           # Global styles
    └── types/            # Global TypeScript types
```

## Container/Presentational Pattern

We adopt the Container 1st approach to separate concerns within components:

### Container Components
- Responsible for "what to do":
  - Data fetching and state management
  - Business logic
  - Event handling
  - Data transformation
- Pass data and callbacks to presentational components
- Don't contain significant markup or styling

### Presentational Components
- Responsible for "how to look":
  - UI rendering
  - Styling
  - Animation
  - Accessibility
- Receive data and callbacks via props
- Typically pure functional components
- Reusable across different containers

## Component Organization

Components are organized in two ways:

1. **Feature-specific components**: Located within each feature module, used only within that feature
   ```
   features/users/components/
   ├── containers/
   │   ├── UserCard.tsx
   │   ├── UserList.tsx
   │   └── ...
   └── presenters/
       ├── UserCardPresenter.tsx
       ├── UserListPresenter.tsx
       └── ...
   ```

2. **Shared components**: Located in the shared directory, reused across features
   ```
   shared/components/
   ├── containers/
   │   ├── Modal.tsx
   │   ├── Pagination.tsx
   │   └── ...
   └── presenters/
       ├── Button.tsx
       ├── Card.tsx
       └── ...
   ```

## Page Structure

Pages follow the same Container/Presentational pattern:

```
features/users/pages/UserProfile/
├── container.tsx     # Contains data fetching, state, and logic
├── presenter.tsx     # Renders the UI based on props
├── index.ts          # Export the connected component
└── serverSideProps.ts  # Next.js data fetching (if applicable)
```

## Principles

1. **Feature Isolation**: Each feature should be self-contained with minimal dependencies on other features.
2. **Shared Components**: Common UI elements are placed in the shared directory for reuse.
3. **Domain-Driven**: Features should align with business domains rather than technical concerns.
4. **Container 1st Design**: Always start with containers that define what needs to be done, then create presenters.
5. **Separation of Concerns**: 
   - Containers handle logic and data
   - Presenters handle UI and styling
6. **Layered Approach Within Features**:
   - UI Layer: Presenters
   - Application Layer: Containers, hooks
   - Domain Layer: Business logic, data transformation
   - Infrastructure Layer: API calls, external services integration

## Data Flow

1. Container components fetch and manage data
2. Data flows down to presentational components via props
3. User events in presentational components trigger callbacks defined in container components
4. Container components update state based on these events

## Dependency Direction

Dependencies should flow from:
- Features → Shared → Common
- Never: Common → Features or Shared → Features
- Within features: Container → Presenter (one-way)

## Testing Strategy

- Container tests: Test business logic and state management
- Presenter tests: Test UI rendering and interactions
- Integration tests: Test container-presenter pairs working together
- End-to-end tests: Test complete user flows

## Implementation Guidelines

- Use TypeScript for type safety across the application
- Follow consistent naming conventions for files and components
  - ContainerName.tsx and NamePresenter.tsx
- Keep presenters as pure functions when possible
- Document component APIs using JSDoc or Storybook
- Use custom hooks to extract and reuse complex logic from containers

## State Management

- Feature-specific state should be contained within the feature module
- Cross-feature state should be managed through a central store or context 