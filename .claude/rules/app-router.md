# Next.js App Router Architecture with Feature-Based Approach

## Overview

This architecture combines Next.js App Router capabilities with a feature-based approach and Container/Presentational pattern. It leverages Server Components by default while maintaining domain-driven organization. The architecture aligns with DDD principles while adapting them for modern React Server Components (RSC) paradigm.

## Core Principles

1. **Server Components First**: Use Server Components by default, Client Components only when needed
2. **Feature Isolation**: Each feature is self-contained with minimal cross-feature dependencies
3. **Container/Presentational Evolution**: Adapt the pattern to work with Server/Client component boundaries
4. **Domain-Driven Structure**: Features align with business domains rather than technical layers
5. **Progressive Enhancement**: Start with server-side capabilities, add client interactivity as needed

## Directory Structure

```
src/
├── app/                          # Next.js App Router
│   ├── (marketing)/              # Route group for marketing pages
│   │   ├── about/
│   │   │   └── page.tsx
│   │   └── layout.tsx
│   ├── (app)/                    # Route group for main application
│   │   ├── users/                # Users feature routes
│   │   │   ├── [id]/
│   │   │   │   └── page.tsx      # Server Component by default
│   │   │   ├── profile/
│   │   │   │   ├── page.tsx
│   │   │   │   └── _components/  # Co-located components
│   │   │   │       ├── profile-container.tsx
│   │   │   │       └── profile-form.tsx
│   │   │   └── layout.tsx
│   │   ├── products/             # Products feature routes
│   │   └── notifications/        # Notifications feature routes
│   ├── api/                      # API routes
│   │   └── users/
│   │       └── route.ts
│   └── layout.tsx                # Root layout
├── features/                     # Feature modules (business logic)
│   ├── users/
│   │   ├── actions/              # Server Actions
│   │   │   ├── create-user.ts
│   │   │   └── update-user.ts
│   │   ├── components/           # Feature-specific components
│   │   │   ├── containers/       # Client Components with logic
│   │   │   │   └── user-list-container.tsx
│   │   │   └── presenters/       # Pure UI components
│   │   │       └── user-card.tsx
│   │   ├── domain/               # Domain models and business logic
│   │   │   ├── user.model.ts
│   │   │   └── user.service.ts
│   │   ├── hooks/                # Custom React hooks
│   │   │   └── use-user.ts
│   │   └── lib/                  # Feature utilities
│   │       └── user-api.ts
│   ├── products/
│   └── notifications/
├── shared/                       # Shared across features
│   ├── components/
│   │   ├── ui/                   # Pure UI components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   └── modal.tsx
│   │   └── patterns/             # Common component patterns
│   │       ├── data-table/
│   │       │   ├── data-table.tsx        # Server Component
│   │       │   └── data-table-client.tsx # Client wrapper
│   │       └── form-builder/
│   ├── hooks/
│   ├── lib/                      # Shared utilities
│   │   ├── api-client.ts
│   │   └── utils.ts
│   └── types/
└── core/                         # Application-wide code
    ├── layouts/
    ├── providers/
    ├── styles/
    └── config/
```

## Component Patterns

### 1. Server Component Pages (Default)

```tsx
// app/(app)/users/[id]/page.tsx
import { getUser } from '@/features/users/domain/user.service'
import { UserProfilePresenter } from '@/features/users/components/presenters/user-profile'
import { UserActionsContainer } from '@/features/users/components/containers/user-actions'

export default async function UserPage({ params }: { params: { id: string } }) {
  const user = await getUser(params.id)
  
  return (
    <div>
      {/* Server Component for static content */}
      <UserProfilePresenter user={user} />
      
      {/* Client Component for interactive features */}
      <UserActionsContainer userId={user.id} />
    </div>
  )
}
```

### 2. Container/Presenter Pattern with RSC

Container Components now have two variants:

**Server Container (Data Fetching)**
```tsx
// features/users/components/containers/user-list-server.tsx
import { getUsers } from '@/features/users/domain/user.service'
import { UserListPresenter } from '../presenters/user-list'

export async function UserListServerContainer() {
  const users = await getUsers()
  
  return <UserListPresenter users={users} />
}
```

**Client Container (Interactive Logic)**
```tsx
// features/users/components/containers/user-list-client.tsx
'use client'

import { useState, useEffect } from 'react'
import { UserListPresenter } from '../presenters/user-list'
import { useUserFilters } from '../../hooks/use-user-filters'

export function UserListClientContainer({ initialUsers }: { initialUsers: User[] }) {
  const [users, setUsers] = useState(initialUsers)
  const { filters, setFilters } = useUserFilters()
  
  // Client-side filtering logic
  const filteredUsers = users.filter(/* ... */)
  
  return (
    <UserListPresenter 
      users={filteredUsers}
      onFilterChange={setFilters}
    />
  )
}
```

### 3. Composition Pattern

```tsx
// app/(app)/users/page.tsx - Server Component
import { UserListServerContainer } from '@/features/users/components/containers/user-list-server'
import { UserFilters } from '@/features/users/components/containers/user-filters'

export default function UsersPage() {
  return (
    <div>
      {/* Client Component wrapped around Server Component */}
      <UserFilters>
        <UserListServerContainer />
      </UserFilters>
    </div>
  )
}
```

### 4. Server Actions Integration

