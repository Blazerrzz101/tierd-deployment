"use client"

import { useState, useEffect, createContext, useContext } from 'react'
import { toast } from "sonner"
import { create } from "zustand"
import { supabase } from "@/lib/supabase/client"
import { User as SupabaseUser, AuthError } from '@supabase/supabase-js'
import { useToast } from '@/components/ui/use-toast'
import { useVote } from './use-vote'

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
    theme: 'dark' | 'light'
    email_notifications: boolean
    accessibility_mode: boolean
  }
}

interface AuthState {
  user: User | null
  userDetails: User | null
  isLoading: boolean
  signInWithEmail: (email: string, password: string) => Promise<void>
  signInWithProvider: (provider: "github" | "google") => Promise<void>
  signUp: (email: string, password: string, username: string) => Promise<void>
  signOut: () => Promise<void>
  updateProfile: (data: Partial<User>) => Promise<void>
  resetPassword: (email: string) => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => ({
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
        useAuthStore.setState({
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
      useAuthStore.setState({ user: null, userDetails: null })
    }
  })
}

// Export the hook that combines Zustand store with additional React state
export function useAuth() {
  const store = useAuthStore()
  const [error, setError] = useState<AuthError | null>(null)
  
  // Combine the store state with local error state
  return {
    ...store,
    error,
    setError
  }
}

// Define user interface
export interface AuthUser {
  id: string
  email?: string
  name?: string
  avatar_url?: string
  isAnonymous: boolean
}

// Define context
interface AuthContextType {
  user: AuthUser | null
  isLoading: boolean
  signIn: (email: string, password: string) => Promise<boolean>
  signUp: (email: string, password: string, name: string) => Promise<boolean>
  signOut: () => Promise<void>
  getAuthStatus: () => Promise<AuthUser | null>
  isAuthenticated: boolean
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Provider component
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const { toast } = useToast()
  const { getClientId } = useVote()

  // Get authentication status
  const getAuthStatus = async (): Promise<AuthUser | null> => {
    try {
      // For now, we're using mock data/localStorage
      // In a real app, this would call a Supabase/Firebase auth endpoint
      const storedUser = localStorage.getItem('authUser')
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser)
        return parsedUser
      }
      
      // If no authenticated user found, create an anonymous one
      const clientId = getClientId()
      const anonymousUser: AuthUser = {
        id: clientId,
        isAnonymous: true
      }
      
      return anonymousUser
    } catch (error) {
      console.error('Error checking auth status:', error)
      return null
    }
  }

  // Sign in function
  const signIn = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true)
    try {
      // This would normally call your auth API
      // For now, we'll simulate a successful login
      if (!email || !password) {
        throw new Error('Email and password are required')
      }
      
      // Generate a mock user
      const mockUser: AuthUser = {
        id: `user_${Math.random().toString(36).substring(2, 10)}`,
        email,
        name: email.split('@')[0],
        isAnonymous: false
      }
      
      // Get the client ID that was used for anonymous voting
      const clientId = getClientId()
      
      // In a real app, you'd make an API call to merge votes
      // For now, we'll simulate it with a delayed response
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Store the user in localStorage
      localStorage.setItem('authUser', JSON.stringify(mockUser))
      
      // Make an API call to associate this client ID with the user
      await fetch('/api/auth/link-anonymous-votes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: mockUser.id,
          clientId: clientId,
        }),
      })
      
      setUser(mockUser)
      
      toast({
        title: 'Signed in successfully',
        description: `Welcome back, ${mockUser.name || mockUser.email}!`,
      })
      
      return true
    } catch (error) {
      console.error('Sign in error:', error)
      
      toast({
        title: 'Sign in failed',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive',
      })
      
      return false
    } finally {
      setIsLoading(false)
    }
  }

  // Sign up function
  const signUp = async (email: string, password: string, name: string): Promise<boolean> => {
    setIsLoading(true)
    try {
      // This would normally call your auth API
      if (!email || !password) {
        throw new Error('Email and password are required')
      }
      
      // Generate a mock user
      const mockUser: AuthUser = {
        id: `user_${Math.random().toString(36).substring(2, 10)}`,
        email,
        name: name || email.split('@')[0],
        isAnonymous: false
      }
      
      // Get the client ID that was used for anonymous voting
      const clientId = getClientId()
      
      // In a real app, you'd make an API call to create an account
      await new Promise(resolve => setTimeout(resolve, 800))
      
      // Store the user in localStorage
      localStorage.setItem('authUser', JSON.stringify(mockUser))
      
      // Make an API call to associate this client ID with the new user
      await fetch('/api/auth/link-anonymous-votes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: mockUser.id,
          clientId: clientId,
        }),
      })
      
      setUser(mockUser)
      
      toast({
        title: 'Account created successfully',
        description: `Welcome, ${mockUser.name || mockUser.email}!`,
      })
      
      return true
    } catch (error) {
      console.error('Sign up error:', error)
      
      toast({
        title: 'Sign up failed',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive',
      })
      
      return false
    } finally {
      setIsLoading(false)
    }
  }

  // Sign out function
  const signOut = async (): Promise<void> => {
    setIsLoading(true)
    try {
      // This would normally call your auth API
      localStorage.removeItem('authUser')
      
      // Generate a new client ID to prevent vote manipulation
      localStorage.removeItem('clientId')
      getClientId() // This generates a new ID
      
      setUser(null)
      
      toast({
        title: 'Signed out successfully',
      })
    } catch (error) {
      console.error('Sign out error:', error)
      
      toast({
        title: 'Sign out failed',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Initial authentication check
  useEffect(() => {
    async function initAuth() {
      setIsLoading(true)
      try {
        const authStatus = await getAuthStatus()
        setUser(authStatus)
      } catch (error) {
        console.error('Auth initialization error:', error)
      } finally {
        setIsLoading(false)
      }
    }
    
    initAuth()
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        signIn,
        signUp,
        signOut,
        getAuthStatus,
        isAuthenticated: !!user && !user.isAnonymous,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// Hook for using the auth context
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}