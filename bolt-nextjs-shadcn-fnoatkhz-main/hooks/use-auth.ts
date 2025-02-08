"use client"

import { useState, useEffect } from "react"
import { UserProfile } from "@/types/user"
import { supabase } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

export function useAuth() {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Check active sessions and sets up subscription
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        fetchUserProfile(session.user.id)
      } else {
        setLoading(false)
      }
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        fetchUserProfile(session.user.id)
      } else {
        setUser(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function fetchUserProfile(userId: string) {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .single()

      if (error) throw error

      if (data) {
        setUser({
          id: data.id,
          username: data.username,
          email: data.email,
          avatarUrl: data.avatar_url,
          isOnline: data.is_online,
          isPublic: data.is_public,
          preferredAccessories: [],
          activityLog: [],
          createdAt: new Date(data.created_at).getTime(),
          lastSeen: new Date(data.last_seen).getTime(),
        })
      }
    } catch (error) {
      console.error("Error fetching user profile:", error)
      toast.error("Failed to load user profile")
    } finally {
      setLoading(false)
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error
      router.push("/dashboard")
      toast.success("Signed in successfully!")
    } catch (error) {
      console.error("Error signing in:", error)
      toast.error("Invalid email or password")
    }
  }

  const signUp = async (email: string, password: string, username: string) => {
    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      })
      if (authError) throw authError

      if (authData.user) {
        // Create user profile
        const { error: profileError } = await supabase.from("users").insert([
          {
            id: authData.user.id,
            username,
            email,
            is_online: true,
          },
        ])
        if (profileError) throw profileError

        router.push("/dashboard")
        toast.success("Account created successfully!")
      }
    } catch (error) {
      console.error("Error signing up:", error)
      toast.error("Failed to create account")
    }
  }

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      router.push("/")
      toast.success("Signed out successfully!")
    } catch (error) {
      console.error("Error signing out:", error)
      toast.error("Failed to sign out")
    }
  }

  return {
    user,
    loading,
    signIn,
    signUp,
    signOut,
  }
}