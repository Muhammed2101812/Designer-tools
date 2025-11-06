/**
 * Verification script for Zustand stores
 * Checks that all stores are properly exported and typed
 */

import { useAuthStore } from '../store/authStore'
import { useToolStore } from '../store/toolStore'
import { useUIStore } from '../store/uiStore'

console.log('✓ All stores imported successfully')

// Type checks
type AuthStore = ReturnType<typeof useAuthStore.getState>
type ToolStore = ReturnType<typeof useToolStore.getState>
type UIStore = ReturnType<typeof useUIStore.getState>

// Verify store methods exist
const authMethods: (keyof AuthStore)[] = ['user', 'profile', 'loading', 'setUser', 'setProfile', 'setLoading', 'logout', 'initialize']
const toolMethods: (keyof ToolStore)[] = ['currentTool', 'history', 'setCurrentTool', 'addToHistory', 'clearHistory', 'removeFromHistory', 'getToolHistory']
const uiMethods: (keyof UIStore)[] = ['sidebarOpen', 'theme', 'modals', 'setSidebarOpen', 'toggleSidebar', 'setTheme', 'openModal', 'closeModal', 'isModalOpen', 'getModalData']

console.log('✓ Auth store methods:', authMethods.join(', '))
console.log('✓ Tool store methods:', toolMethods.join(', '))
console.log('✓ UI store methods:', uiMethods.join(', '))

console.log('\n✅ All stores verified successfully!')
console.log('\nTo test the stores in the browser:')
console.log('1. Run: npm run dev')
console.log('2. Navigate to: http://localhost:3000/test-stores')
console.log('3. Interact with the UI to test each store')
