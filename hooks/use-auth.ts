"use client"

import { useState, useEffect } from "react"
import { UserProfile } from "@/types/user"
import { supabase } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { AuthError, Session, User } from "@supabase/supabase-js"

export function useAuth() {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    let mounted = true

    // Check active sessions and sets up subscription
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session?.user && mounted) {
          await fetchUserProfile(session.user.id)
        } else if (mounted) {
          setUser(null)
          setLoading(false)
        }

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
          console.log('Auth state changed:', event, session?.user?.id)
          
          if (session?.user && mounted) {
            await fetchUserProfile(session.user.id)
          } else if (mounted) {
            setUser(null)
            setLoading(false)
          }
        })

        return () => {
          mounted = false
          subscription.unsubscribe()
        }
      } catch (error) {
        console.error('Error initializing auth:', error)
        if (mounted) {
          setLoading(false)
        }
      }
    }

    initializeAuth()
  }, [])

  async function fetchUserProfile(userId: string) {
    try {
      setLoading(true)
      console.log('Fetching user profile for ID:', userId)
      
      const { data: authUser } = await supabase.auth.getUser()
      if (!authUser?.user) {
        throw new Error('No authenticated user found')
      }

      // First, check if user profile exists
      const { data: existingProfile, error: fetchError } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .single()

      if (fetchError && fetchError.code === "PGRST116") { // Record not found
        // Create new profile with proper typing
        const newProfile = {
          id: userId,
          email: authUser.user.email || '',
          username: authUser.user.user_metadata?.username || authUser.user.email?.split('@')[0] || 'user',
          avatar_url: authUser.user.user_metadata?.avatar_url || null,
          is_online: true,
          is_public: true,
          preferred_accessories: [],
          activity_log: [],
          created_at: new Date().toISOString(),
          last_seen: new Date().toISOString()
        }

        const { error: createError } = await supabase
          .from("users")
          .insert(newProfile)

        if (createError) throw createError
        
        setUser(transformProfileData(newProfile))
      } else if (existingProfile) {
        // Update last seen
        const { error: updateError } = await supabase
          .from("users")
          .update({ 
            last_seen: new Date().toISOString(), 
            is_online: true 
          })
          .eq("id", userId)

        if (updateError) {
          console.warn('Failed to update last seen:', updateError)
        }

        setUser(transformProfileData(existingProfile))
      }
    } catch (error) {
      console.error("Error in fetchUserProfile:", error)
      toast.error("Failed to load user profile")
    } finally {
      setLoading(false)
    }
  }

  const transformProfileData = (profile: any): UserProfile => ({
    id: profile.id,
    username: profile.username,
    email: profile.email,
    avatarUrl: profile.avatar_url,
    isOnline: profile.is_online,
    isPublic: profile.is_public,
    preferredAccessories: profile.preferred_accessories || [],
    activityLog: profile.activity_log || [],
    createdAt: new Date(profile.created_at).getTime(),
    lastSeen: new Date(profile.last_seen).getTime(),
  })

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true)
      const { error, data } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      if (error) throw error
      
      if (data.user) {
        await fetchUserProfile(data.user.id)
        toast.success("Welcome back!")
        router.refresh()
        router.push("/")
      }
    } catch (error) {
      console.error("Error signing in:", error)
      toast.error("Invalid email or password")
    } finally {
      setLoading(false)
    }
  }

  const signUp = async (email: string, password: string, username: string) => {
    try {
      setLoading(true)
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { username }
        }
      })
      
      if (authError) throw authError

      if (authData.user) {
        await fetchUserProfile(authData.user.id)
        toast.success("Welcome to the community!")
        router.refresh()
        router.push("/")
      }
    } catch (error) {
      console.error("Error signing up:", error)
      toast.error("Failed to create account")
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    try {
      setLoading(true)
      if (user) {
        await supabase
          .from("users")
          .update({ 
            is_online: false, 
            last_seen: new Date().toISOString() 
          })
          .eq("id", user.id)
      }

      await supabase.auth.signOut()
      setUser(null)
      router.refresh()
      router.push("/")
      toast.success("Signed out successfully!")
    } catch (error) {
      console.error("Error signing out:", error)
      toast.error("Failed to sign out")
    } finally {
      setLoading(false)
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