"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"
import { supabase } from "@/lib/supabase/client"

interface AuthState {
  isAuthenticated: boolean
  user: any | null
  session: any | null
  setSession: (session: any) => void
  signOut: () => Promise<void>
  checkAuth: () => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      user: null,
      session: null,
      setSession: (session) => {
        set({
          isAuthenticated: !!session,
          user: session?.user ?? null,
          session
        })
      },
      signOut: async () => {
        await supabase.auth.signOut()
        set({
          isAuthenticated: false,
          user: null,
          session: null
        })
      },
      checkAuth: async () => {
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          set({
            isAuthenticated: true,
            user: session.user,
            session
          })
        } else {
          set({
            isAuthenticated: false,
            user: null,
            session: null
          })
        }
      }
    }),
    {
      name: "auth-storage",
      skipHydration: true
    }
  )
) 