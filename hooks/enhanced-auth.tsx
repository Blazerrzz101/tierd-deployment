"use client"

import { useState, useEffect, createContext, useContext } from 'react'
import { useToast } from '@/components/ui/use-toast'
import { getClientId, clearClientId } from '@/utils/client-id'
import { supabase } from '@/lib/supabase'

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
  loading: boolean  // Alias for isLoading for backwards compatibility
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Provider component
export const EnhancedAuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const { toast } = useToast()

  // Define getAuthStatus as a standalone function to include in the context
  const getAuthStatus = async (): Promise<AuthUser | null> => {
    setIsLoading(true)
    try {
      // Check for stored user in localStorage
      const storedUser = localStorage.getItem('authUser')
      const storedAuthStatus = localStorage.getItem('isAuthenticated')
      
      if (storedUser && storedAuthStatus === 'true') {
        console.log("Found stored authenticated user")
        const userData = JSON.parse(storedUser) as AuthUser
        setUser(userData)
        setIsAuthenticated(true)
        return userData
      } else {
        console.log("No stored authenticated user, checking session")
        // Check for Supabase session as backup
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session?.user) {
          console.log("Found active Supabase session")
          const userData: AuthUser = {
            id: session.user.id,
            email: session.user.email,
            name: session.user.user_metadata?.name || 'User',
            avatar_url: session.user.user_metadata?.avatar_url || '/placeholders/user.svg',
            isAnonymous: false
          }
          
          // Store in localStorage
          localStorage.setItem('authUser', JSON.stringify(userData))
          localStorage.setItem('isAuthenticated', 'true')
          
          setUser(userData)
          setIsAuthenticated(true)
          return userData
        } else {
          console.log("No authenticated user found")
          setUser(null)
          setIsAuthenticated(false)
          return null
        }
      }
    } catch (error) {
      console.error("Auth status error:", error)
      setUser(null)
      setIsAuthenticated(false)
      return null
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    getAuthStatus()
  }, [])

  // Sign in function
  const signIn = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true)
    try {
      console.log(`Attempting to sign in user: ${email}`)
      
      // Attempt to sign in with Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      if (error) throw error
      
      if (data.user) {
        const userData = {
          id: data.user.id,
          email: data.user.email,
          name: data.user.user_metadata?.name || 'User',
          avatar_url: data.user.user_metadata?.avatar_url || '/placeholders/user.svg',
          isAnonymous: false
        }
        
        // Store in localStorage
        localStorage.setItem('authUser', JSON.stringify(userData))
        localStorage.setItem('isAuthenticated', 'true')
        
        setUser(userData)
        setIsAuthenticated(true)
        
        console.log(`User signed in successfully: ${userData.id} (${userData.name}) at ${new Date().toISOString()}`)
        
        toast({
          title: 'Signed in successfully',
        })
        
        return true
      }
      
      setUser(null)
      setIsAuthenticated(false)
      return false
    } catch (error) {
      console.error('Sign in error:', error)
      setUser(null)
      setIsAuthenticated(false)
      
      toast({
        title: 'Sign in failed',
        description: error instanceof Error ? error.message : 'Invalid email or password',
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
        avatar_url: '/placeholders/user.svg',
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
      
      // If Supabase signup was successful, show success message and redirect
      toast({
        title: 'Verification email sent',
        description: 'Please check your email to verify your account',
      })
      
      // Redirect to verify email page with email parameter
      window.location.href = `/auth/verify-email?email=${encodeURIComponent(email)}`
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
      console.log("Signing out user");
      
      // Sign out from Supabase
      await supabase.auth.signOut()
      
      // Clear local storage
      localStorage.removeItem('authUser')
      localStorage.removeItem('isAuthenticated')
      
      // Update state
      setUser(null)
      setIsAuthenticated(false)
      
      console.log("User signed out successfully");
    } catch (error) {
      console.error("Error signing out:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        loading: isLoading,
        signIn,
        signUp,
        signOut,
        getAuthStatus,
        isAuthenticated,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// Export an alias for backward compatibility
export const AuthProvider = EnhancedAuthProvider;

// Hook for using the auth context
export const useEnhancedAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useEnhancedAuth must be used within an AuthProvider')
  }
  return context
}

export default useEnhancedAuth; 