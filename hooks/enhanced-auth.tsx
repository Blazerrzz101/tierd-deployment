"use client"

import { useState, useEffect, createContext, useContext } from 'react'
import { useToast } from '@/components/ui/use-toast'
import { getClientId, clearClientId } from '@/utils/client-id'

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
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const { toast } = useToast()

  // Get authentication status
  const getAuthStatus = async (): Promise<AuthUser | null> => {
    try {
      // For now, we're using mock data/localStorage
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
      clearClientId()
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
        loading: isLoading,
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
export const useEnhancedAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useEnhancedAuth must be used within an AuthProvider')
  }
  return context
}

export default useEnhancedAuth; 