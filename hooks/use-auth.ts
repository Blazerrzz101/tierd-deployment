"use client"

import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { toast } from "sonner"
import { create, StateCreator, StoreApi } from "zustand"
import { supabase } from "@/lib/supabase/client"

interface UserDetails {
  id: string
  email: string
  username?: string
  avatar_url?: string | null
  is_online?: boolean
  is_public?: boolean
  last_seen?: string
  created_at: string
  preferred_accessories?: any
  activity_log?: any
}

interface User {
  id: string
  email: string
  display_name: string
  avatar_url: string | null
  provider: string | null
  last_sign_in: string | null
  preferences: {
    theme: "light" | "dark"
    email_notifications: boolean
    accessibility_mode: boolean
  }
}

interface AuthState {
  user: User | null
  userDetails: UserDetails | null
  isLoading: boolean
  signIn: (provider: "github" | "google") => Promise<void>
  signOut: () => Promise<void>
  updateProfile: (data: Partial<User>) => Promise<void>
}

export const useAuth = create<AuthState>((
  set: StoreApi<AuthState>['setState'],
  get: StoreApi<AuthState>['getState']
): AuthState => ({
  user: null,
  userDetails: null,
  isLoading: true,

  signIn: async (provider: "github" | "google") => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      })

      if (error) throw error
    } catch (error) {
      console.error("Error signing in:", error)
      toast.error("Failed to sign in")
      throw error
    }
  },

  signOut: async () => {
    try {
      // Update user status before signing out
      const { user } = get()
      if (user) {
        await supabase
          .from('users')
          .update({ is_online: false, last_seen: new Date().toISOString() })
          .eq('id', user.id)
      }

      const { error } = await supabase.auth.signOut()
      if (error) throw error

      set({ user: null, userDetails: null })
      toast.success("Signed out successfully")
    } catch (error) {
      console.error("Error signing out:", error)
      toast.error("Failed to sign out")
      throw error
    }
  },

  updateProfile: async (data: Partial<User>) => {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update(data)
        .eq('id', data.id)

      if (error) throw error

      set((state: AuthState) => ({
        ...state,
        user: state.user ? { ...state.user, ...data } : null
      }))
    } catch (error) {
      console.error("Error updating profile:", error)
      toast.error("Failed to update profile")
      throw error
    }
  }
}))

// Initialize auth state
supabase.auth.onAuthStateChange(async (event, session) => {
  useAuth.setState({ isLoading: true })

  if (session?.user) {
    try {
      // Fetch user profile and preferences
      const [{ data: profile }, { data: preferences }] = await Promise.all([
        supabase
          .from('user_profiles')
          .select('*')
          .eq('id', session.user.id)
          .single(),
        supabase
          .from('user_preferences')
          .select('*')
          .eq('user_id', session.user.id)
          .single()
      ])

      useAuth.setState({
        user: {
          id: session.user.id,
          email: session.user.email!,
          ...profile,
          preferences
        },
        isLoading: false
      })

      // Update online status
      await supabase
        .from('users')
        .update({ 
          is_online: true,
          last_seen: new Date().toISOString()
        })
        .eq('id', session.user.id)

    } catch (error) {
      console.error("Error fetching user data:", error)
      useAuth.setState({ user: null, isLoading: false })
    }
  } else {
    useAuth.setState({ user: null, isLoading: false })
  }
})