```tsx
// features/users/actions/update-user.ts
'use server'

import { revalidatePath } from 'next/cache'
import { updateUserInDB } from '../domain/user.service'

export async function updateUserAction(userId: string, data: UpdateUserDto) {
  const result = await updateUserInDB(userId, data)
  revalidatePath(`/users/${userId}`)
  return result
}

// features/users/components/containers/user-edit-form.tsx
'use client'

import { updateUserAction } from '../../actions/update-user'

export function UserEditForm({ user }: { user: User }) {
  async function handleSubmit(formData: FormData) {
    await updateUserAction(user.id, Object.fromEntries(formData))
  }
  
  return <form action={handleSubmit}>...</form>
}
```

## Data Flow Patterns

### 1. Server-First Data Flow
```
Server Component (Page)
    ↓ (props)
Server Container (optional)
    ↓ (props)
Presenter Component
    ↓ (children/props)
Client Container (if interaction needed)
    ↓ (props)
Interactive Presenters
```

### 2. Client-Initiated Data Flow
```
Client Container
    ↓ (Server Action)
Server Action Handler
    ↓ (Database/API)
Revalidation
    ↓
Server Component Re-render
```

## Feature Module Structure

Each feature maintains its internal organization:

```
features/users/
├── actions/              # Server Actions
├── components/           
│   ├── containers/       # Both Server and Client containers
│   │   ├── *-server.tsx  # Server containers
│   │   └── *-client.tsx  # Client containers
│   └── presenters/       # Pure components (work in both)
├── domain/               
│   ├── models/           # TypeScript interfaces/types
│   ├── services/         # Business logic (server-side)
│   └── validators/       # Validation schemas
├── hooks/                # Client-only hooks
└── lib/                  
    ├── api.ts            # API client functions
    └── queries.ts        # Query key factories
```

## Best Practices

### 1. Component Boundaries
- Start with Server Components
- Add `'use client'` only when needed:
  - Event handlers
  - Browser APIs
  - React hooks
  - Real-time updates

### 2. Data Fetching Strategy
- Fetch data in Server Components when possible
- Use Server Actions for mutations
- Client-side fetching only for:
  - Real-time data
  - User-specific dynamic content
  - Infinite scrolling

### 3. Feature Independence
- Features should not import from other features directly
- Shared business logic goes in `shared/lib`
- Cross-feature communication through:
  - Server Actions
  - API routes
  - Event systems

### 4. Progressive Enhancement
```tsx
// Start with server-rendered content
export default async function ProductPage() {
  const products = await getProducts()
  
  return (
    <>
      {/* Static content */}
      <ProductGrid products={products} />
      
      {/* Enhance with client interactivity */}
      <Suspense fallback={<FilterSkeleton />}>
        <ProductFilters />
      </Suspense>
    </>
  )
}
```

### 5. Type Safety Across Boundaries
```tsx
// shared/types/api.ts
export interface SerializableUser {
  id: string
  name: string
  email: string
  createdAt: string // Dates must be serialized
}

// Ensure props are serializable when passing to Client Components
```

## Testing Strategy

### 1. Server Component Tests
```tsx
// Test data fetching and rendering
import { render } from '@testing-library/react'
import UserPage from '@/app/users/[id]/page'

jest.mock('@/features/users/domain/user.service')

test('renders user profile', async () => {
  const component = await UserPage({ params: { id: '1' } })
  // Test the rendered output
})
```

### 2. Client Component Tests
```tsx
// Test interactivity and state
import { render, fireEvent } from '@testing-library/react'
import { UserEditForm } from '@/features/users/components/containers/user-edit-form'

test('handles form submission', () => {
  const { getByRole } = render(<UserEditForm user={mockUser} />)
  // Test interactions
})
```

### 3. Integration Tests
- Test Server Actions with actual database
- Test full page flows with Playwright
- Test API routes separately

## Migration Guidelines

For existing Container/Presentational components:

1. **Evaluate each container**: Can it be a Server Component?
2. **Split containers if needed**: Separate data fetching (Server) from interaction (Client)
3. **Keep presenters pure**: They work in both Server and Client contexts
4. **Gradual migration**: Start with leaf components, work up the tree

## Performance Optimizations

1. **Streaming SSR**: Use Suspense boundaries
2. **Parallel Data Fetching**: Use Promise.all in Server Components
3. **Static Generation**: Use `generateStaticParams` for known routes
4. **Client Component Optimization**: 
   - Lazy load heavy client components
   - Use dynamic imports for code splitting

## Common Patterns

### Data Table with Server-Side Pagination
```tsx
// Server Component
async function UsersTablePage({ searchParams }: { searchParams: { page?: string } }) {
  const page = Number(searchParams.page) || 1
  const { users, total } = await getUsers({ page })
  
  return (
    <DataTable 
      data={users} 
      pagination={
        <PaginationControls currentPage={page} total={total} />
      }
    />
  )
}
```

### Form with Optimistic Updates
```tsx
'use client'
import { useOptimistic } from 'react'

function TodoList({ todos }: { todos: Todo[] }) {
  const [optimisticTodos, addOptimisticTodo] = useOptimistic(
    todos,
    (state, newTodo) => [...state, newTodo]
  )
  
  async function formAction(formData: FormData) {
    const title = formData.get('title')
    addOptimisticTodo({ id: crypto.randomUUID(), title, pending: true })
    await createTodoAction(title)
  }
  
  return <form action={formAction}>...</form>
}
```