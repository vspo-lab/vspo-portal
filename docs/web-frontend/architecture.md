# Frontend Architecture

## Overview

The frontend architecture adopts a Feature-based approach, organizing code by domain functionality rather than technical layers. This structure follows DDD principles adapted for frontend development. Within each Feature, the Container/Presentational pattern (Container-first design) is implemented to separate business logic from UI rendering.

This architecture is designed for the Next.js App Router, where **Features and pages have a 1:1 correspondence**. Each route in `app/` maps to a single Feature, keeping routing and Feature logic tightly coupled.

## Rendering Foundation (React Compiler + Cache Components)

The frontend is designed with the following default settings:

- `reactCompiler: true` in `services/web/next.config.ts`
- `cacheComponents: true` in `services/web/next.config.ts`
- Server Components by default; Client Components only when interactivity is needed

Design implications:

1. **Compiler-first memoization**: Do not add `useMemo`/`useCallback` solely for speculative performance
2. **Cache-first rendering**: Define cacheable data boundaries with `'use cache'` and invalidate explicitly
3. **Explicit dynamic boundaries**: Wrap dynamic parts with `<Suspense>` and keep the static shell outside

Refer to the following for specific rules:

- `docs/web-frontend/react-hooks.md`
- `docs/web-frontend/cache-components.md`

## Directory Structure

The directory structure is as follows:

```
app/                          # Next.js App Router (routes and pages)
├── layout.tsx                # Root layout
├── globals.css               # Global styles
├── (public)/                 # Public pages (terms of service, contact, etc.)
├── (auth)/                   # Authentication pages ([feature-name])
└── (protected)/              # Authenticated pages (home, etc.)
│
features/                     # Feature modules (business logic)
├── [your-feature]/           # Core Feature module
│   ├── api/                  # Feature API module
│   ├── components/
│   │   ├── containers/       # Business logic containers
│   │   └── presenters/       # UI presenters
│   ├── hooks/                # Custom Hooks
│   └── types/                # Type definitions
├── [feature-name]/           # Individual Feature modules
│
shared/                       # App-wide shared code
├── components/               # Shared UI building blocks
│   ├── ui/                   # Base design system (Button, Input, Card, etc.)
│   ├── presenters/           # Reusable presentation components
│   └── containers/           # Shared container components (AppShell, AuthGuard)
├── lib/                      # Shared libraries (apiConfig, etc.)
└── utils/
```

## Container/Presentational Pattern

A Container-first approach is adopted to separate concerns within components.

### Container Components

- Responsible for "what to do":
  - Data fetching and state management
  - Business logic
  - Event handling
  - Data transformation
- Pass data and callbacks to Presentational components
- Do not contain large markup or styling

### Presentational Components

- Responsible for "how to display":
  - UI rendering
  - Styling
  - Animation
  - Accessibility
- Receive data and callbacks via props
- Typically pure function components
- Reusable across different containers

### Example

**Container** (`ItemPage.tsx`):

```tsx
"use client";

import { fetchItemData } from "../api/itemApi";
import { ItemPagePresenter } from "../presenters/ItemPagePresenter";

export const ItemPage = () => {
  // Data fetching + device selection logic goes here
  return <ItemPagePresenter /* props */ />;
};
```

**Presenter** (`ItemPagePresenter.tsx`):

```tsx
type Props = {
  items: Array<{ id: string; name: string; status: string }>;
};

export const ItemPagePresenter = ({ items }: Props) => {
  return <section>{/* Render items */}</section>;
};
```

### Key Points

| Container | Presenter |
|-----------|-----------|
| `useState`, `useEffect` | Props only |
| Business logic (filtering, etc.) | Pure rendering |
| Event handler logic | `onClick={onXxx}` |
| Minimal JSX | Rich JSX and styling |

## API Access

- Feature-specific API modules are placed in `features/<feature>/api/`
- Use `shared/lib/apiConfig.ts` for the base URL
- API functions return `Result` from `@vspo-lab/errors`
- Feature-specific endpoints are defined per module

## Component Organization

Components are organized in three ways:

1. **Page-specific components** (`_components/`): Placed within each route, used only on that page. The `_` prefix indicates it is private to the route and excluded from routing.

   ```
   app/feature/
   ├── page.tsx
   └── _components/        # Private to this route (underscore prefix)
       ├── FeatureTimer.tsx
       ├── StatusBadge.tsx
       └── ...
   ```

2. **Feature-specific components**: Placed within each Feature module, reused within that Feature.

   ```
   features/item/components/
   ├── containers/
   │   ├── ItemPage.tsx
   │   └── ...
   └── presenters/
       ├── ItemPagePresenter.tsx
       └── ...
   ```

3. **Shared components**: Placed in `shared/components/`, reused across Features.

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

## App Router Structure

In the Next.js App Router, Features and pages have a **1:1 correspondence**. Each route maps to a single Feature.

