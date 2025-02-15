"use client"

import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { toast } from "sonner"
import { create } from "zustand"
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

export const useAuth = create<AuthState>((set, get) => ({
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
          display_name: profile.username || data.user.email!.split('@')[0],
          avatar_url: profile.avatar_url || null,
          provider: data.user.app_metadata.provider || null,
          last_sign_in: data.user.last_sign_in_at || null,
          preferences: profile.preferences || {
            theme: "dark",
            email_notifications: true,
            accessibility_mode: false
          }
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
        .insert({
          id: data.user!.id,
          username,
          email,
          preferences: {
            theme: "dark",
            email_notifications: true,
            accessibility_mode: false
          }
        })

      if (profileError) {
        console.error("Error creating user profile:", profileError)
        throw profileError
      }

      toast.success("Account created successfully! Please check your email to verify your account.")
    } catch (error: any) {
      console.error("Error signing up:", error)
      toast.error(error.message || "Failed to create account")
      throw error
    }
  },

  signOut: async () => {
    try {
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
      const user = get().user
      if (!user) throw new Error("No user logged in")

      const { error } = await supabase
        .from('user_profiles')
        .update({
          username: data.display_name,
          avatar_url: data.avatar_url,
          preferences: data.preferences
        })
        .eq('id', user.id)

      if (error) throw error

      set({
        user: {
          ...user,
          ...data
        }
      })

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

      toast.success("Password reset email sent. Please check your inbox.")
    } catch (error: any) {
      console.error("Error resetting password:", error)
      toast.error(error.message || "Failed to send reset email")
      throw error
    }
  }
}))

// Subscribe to auth state changes
if (typeof window !== "undefined") {
  supabase.auth.onAuthStateChange(async (event, session) => {
    console.log("Auth state changed:", event)

    if (event === "SIGNED_IN" && session?.user) {
      // Fetch user profile
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (!error && profile) {
        useAuth.setState({
          user: {
            id: session.user.id,
            email: session.user.email!,
            display_name: profile.username || session.user.email!.split('@')[0],
            avatar_url: profile.avatar_url || null,
            provider: session.user.app_metadata.provider || null,
            last_sign_in: session.user.last_sign_in_at || null,
            preferences: profile.preferences || {
              theme: "dark",
              email_notifications: true,
              accessibility_mode: false
            }
          }
        })
      }
    } else if (event === "SIGNED_OUT") {
      useAuth.setState({ user: null, userDetails: null })
    }
  })
}