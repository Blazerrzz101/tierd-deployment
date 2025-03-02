"use client";

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { getClientId, clearClientId, generateClientId } from '@/utils/client-id';

// Define user interface
export interface EnhancedUser {
  id: string;
  email?: string;
  name?: string;
  avatar_url?: string;
  isAnonymous: boolean;
}

// Define context
interface EnhancedAuthContextType {
  user: EnhancedUser | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<boolean>;
  signUp: (email: string, password: string, name: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  getAuthStatus: () => Promise<EnhancedUser | null>;
  isAuthenticated: boolean;
  remainingAnonymousVotes: number;
}

// Create context
const EnhancedAuthContext = createContext<EnhancedAuthContextType | undefined>(undefined);

// Provider component
export function EnhancedAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<EnhancedUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [remainingAnonymousVotes, setRemainingAnonymousVotes] = useState<number>(5);
  const { toast } = useToast();

  // Get authentication status
  const getAuthStatus = async (): Promise<EnhancedUser | null> => {
    try {
      // For now, we're using mock data/localStorage
      // In a real app, this would call a Supabase/Firebase auth endpoint
      const storedUser = localStorage.getItem('authUser');
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        return parsedUser;
      }
      
      // If no authenticated user found, create an anonymous one
      const clientId = getClientId();
      const anonymousUser: EnhancedUser = {
        id: clientId,
        isAnonymous: true
      };
      
      return anonymousUser;
    } catch (error) {
      console.error('Error checking auth status:', error);
      return null;
    }
  };

  // Get remaining anonymous votes
  const fetchRemainingVotes = async () => {
    try {
      if (!user || !user.isAnonymous) {
        // If user is authenticated, they don't have a limit
        setRemainingAnonymousVotes(999);
        return;
      }
      
      const clientId = getClientId();
      const response = await fetch(`/api/vote/remaining-votes?clientId=${clientId}`);
      
      if (response.ok) {
        const data = await response.json();
        setRemainingAnonymousVotes(data.remainingVotes || 0);
      }
    } catch (error) {
      console.error('Error fetching remaining votes:', error);
    }
  };

  // Sign in function
  const signIn = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      // This would normally call your auth API
      // For now, we'll simulate a successful login
      if (!email || !password) {
        throw new Error('Email and password are required');
      }
      
      // Generate a mock user
      const mockUser: EnhancedUser = {
        id: `user_${Math.random().toString(36).substring(2, 10)}`,
        email,
        name: email.split('@')[0],
        isAnonymous: false
      };
      
      // Get the client ID that was used for anonymous voting
      const clientId = getClientId();
      
      // In a real app, you'd make an API call to merge votes
      // For now, we'll simulate it with a delayed response
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Store the user in localStorage
      localStorage.setItem('authUser', JSON.stringify(mockUser));
      
      // Make an API call to associate this client ID with the user
      await fetch('/api/vote/link-anonymous-votes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: mockUser.id,
          clientId: clientId,
        }),
      });
      
      setUser(mockUser);
      
      // Reset vote limit since user is now authenticated
      setRemainingAnonymousVotes(999);
      
      toast({
        title: 'Signed in successfully',
        description: `Welcome back, ${mockUser.name || mockUser.email}!`,
      });
      
      return true;
    } catch (error) {
      console.error('Sign in error:', error);
      
      toast({
        title: 'Sign in failed',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive',
      });
      
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Sign up function
  const signUp = async (email: string, password: string, name: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      // This would normally call your auth API
      if (!email || !password) {
        throw new Error('Email and password are required');
      }
      
      // Generate a mock user
      const mockUser: EnhancedUser = {
        id: `user_${Math.random().toString(36).substring(2, 10)}`,
        email,
        name: name || email.split('@')[0],
        isAnonymous: false
      };
      
      // Get the client ID that was used for anonymous voting
      const clientId = getClientId();
      
      // In a real app, you'd make an API call to create an account
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Store the user in localStorage
      localStorage.setItem('authUser', JSON.stringify(mockUser));
      
      // Make an API call to associate this client ID with the new user
      await fetch('/api/vote/link-anonymous-votes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: mockUser.id,
          clientId: clientId,
        }),
      });
      
      setUser(mockUser);
      
      // Reset vote limit since user is now authenticated
      setRemainingAnonymousVotes(999);
      
      toast({
        title: 'Account created successfully',
        description: `Welcome, ${mockUser.name || mockUser.email}!`,
      });
      
      return true;
    } catch (error) {
      console.error('Sign up error:', error);
      
      toast({
        title: 'Sign up failed',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive',
      });
      
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Sign out function
  const signOut = async (): Promise<void> => {
    setIsLoading(true);
    try {
      // This would normally call your auth API
      localStorage.removeItem('authUser');
      
      // Generate a new client ID to prevent vote manipulation
      clearClientId();
      const newClientId = getClientId(); // This generates a new ID
      
      // Create anonymous user
      const anonymousUser: EnhancedUser = {
        id: newClientId,
        isAnonymous: true
      };
      
      setUser(anonymousUser);
      
      // Reset vote limit for new anonymous user
      await fetchRemainingVotes();
      
      toast({
        title: 'Signed out successfully',
      });
    } catch (error) {
      console.error('Sign out error:', error);
      
      toast({
        title: 'Sign out failed',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize user on component mount
  useEffect(() => {
    const initUser = async () => {
      try {
        const authUser = await getAuthStatus();
        setUser(authUser);
        
        // Fetch remaining votes for anonymous users
        if (authUser?.isAnonymous) {
          await fetchRemainingVotes();
        }
      } catch (error) {
        console.error('Error initializing user:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    initUser();
  }, []);
  
  // Create value object
  const value = {
    user,
    isLoading,
    signIn,
    signUp,
    signOut,
    getAuthStatus,
    isAuthenticated: !!user && !user.isAnonymous,
    remainingAnonymousVotes,
  };

  return (
    <EnhancedAuthContext.Provider value={value}>
      {children}
    </EnhancedAuthContext.Provider>
  );
}

// Custom hook to use the auth context
export function useEnhancedAuth() {
  const context = useContext(EnhancedAuthContext);
  if (context === undefined) {
    throw new Error('useEnhancedAuth must be used within an EnhancedAuthProvider');
  }
  return context;
} 