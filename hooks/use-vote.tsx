"use client"

import { useState, useCallback, useEffect } from 'react'
import { supabase } from "@/lib/supabase/client"
import { useToast } from '@/components/ui/use-toast'
import { VoteType } from '@/types/product'
import { Product } from '@/types/product'
import { v4 as uuidv4 } from 'uuid'
import { User } from '@supabase/supabase-js'
import { useQueryClient } from "@tanstack/react-query"

export interface VoteProduct extends Partial<Product> {
  id: string;
  name: string;
  upvotes?: number;
  downvotes?: number;
  userVote?: VoteType | null;
}

// Return type for vote_for_product RPC
interface VoteResult {
  upvotes: number;
  downvotes: number;
  voteType: VoteType | null;
  success: boolean;
  message: string;
}

// Generate a unique client ID for anonymous voting
const generateClientId = () => {
  return `${Math.random().toString(36).substring(2)}_${Date.now()}`;
};

// Get the client ID from localStorage or create a new one
const getClientId = () => {
  if (typeof window === 'undefined') return null;
  
  try {
    let clientId = localStorage.getItem('tierd_client_id');
    if (!clientId) {
      clientId = generateClientId();
      localStorage.setItem('tierd_client_id', clientId);
    }
    return clientId;
  } catch (error) {
    console.error('Error accessing localStorage:', error);
    return generateClientId(); // Fallback to a temporary ID
  }
};

export const useVote = () => {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [clientId, setClientId] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false)
  const queryClient = useQueryClient()

  // Check if the user is authenticated
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
    };
    
    checkAuth();
    
    // Setup auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      setIsAuthenticated(event === 'SIGNED_IN');
    });
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Initialize or get clientId from localStorage for anonymous users
  useEffect(() => {
    setClientId(getClientId())
  }, [])

  const checkUserVote = useCallback(async (productId: string): Promise<VoteType | null> => {
    try {
      if (!productId) return null;
      
      // Get session information
      const { data: { session } } = await supabase.auth.getSession();
      const user: User | null = session?.user || null;
      const userId = user?.id;
      
      // Ensure clientId is available for anonymous users
      const currentClientId = clientId || getClientId();
      
      if (!userId && !currentClientId) return null;
            
      const { data, error } = await supabase.rpc('has_user_voted', { 
        p_product_id: productId,
        p_user_id: userId || null,
        p_client_id: !userId ? currentClientId : null
      });

      if (error) {
        console.error('Error checking vote:', error);
        return null;
      }
      
      return data?.vote_type || null;
    } catch (error) {
      console.error('Error in checkUserVote:', error);
      return null;
    }
  }, [clientId]);

  const vote = useCallback(async (product: VoteProduct, voteType: VoteType): Promise<VoteResult | null> => {
    try {
      setIsLoading(true)
      
      // Get session information
      const { data: { session } } = await supabase.auth.getSession();
      const user: User | null = session?.user || null;
      const userId = user?.id;
      
      // Ensure clientId is available for anonymous users
      const currentClientId = clientId || getClientId();
      
      if (!userId && !currentClientId) {
        toast({
          title: "Error",
          description: "Unable to identify user for voting",
          variant: "destructive"
        })
        return null
      }

      // Ensure correct parameter order according to the function signature
      const { data, error } = await supabase.rpc('vote_for_product', {
        p_product_id: product.id,
        p_vote_type: voteType,
        p_user_id: userId || null,
        p_client_id: !userId ? currentClientId : null
      })

      if (error) {
        console.error('Vote error:', error)
        toast({
          title: "Error",
          description: error.message || "Failed to vote. Please try again.",
          variant: "destructive"
        })
        return null
      }

      // Invalidate queries to refresh UI
      await queryClient.invalidateQueries({ queryKey: ['product'] });
      
      // Also invalidate the products list if on home page
      await queryClient.invalidateQueries({ queryKey: ['products'] });

      // Success message
      toast({
        title: data.voteType === null ? "Vote Removed" : (voteType === 1 ? "Upvoted" : "Downvoted"),
        description: data.message || "Your vote has been recorded"
      });

      return {
        upvotes: Number(data.upvotes) || 0, 
        downvotes: Number(data.downvotes) || 0,
        voteType: data.voteType,
        success: data.success,
        message: data.message
      }
    } catch (error) {
      console.error('Vote error:', error)
      toast({
        title: "Error",
        description: "Failed to vote. Please try again.",
        variant: "destructive"
      })
      return null
    } finally {
      setIsLoading(false)
    }
  }, [supabase, toast, clientId, queryClient])

  return {
    vote,
    checkUserVote,
    isLoading,
    isAuthenticated,
    clientId
  }
} 