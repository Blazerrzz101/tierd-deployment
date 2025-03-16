"use client"

import { createBrowserClient } from '@supabase/ssr'
import { Database } from './database.types'

// Initialize the Supabase auth client
export const createClient = () => {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    }
  )
}

// Helper function to get the current session
export const getCurrentSession = async () => {
  const supabase = createClient()
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    if (error) throw error
    return session
  } catch (error) {
    console.error('Error getting session:', error)
    return null
  }
}

// Helper function to get the current user
export const getCurrentUser = async () => {
  const session = await getCurrentSession()
  return session?.user ?? null
}

// Helper function to sign out
export const signOut = async () => {
  const supabase = createClient()
  try {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    return true
  } catch (error) {
    console.error('Error signing out:', error)
    return false
  }
} 