### Route Structure

```
app/                        # Entry page
├── page.tsx
└── _components/            # Page-specific components (optional)
app/feature/
├── page.tsx                # Feature page
├── loading.tsx             # Loading UI (optional)
├── error.tsx               # Error UI (optional)
└── _components/            # Page-specific components (optional)
```

### Naming Conventions

- **`_` prefix**: Page-specific folders (e.g., `_components/`, `_hooks/`) use an underscore prefix because:
  - It indicates they are private to the route
  - It prevents Next.js from treating them as route segments
  - It clearly distinguishes page-specific code from shared code

### Page Component Pattern

```tsx
// app/items/page.tsx (Server Component)
import { getItems } from '@/features/items/api'
import { ItemList } from './_components/UserList'

export default async function ItemsPage() {
  const items = await getItems()
  return <ItemList items={items} />
}
```

```tsx
// app/items/_components/ItemList.tsx (Client or Server Component)
import { ItemCard } from './ItemCard'
import type { Item } from '@/features/items/types'

type Props = {
  items: Item[]
}

export function ItemList({ users }: Props) {
  return (
    <div>
      { items.map(item => (
        <ItemCard key={item.id} item={item} />
      ))}
    </div>
  )
}
```

## Design Principles

1. **Feature-Page 1:1 mapping**: Each route in `app/` corresponds to exactly one Feature. Routing and business logic are kept tightly coupled.
2. **Feature isolation**: Each Feature is self-contained, minimizing dependencies on other Features. Avoid cross-Feature imports.
3. **Shared components**: Common UI elements are placed in `shared/components/` for reuse.
4. **Domain-driven**: Features are designed around business domains, not technical concerns.
5. **Container-first design**: Always start with a container to define what needs to be done, then create the presenter.
6. **Separation of concerns**:
   - Containers handle logic and data
   - Presenters handle UI and styling
7. **Layered approach within Features**:
   - UI Layer: Presenters
   - Application Layer: Containers, Hooks
   - Domain Layer: Business logic, data transformation
   - Infrastructure Layer: API calls, external service integration
8. **Colocation**: Related code is placed close together. Page-specific components go in `_components/` within the route.
9. **Compiler-first Hooks**: Start with plain computations and event handlers; use memoization Hooks only when behavior/control is needed.
10. **Cache-first App Router**: Treat cache boundaries (`'use cache'`, `cacheLife`, `cacheTag`) as part of Feature design, not an afterthought.

## Data Flow

1. Container components fetch and manage data
2. Data flows to Presentational components via props
3. User events in Presentational components trigger callbacks defined in Containers
4. Container components update state based on events

## Dependency Direction

Dependencies flow in one direction:

```
      shared/
         ↓
     features/
         ↓
       app/
```

### Rules

- **Shared → Features**: Shared code is available to all Features
- **Features → App**: Features can be imported from app routes
- **Prohibited**: A Feature must not import from another Feature
- **Prohibited**: Shared code must not import from features or app
- Within a Feature: Container → Presenter (one-way)

### Cross-Feature Communication

Compose at the app level instead of cross-Feature imports.

```tsx
// ❌ Bad: Cross-Feature import
// features/reviews/components/ReviewList.tsx
import { Avatar } from '@/shared/components'

// ✅ Good: Compose at app level
// app/items/[id]/_components/ItemReviews.tsx
import { ReviewList } from '@/features/reviews/components'
import { Avatar } from '@/shared/components'
```

## Testing Strategy

- Container tests: Test business logic and state management
- Presenter tests: Test UI rendering and interactions
- Integration tests: Test Container and Presenter pair integration
- E2E tests: Test entire user flows

## Implementation Guidelines

- Use TypeScript throughout the application for type safety
- Keep `reactCompiler` and `cacheComponents` enabled unless there is a proven blocker
- Maintain consistent naming conventions for files and components
  - ContainerName.tsx and NamePresenter.tsx
  - Use `_` prefix for page-specific folders (`_components/`, `_hooks/`)
- Keep Presenters as pure functions whenever possible
- Document component APIs with JSDoc or Storybook
- Use custom Hooks to extract and reuse complex logic from Containers
- Default to Server Components; use `'use client'` only when necessary
- Import files directly instead of using barrel files (better for tree shaking)

## State Management

- Feature-specific state is confined within the Feature module
- Cross-Feature state is managed with a central store or context
- Prefer Server Components and URL state over client-side state whenever possible

## Feature Structure

Features include only the necessary folders:

```
features/awesome-feature/
├── api/          # API request declarations and Hooks
├── components/   # Components scoped to this Feature
│   ├── containers/
│   └── presenters/
├── hooks/        # Hooks scoped to this Feature
├── types/        # TypeScript type definitions for this Feature
└── utils/        # Utility functions for this Feature
```
