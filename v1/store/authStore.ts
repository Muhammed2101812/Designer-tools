import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '@supabase/supabase-js'
import type { Profile } from '@/lib/supabase/types'
import { supabase } from '@/lib/supabase/client'
import { clearAllSessionData } from '@/lib/utils/sessionStorage'

interface AuthState {
  user: User | null
  profile: Profile | null
  loading: boolean
  setUser: (user: User | null) => void
  setProfile: (profile: Profile | null) => void
  setLoading: (loading: boolean) => void
  logout: () => Promise<void>
  initialize: () => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      profile: null,
      loading: true,

      setUser: (user) => set({ user }),
      
      setProfile: (profile) => set({ profile }),
      
      setLoading: (loading) => set({ loading }),

      logout: async () => {
        try {
          await supabase.auth.signOut()
          set({ user: null, profile: null })
          
          // Clear all session data (color history, etc.)
          clearAllSessionData()
        } catch (error) {
          console.error('Logout error:', error)
          // Still clear local state even if API call fails
          set({ user: null, profile: null })
          clearAllSessionData()
        }
      },

      initialize: async () => {
        try {
          set({ loading: true })
          
          // Get current session
          const { data: { session }, error } = await supabase.auth.getSession()
          
          if (error) {
            console.error('Session error:', error)
            set({ user: null, profile: null, loading: false })
            return
          }

          if (session?.user) {
            set({ user: session.user })
            
            // Fetch profile data
            const { data: profile, error: profileError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single()

            if (profileError) {
              console.error('Profile fetch error:', profileError)
            } else {
              set({ profile })
            }
          }

          set({ loading: false })
        } catch (error) {
          console.error('Initialize error:', error)
          set({ user: null, profile: null, loading: false })
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        // Only persist user and profile, not loading state
        user: state.user,
        profile: state.profile,
      }),
    }
  )
)
