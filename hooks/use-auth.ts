"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { getSupabaseClient } from "@/lib/supabase/client"
import { User } from "@supabase/auth-helpers-nextjs"

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

export function useAuth() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = getSupabaseClient()

  useEffect(() => {
    let mounted = true

    async function getInitialSession() {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        if (error) throw error

        if (mounted) {
          if (session?.user) {
            setUser(session.user)
            await fetchUserDetails(session.user.id)
          }
          setIsLoading(false)
        }
      } catch (error) {
        console.error('Error getting initial session:', error)
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    getInitialSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (mounted) {
        setUser(session?.user ?? null)
        if (session?.user) {
          await fetchUserDetails(session.user.id)
          // Update last_seen
          await supabase
            .from('users')
            .update({ last_seen: new Date().toISOString(), is_online: true })
            .eq('id', session.user.id)
        } else {
          setUserDetails(null)
        }
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [supabase, router])

  async function fetchUserDetails(userId: string) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) throw error

      if (data) {
        setUserDetails(data)
      }
    } catch (error) {
      console.error('Error fetching user details:', error)
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      const { error, data } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      if (data.user) {
        await fetchUserDetails(data.user.id)
      }

      toast.success('Signed in successfully')
      router.push('/')
    } catch (error) {
      console.error('Error signing in:', error)
      toast.error('Failed to sign in')
    }
  }

  const signUp = async (email: string, password: string, username: string) => {
    try {
      const { error: signUpError, data } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: username
          }
        }
      })

      if (signUpError) throw signUpError

      if (data.user) {
        // The trigger will handle user creation in the users table
        toast.success('Account created successfully')
        router.push('/auth/sign-in')
      }
    } catch (error) {
      console.error('Error signing up:', error)
      toast.error('Failed to create account')
    }
  }

  const signOut = async () => {
    try {
      // Update user status before signing out
      if (user) {
        await supabase
          .from('users')
          .update({ is_online: false, last_seen: new Date().toISOString() })
          .eq('id', user.id)
      }

      const { error } = await supabase.auth.signOut()
      if (error) throw error

      setUser(null)
      setUserDetails(null)
      router.push('/')
      toast.success('Signed out successfully')
    } catch (error) {
      console.error('Error signing out:', error)
      toast.error('Failed to sign out')
    }
  }

  return {
    user,
    userDetails,
    isLoading,
    signIn,
    signUp,
    signOut,
  }
}