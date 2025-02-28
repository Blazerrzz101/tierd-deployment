"use client"

import { useState, useCallback, useEffect } from 'react'
import { useToast } from '@/components/ui/use-toast'
import { VoteType } from '@/types/product'
import { Product } from '@/types/product'
import { useQueryClient } from "@tanstack/react-query"
import { useAuth } from '@/hooks/use-auth'

export interface VoteProduct extends Partial<Product> {
  id: string;
  name: string;
  upvotes?: number;
  downvotes?: number;
  userVote?: VoteType | null;
}

interface VoteResult {
  upvotes: number;
  downvotes: number;
  voteType: VoteType | null;
  success: boolean;
  message?: string;
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
  const queryClient = useQueryClient()
  const { user } = useAuth()

  // Initialize or get clientId from localStorage
  useEffect(() => {
    setClientId(getClientId())
  }, [])

  const checkUserVote = useCallback(async (productId: string): Promise<VoteType | null> => {
    try {
      if (!productId) return null;
      
      // Ensure clientId is available
      const currentClientId = clientId || getClientId();
      
      if (!currentClientId) return null;
      
      const response = await fetch(`/api/vote?productId=${productId}&clientId=${currentClientId}`);
      const data = await response.json();

      if (!data.success) {
        console.error('Error checking vote:', data.error);
        return null;
      }
      
      return data.voteType;
    } catch (error) {
      console.error('Error in checkUserVote:', error);
      return null;
    }
  }, [clientId]);

  const vote = useCallback(async (product: VoteProduct, voteType: VoteType): Promise<VoteResult | null> => {
    try {
      setIsLoading(true)
      
      // Ensure clientId is available
      const currentClientId = clientId || getClientId();
      
      if (!currentClientId) {
        toast({
          title: "Error",
          description: "Unable to identify user for voting",
          variant: "destructive"
        })
        return null
      }

      const response = await fetch('/api/vote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId: product.id,
          productName: product.name,
          voteType,
          clientId: currentClientId,
          userId: user?.id // Include user ID if logged in
        })
      });

      const data = await response.json();

      if (!data.success) {
        console.error('Vote error:', data.error)
        toast({
          title: "Error",
          description: data.error || "Failed to vote. Please try again.",
          variant: "destructive"
        })
        return null
      }

      // Invalidate queries to refresh UI
      await queryClient.invalidateQueries({ queryKey: ['product'] });
      await queryClient.invalidateQueries({ queryKey: ['products'] });
      await queryClient.invalidateQueries({ queryKey: ['activities'] });

      // Success message
      toast({
        title: data.result.voteType === null ? "Vote Removed" : (voteType === 1 ? "Upvoted" : "Downvoted"),
        description: "Your vote has been recorded"
      });

      return {
        upvotes: data.result.upvotes,
        downvotes: data.result.downvotes,
        voteType: data.result.voteType,
        success: true
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
  }, [toast, clientId, queryClient, user]);

  return {
    vote,
    checkUserVote,
    isLoading,
    clientId
  }
} 