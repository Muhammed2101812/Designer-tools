# Zustand Store Documentation

This directory contains all Zustand stores for global state management in the Design Kit application.

## Available Stores

### 1. Auth Store (`authStore.ts`)

Manages user authentication state and profile data.

**State:**
- `user`: Current authenticated user (from Supabase Auth)
- `profile`: User profile data from database
- `loading`: Loading state during initialization

**Actions:**
- `setUser(user)`: Update user state
- `setProfile(profile)`: Update profile state
- `setLoading(loading)`: Update loading state
- `logout()`: Sign out user and clear state
- `initialize()`: Initialize auth state on app load

**Usage Example:**
```typescript
'use client'

import { useAuthStore } from '@/store/authStore'

export function UserProfile() {
  const { user, profile, loading, logout } = useAuthStore()

  if (loading) return <div>Loading...</div>
  if (!user) return <div>Not logged in</div>

  return (
    <div>
      <p>Email: {user.email}</p>
      <p>Name: {profile?.full_name}</p>
      <p>Plan: {profile?.plan}</p>
      <button onClick={logout}>Logout</button>
    </div>
  )
}
```

**Persistence:**
User and profile data are persisted to localStorage and restored on app load.

---

### 2. Tool Store (`toolStore.ts`)

Manages tool-specific state and history across the application.

**State:**
- `currentTool`: Currently active tool name
- `history`: Array of recent tool operations (max 50 items)

**Actions:**
- `setCurrentTool(tool)`: Set the active tool
- `addToHistory(toolName, data)`: Add an operation to history
- `clearHistory()`: Clear all history
- `removeFromHistory(id)`: Remove specific history item
- `getToolHistory(toolName)`: Get history for specific tool

**Usage Example:**
```typescript
'use client'

import { useToolStore } from '@/store/toolStore'

export function ColorPicker() {
  const { addToHistory, getToolHistory } = useToolStore()

  const handleColorPick = (color: string) => {
    addToHistory('color-picker', { color, timestamp: Date.now() })
  }

  const recentColors = getToolHistory('color-picker')

  return (
    <div>
      <button onClick={() => handleColorPick('#FF5733')}>
        Pick Color
      </button>
      <div>
        Recent colors: {recentColors.length}
      </div>
    </div>
  )
}
```

**Persistence:**
History is persisted to localStorage (currentTool is not persisted).

---

### 3. UI Store (`uiStore.ts`)

Manages global UI state like sidebar, theme, and modals.

**State:**
- `sidebarOpen`: Sidebar visibility state
- `theme`: Current theme ('light' | 'dark' | 'system')
- `modals`: Object containing modal states

**Actions:**
- `setSidebarOpen(open)`: Set sidebar visibility
- `toggleSidebar()`: Toggle sidebar visibility
- `setTheme(theme)`: Set theme and apply to document
- `openModal(id, data?)`: Open modal with optional data
- `closeModal(id)`: Close modal
- `isModalOpen(id)`: Check if modal is open
- `getModalData(id)`: Get modal data

**Usage Example:**
```typescript
'use client'

import { useUIStore } from '@/store/uiStore'

export function ThemeToggle() {
  const { theme, setTheme } = useUIStore()

  return (
    <div>
      <button onClick={() => setTheme('light')}>Light</button>
      <button onClick={() => setTheme('dark')}>Dark</button>
      <button onClick={() => setTheme('system')}>System</button>
      <p>Current: {theme}</p>
    </div>
  )
}

export function UpgradeModal() {
  const { isModalOpen, openModal, closeModal, getModalData } = useUIStore()
  const isOpen = isModalOpen('upgrade-modal')
  const data = getModalData('upgrade-modal')

  return (
    <>
      <button onClick={() => openModal('upgrade-modal', { plan: 'premium' })}>
        Upgrade
      </button>
      {isOpen && (
        <div>
          <h2>Upgrade to {data?.plan}</h2>
          <button onClick={() => closeModal('upgrade-modal')}>Close</button>
        </div>
      )}
    </>
  )
}
```

**Persistence:**
Theme and sidebar preferences are persisted to localStorage (modals are not persisted).

---

## Initialization

All stores are automatically initialized in the root layout via the `StoreInitializer` component:

```typescript
// app/layout.tsx
import { StoreInitializer } from '@/components/providers/StoreInitializer'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <StoreInitializer />
        {children}
      </body>
    </html>
  )
}
```

The `StoreInitializer` component:
- Initializes auth state and sets up Supabase auth listener
- Applies theme preference to document
- Restores persisted state from localStorage

---

## Best Practices

### 1. Selective Subscriptions

Only subscribe to the state you need to avoid unnecessary re-renders:

```typescript
// ❌ Bad - subscribes to entire store
const store = useAuthStore()

// ✅ Good - subscribes only to user
const user = useAuthStore((state) => state.user)
```

### 2. Actions in Event Handlers

Call actions in event handlers, not during render:

```typescript
// ❌ Bad
const logout = useAuthStore((state) => state.logout)
logout() // Called during render!

// ✅ Good
const logout = useAuthStore((state) => state.logout)
<button onClick={logout}>Logout</button>
```

### 3. Async Actions

The auth store's `logout` and `initialize` actions are async. Handle them properly:

```typescript
const logout = useAuthStore((state) => state.logout)

const handleLogout = async () => {
  try {
    await logout()
    router.push('/login')
  } catch (error) {
    console.error('Logout failed:', error)
  }
}
```

### 4. Type Safety

All stores are fully typed. Use TypeScript to catch errors:

```typescript
// TypeScript will error if you try to set invalid theme
setTheme('invalid') // ❌ Error: Type '"invalid"' is not assignable to type 'Theme'
setTheme('dark') // ✅ OK
```

---

## Testing

A test page is available at `/test-stores` to verify all stores are working correctly. This page demonstrates:
- Auth store state display
- Tool store history management
- UI store theme and modal controls

To test:
1. Run the development server: `npm run dev`
2. Navigate to `http://localhost:3000/test-stores`
3. Interact with the buttons to test each store
4. Check browser localStorage to verify persistence

---

## Troubleshooting

### State not persisting

Check browser localStorage:
- `auth-storage`: Auth store data
- `tool-storage`: Tool store data
- `ui-storage`: UI store data

Clear localStorage if you encounter issues:
```javascript
localStorage.clear()
```

### Theme not applying

Ensure the `StoreInitializer` is included in the root layout and the `setTheme` action is called after the component mounts.

### Auth state not updating

The auth store listens to Supabase auth state changes. Ensure:
1. Supabase client is properly configured
2. `StoreInitializer` is included in root layout
3. Auth state changes are triggered via Supabase Auth methods

---

## Migration Notes

If you need to change the store structure:

1. Update the store interface
2. Update the persist configuration if needed
3. Consider adding a version number to the persist config
4. Clear localStorage for users (or handle migration)

Example with versioning:
```typescript
persist(
  (set, get) => ({ /* store */ }),
  {
    name: 'auth-storage',
    version: 2, // Increment when structure changes
    migrate: (persistedState: any, version: number) => {
      if (version === 1) {
        // Migrate from v1 to v2
        return { ...persistedState, newField: 'default' }
      }
      return persistedState
    },
  }
)
```
