import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type Theme = 'light' | 'dark' | 'system'

interface Modal {
  id: string
  isOpen: boolean
  data?: any
}

interface UIState {
  sidebarOpen: boolean
  theme: Theme
  modals: Record<string, Modal>
  setSidebarOpen: (open: boolean) => void
  toggleSidebar: () => void
  setTheme: (theme: Theme) => void
  openModal: (id: string, data?: any) => void
  closeModal: (id: string) => void
  isModalOpen: (id: string) => boolean
  getModalData: (id: string) => any
}

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      sidebarOpen: false,
      theme: 'system',
      modals: {},

      setSidebarOpen: (open) => set({ sidebarOpen: open }),

      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

      setTheme: (theme) => {
        set({ theme })
        // Theme application is handled by ThemeProvider
      },

      openModal: (id, data) =>
        set((state) => ({
          modals: {
            ...state.modals,
            [id]: { id, isOpen: true, data },
          },
        })),

      closeModal: (id) =>
        set((state) => ({
          modals: {
            ...state.modals,
            [id]: { ...state.modals[id], isOpen: false },
          },
        })),

      isModalOpen: (id) => {
        const { modals } = get()
        return modals[id]?.isOpen ?? false
      },

      getModalData: (id) => {
        const { modals } = get()
        return modals[id]?.data
      },
    }),
    {
      name: 'ui-storage',
      partialize: (state) => ({
        // Persist theme and sidebar preference, but not modals
        theme: state.theme,
        sidebarOpen: state.sidebarOpen,
      }),
    }
  )
)
