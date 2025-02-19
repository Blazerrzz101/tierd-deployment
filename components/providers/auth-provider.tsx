"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase/client"
import { toast } from "sonner"

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

interface AuthContextType {
  user: User | null
  isLoading: boolean
  signInWithEmail: (email: string, password: string) => Promise<void>
  signInWithProvider: (provider: "github" | "google") => Promise<void>
  signUp: (email: string, password: string, username: string) => Promise<void>
  signOut: () => Promise<void>
  updateProfile: (data: Partial<User>) => Promise<void>
  resetPassword: (email: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        // Fetch user profile
        const { data: profile, error } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()

        if (!error && profile) {
          setUser({
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
          })
        }
      } else if (event === "SIGNED_OUT") {
        setUser(null)
      }
      setIsLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const signInWithEmail = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) throw error

      // Fetch user profile
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', data.user.id)
        .single()

      if (profileError) throw profileError

      setUser({
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
      })

      toast.success("Signed in successfully")
      router.push("/")
    } catch (error: any) {
      console.error("Error signing in:", error)
      toast.error(error.message || "Failed to sign in")
      throw error
    }
  }

  const signInWithProvider = async (provider: "github" | "google") => {
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
  }

  const signUp = async (email: string, password: string, username: string) => {
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

      if (profileError) throw profileError

      toast.success("Account created successfully! Please check your email to verify your account.")
      router.push("/auth/verify")
    } catch (error: any) {
      console.error("Error signing up:", error)
      toast.error(error.message || "Failed to create account")
      throw error
    }
  }

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error

      setUser(null)
      toast.success("Signed out successfully")
      router.push("/")
    } catch (error: any) {
      console.error("Error signing out:", error)
      toast.error(error.message || "Failed to sign out")
      throw error
    }
  }

  const updateProfile = async (data: Partial<User>) => {
    try {
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

      setUser({
        ...user,
        ...data
      })

      toast.success("Profile updated successfully")
    } catch (error: any) {
      console.error("Error updating profile:", error)
      toast.error(error.message || "Failed to update profile")
      throw error
    }
  }

  const resetPassword = async (email: string) => {
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

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        signInWithEmail,
        signInWithProvider,
        signUp,
        signOut,
        updateProfile,
        resetPassword
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
} 