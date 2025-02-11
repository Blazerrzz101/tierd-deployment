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
  signInWithEmail: (email: string, password: string) => Promise<void>
  signInWithProvider: (provider: "github" | "google") => Promise<void>
  signUp: (email: string, password: string, username: string) => Promise<void>
  signOut: () => Promise<void>
  updateProfile: (data: Partial<User>) => Promise<void>
  resetPassword: (email: string) => Promise<void>
}

export const useAuth = create<AuthState>((
  set: StoreApi<AuthState>['setState'],
  get: StoreApi<AuthState>['getState']
): AuthState => ({
  user: null,
  userDetails: null,
  isLoading: true,

  signInWithEmail: async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) throw error

      // Fetch user profile after successful sign-in
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', data.user.id)
        .single()

      if (profileError) {
        console.error("Error fetching user profile:", profileError)
        throw profileError
      }

      set({
        user: {
          id: data.user.id,
          email: data.user.email!,
          ...profile
        }
      })

      toast.success("Signed in successfully")
    } catch (error: any) {
      console.error("Error signing in:", error)
      toast.error(error.message || "Failed to sign in")
      throw error
    }
  },

  signInWithProvider: async (provider: "github" | "google") => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      })

      if (error) throw error
    } catch (error: any) {
      console.error("Error signing in with provider:", error)
      toast.error(error.message || "Failed to sign in")
      throw error
    }
  },

  signUp: async (email: string, password: string, username: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username
          }
        }
      })

      if (error) throw error

      // Create user profile
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert([
          {
            id: data.user!.id,
            email,
            username,
            display_name: username,
            created_at: new Date().toISOString()
          }
        ])

      if (profileError) throw profileError

      toast.success("Account created successfully", {
        description: "Please check your email to verify your account."
      })
    } catch (error: any) {
      console.error("Error signing up:", error)
      toast.error(error.message || "Failed to create account")
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
    } catch (error: any) {
      console.error("Error signing out:", error)
      toast.error(error.message || "Failed to sign out")
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

      toast.success("Profile updated successfully")
    } catch (error: any) {
      console.error("Error updating profile:", error)
      toast.error(error.message || "Failed to update profile")
      throw error
    }
  },

  resetPassword: async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`
      })

      if (error) throw error

      toast.success("Password reset email sent", {
        description: "Please check your email for further instructions."
      })
    } catch (error: any) {
      console.error("Error resetting password:", error)
      toast.error(error.message || "Failed to send reset email")
      throw error
    }
  }
}))

// Initialize auth state with improved error handling and logging
supabase.auth.onAuthStateChange(async (event, session) => {
  useAuth.setState({ isLoading: true })
  console.log(`Auth state changed: ${event}`)

  try {
    if (session?.user) {
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

      console.log('User session restored and profile updated')
    } else {
      useAuth.setState({ user: null, isLoading: false })
      console.log('No active session found')
    }
  } catch (error) {
    console.error("Error in auth state change handler:", error)
    useAuth.setState({ user: null, isLoading: false })
  }
})