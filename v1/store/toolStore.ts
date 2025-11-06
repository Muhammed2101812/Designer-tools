import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface ToolHistoryItem {
  id: string
  toolName: string
  timestamp: number
  data: any
}

interface ToolState {
  currentTool: string | null
  history: ToolHistoryItem[]
  setCurrentTool: (tool: string | null) => void
  addToHistory: (toolName: string, data: any) => void
  clearHistory: () => void
  removeFromHistory: (id: string) => void
  getToolHistory: (toolName: string) => ToolHistoryItem[]
}

export const useToolStore = create<ToolState>()(
  persist(
    (set, get) => ({
      currentTool: null,
      history: [],

      setCurrentTool: (tool) => set({ currentTool: tool }),

      addToHistory: (toolName, data) => {
        const newItem: ToolHistoryItem = {
          id: `${toolName}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          toolName,
          timestamp: Date.now(),
          data,
        }

        set((state) => ({
          history: [newItem, ...state.history].slice(0, 50), // Keep last 50 items
        }))
      },

      clearHistory: () => set({ history: [] }),

      removeFromHistory: (id) =>
        set((state) => ({
          history: state.history.filter((item) => item.id !== id),
        })),

      getToolHistory: (toolName) => {
        const { history } = get()
        return history.filter((item) => item.toolName === toolName)
      },
    }),
    {
      name: 'tool-storage',
      partialize: (state) => ({
        // Persist history but not currentTool
        history: state.history,
      }),
    }
  )
)
