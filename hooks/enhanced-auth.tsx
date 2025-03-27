"use client"

import { useState, useEffect, createContext, useContext } from 'react'
import { toast } from "@/components/ui/use-toast"
import { getClientId, clearClientId } from '@/utils/client-id'
import { supabase } from '@/lib/supabase'
import { useRouter } from "next/navigation";
import { 
  User,
  Session,
  createClientComponentClient 
} from "@supabase/auth-helpers-nextjs";

// Define user interface
export interface AuthUser {
  id: string
  email?: string
  name?: string
  avatar_url?: string
  isAnonymous: boolean
}

interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  lastRefreshed: number;
  error: Error | null;
}

interface EnhancedAuthContextType extends AuthState {
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<boolean>;
  checkSession: () => Promise<boolean>;
}

// Create context
const EnhancedAuthContext = createContext<EnhancedAuthContextType | undefined>(undefined)

// Provider component
export const EnhancedAuthProvider = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const supabase = createClientComponentClient();

  // State with detailed auth information
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    isLoading: true,
    isAuthenticated: false,
    lastRefreshed: 0,
    error: null
  });

  // Initialize auth state on component mount
  useEffect(() => {
    // Check for cached auth data first for immediate UI response
    try {
      const cachedAuthState = localStorage.getItem('tierd-auth-state');
      if (cachedAuthState) {
        const parsedState = JSON.parse(cachedAuthState);
        if (parsedState.user && parsedState.timestamp) {
          const cacheAge = Date.now() - parsedState.timestamp;
          
          // Only use cache if it's relatively fresh (less than 5 minutes old)
          if (cacheAge < 5 * 60 * 1000) {
            setAuthState(prev => ({
              ...prev,
              user: parsedState.user,
              isAuthenticated: true,
              isLoading: false
            }));
          }
        }
      }
    } catch (error) {
      console.error('Error reading cached auth state:', error);
    }
    
    // Check for actual session data
    async function getSession() {
      try {
        // Get session and subscribe to changes
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          throw error;
        }
        
        handleSessionChange(session);
        
        // Subscribe to auth changes
        const { data: { subscription } } = await supabase.auth.onAuthStateChange(
          (_event, session) => {
            handleSessionChange(session);
          }
        );
        
        return () => {
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error('Error getting session:', error);
        setAuthState(prev => ({
          ...prev,
          isLoading: false,
          error: error instanceof Error ? error : new Error('Failed to get session')
        }));
      }
    }
    
    const unsubscribe = getSession();
    
    // Clean up subscription
    return () => {
      unsubscribe.then(fn => fn && fn());
    };
  }, [supabase]);
  
  // Handle session changes
  const handleSessionChange = (session: Session | null) => {
    try {
      setAuthState(prev => ({
        ...prev,
        session,
        user: session?.user || null,
        isAuthenticated: !!session,
        isLoading: false,
        lastRefreshed: Date.now(),
        error: null
      }));
      
      // Cache auth state for quick loading
      if (session && typeof window !== 'undefined') {
        const cacheData = {
          user: session.user,
          timestamp: Date.now(),
          expires: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
        };
        
        localStorage.setItem('tierd-auth-state', JSON.stringify(cacheData));
        localStorage.setItem('lastAuthCheck', Date.now().toString());
      }
    } catch (error) {
      console.error('Error updating auth state:', error);
    }
  };
  
  // Sign in with email and password
  const signIn = async (email: string, password: string) => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) throw error;
      
      handleSessionChange(data.session);
      
      toast({
        title: "Welcome back!",
        description: "You have successfully signed in."
      });
      
      // Redirect to home page after successful sign in
      router.push("/");
    } catch (error) {
      console.error('Sign in error:', error);
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error : new Error('Failed to sign in')
      }));
      
      toast({
        title: "Sign in failed",
        description: error instanceof Error ? error.message : "An error occurred during sign in",
        variant: "destructive"
      });
    }
  };
  
  // Sign up with email and password
  const signUp = async (email: string, password: string) => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password
      });
      
      if (error) throw error;
      
      // Handle response
      if (data.session) {
        handleSessionChange(data.session);
        
        toast({
          title: "Welcome to Tier'd!",
          description: "Your account has been created successfully."
        });
        
        // Redirect to home page after successful sign up
        router.push("/");
      } else {
        // Email confirmation required
        toast({
          title: "Check your email",
          description: "A confirmation link has been sent to your email."
        });
        
        // Redirect to confirmation page
        router.push("/auth/confirm");
      }
    } catch (error) {
      console.error('Sign up error:', error);
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error : new Error('Failed to sign up')
      }));
      
      toast({
        title: "Sign up failed",
        description: error instanceof Error ? error.message : "An error occurred during sign up",
        variant: "destructive"
      });
    }
  };
  
  // Sign out
  const signOut = async () => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));
      
      const { error } = await supabase.auth.signOut();
      
      if (error) throw error;
      
      // Clear cached auth state
      localStorage.removeItem('tierd-auth-state');
      localStorage.removeItem('lastAuthCheck');
      
      setAuthState({
        user: null,
        session: null,
        isLoading: false,
        isAuthenticated: false,
        lastRefreshed: Date.now(),
        error: null
      });
      
      toast({
        title: "Signed out",
        description: "You have been signed out successfully."
      });
      
      // Redirect to home page after sign out
      router.push("/");
    } catch (error) {
      console.error('Sign out error:', error);
      
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error : new Error('Failed to sign out')
      }));
      
      toast({
        title: "Sign out failed",
        description: error instanceof Error ? error.message : "An error occurred during sign out",
        variant: "destructive"
      });
    }
  };
  
  // Refresh the session - returns true if successful
  const refreshSession = async (): Promise<boolean> => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));
      
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) throw error;
      
      if (data.session) {
        handleSessionChange(data.session);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Session refresh error:', error);
      
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error : new Error('Failed to refresh session')
      }));
      
      return false;
    }
  };
  
  // Check if session is still valid - returns true if valid
  const checkSession = async (): Promise<boolean> => {
    try {
      const { data, error } = await supabase.auth.getSession();
      
      if (error) throw error;
      
      if (data.session) {
        // Update session if the current one isn't the same
        if (data.session.access_token !== authState.session?.access_token) {
          handleSessionChange(data.session);
        }
        return true;
      }
      
      // No valid session
      if (authState.isAuthenticated) {
        // We thought we were authenticated but we're not - update state
        setAuthState(prev => ({
          ...prev,
          user: null,
          session: null,
          isAuthenticated: false,
          lastRefreshed: Date.now()
        }));
      }
      
      return false;
    } catch (error) {
      console.error('Session check error:', error);
      return false;
    }
  };
  
  // Add periodic session check
  useEffect(() => {
    // Skip if not authenticated or still loading
    if (!authState.isAuthenticated || authState.isLoading) return;
    
    // Check for session changes every 5 minutes
    const interval = setInterval(() => {
      checkSession();
    }, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [authState.isAuthenticated, authState.isLoading]);
  
  // Context value
  const value = {
    ...authState,
    signIn,
    signUp,
    signOut,
    refreshSession,
    checkSession
  };
  
  return (
    <EnhancedAuthContext.Provider value={value}>
      {children}
    </EnhancedAuthContext.Provider>
  );
}

// Hook for using the auth context
export const useEnhancedAuth = () => {
  const context = useContext(EnhancedAuthContext)
  if (context === undefined) {
    throw new Error('useEnhancedAuth must be used within an AuthProvider')
  }
  return context
}

export default useEnhancedAuth; 