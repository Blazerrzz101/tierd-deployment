"use client"

import { useState, useCallback, useEffect } from 'react'
import { useToast } from '@/components/ui/use-toast'
import { VoteType } from '@/types/product'
import { Product } from '@/types/product'
import { useQueryClient } from "@tanstack/react-query"
import { useEnhancedAuth } from '@/components/auth/auth-provider'
import { getClientId } from '@/utils/client-id'

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
  error?: string;
}

interface VoteStatusResult {
  upvotes: number;
  downvotes: number;
  voteType: VoteType | null;
  success: boolean;
  error?: string;
  productId?: string;
  score?: number;
  hasVoted?: boolean;
}

export const useVote = () => {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [clientId, setClientId] = useState<string>("")
  const [remainingVotes, setRemainingVotes] = useState<number | null>(null)
  const queryClient = useQueryClient()
  const { user } = useEnhancedAuth()

  // Initialize or get clientId from localStorage
  useEffect(() => {
    setClientId(getClientId())
  }, [])

  // Fetch remaining votes for anonymous users
  useEffect(() => {
    async function fetchRemainingVotes() {
      if (!clientId || !user?.isAnonymous) return;
      
      try {
        const response = await fetch(`/api/vote/remaining-votes?clientId=${clientId}`);
        const data = await response.json();
        
        if (data.success && typeof data.remainingVotes === 'number') {
          setRemainingVotes(data.remainingVotes);
        }
      } catch (error) {
        console.error('Error fetching remaining votes:', error);
      }
    }
    
    fetchRemainingVotes();
  }, [clientId, user?.isAnonymous]);

  // Get the client ID (for use in components)
  const getClientIdFn = useCallback(() => {
    return clientId || getClientId();
  }, [clientId]);

  const getVoteStatus = useCallback(async (productId: string): Promise<VoteStatusResult> => {
    try {
      if (!productId) {
        return {
          success: false,
          error: 'Product ID is required',
          upvotes: 0,
          downvotes: 0,
          voteType: null
        };
      }
      
      // Ensure clientId is available
      const currentClientId = clientId || getClientId();
      
      if (!currentClientId) {
        return {
          success: false,
          error: 'Client ID is unavailable',
          upvotes: 0,
          downvotes: 0,
          voteType: null
        };
      }
      
      const response = await fetch(`/api/vote?productId=${productId}&clientId=${currentClientId}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response from vote API:', errorText);
        return {
          success: false,
          error: `API error: ${response.status}`,
          upvotes: 0,
          downvotes: 0,
          voteType: null
        };
      }
      
      const data = await response.json();

      // Ensure all expected properties have default values if missing
      return {
        success: data.success !== false,
        productId: data.productId || productId,
        upvotes: typeof data.upvotes === 'number' ? data.upvotes : 0,
        downvotes: typeof data.downvotes === 'number' ? data.downvotes : 0,
        voteType: data.voteType !== undefined ? data.voteType : null,
        score: typeof data.score === 'number' ? data.score : 0,
        hasVoted: !!data.hasVoted,
        error: data.error
      };
    } catch (error) {
      console.error('Error in getVoteStatus:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        upvotes: 0,
        downvotes: 0,
        voteType: null
      };
    }
  }, [clientId]);

  const vote = useCallback(async (product: VoteProduct, voteType: VoteType): Promise<VoteResult> => {
    try {
      setIsLoading(true)
      
      // Validate product
      if (!product?.id) {
        toast({
          title: "Error",
          description: "Invalid product information",
          variant: "destructive"
        });
        return {
          success: false,
          error: "Invalid product information",
          upvotes: 0,
          downvotes: 0,
          voteType: null
        };
      }
      
      // Ensure clientId is available
      const currentClientId = clientId || getClientId();
      
      if (!currentClientId) {
        toast({
          title: "Error",
          description: "Unable to identify user for voting",
          variant: "destructive"
        })
        return {
          success: false,
          error: "Unable to identify user for voting",
          upvotes: product.upvotes || 0,
          downvotes: product.downvotes || 0,
          voteType: null
        }
      }

      // For anonymous users, check remaining votes
      if (user?.isAnonymous) {
        // Get fresh count of remaining votes
        try {
          const votesResponse = await fetch(`/api/vote/remaining-votes?clientId=${currentClientId}`);
          const votesData = await votesResponse.json();
          
          if (votesData.success && typeof votesData.remainingVotes === 'number') {
            setRemainingVotes(votesData.remainingVotes);
            
            // If no votes remaining, show message and redirect
            if (votesData.remainingVotes <= 0) {
              toast({
                title: "Vote limit reached",
                description: "You've used all 5 of your votes. Sign in to vote more!",
                variant: "destructive"
              });
              
              // Redirect to sign in page
              if (typeof window !== 'undefined') {
                window.location.href = '/auth/sign-in?redirect=back&reason=vote_limit';
              }
              
              return {
                success: false,
                error: "Vote limit reached",
                upvotes: product.upvotes || 0,
                downvotes: product.downvotes || 0,
                voteType: product.userVote || null
              }
            }
          }
        } catch (error) {
          console.error('Error checking remaining votes:', error);
        }
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

      // Handle non-200 responses
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response from vote API:', errorText);
        toast({
          title: "Error",
          description: `API error: ${response.status}`,
          variant: "destructive"
        })
        return {
          success: false,
          error: `API error: ${response.status}`,
          upvotes: product.upvotes || 0,
          downvotes: product.downvotes || 0,
          voteType: null
        }
      }

      const data = await response.json();

      // Update remaining votes for anonymous users
      if (user?.isAnonymous) {
        try {
          const votesResponse = await fetch(`/api/vote/remaining-votes?clientId=${currentClientId}`);
          const votesData = await votesResponse.json();
          
          if (votesData.success && typeof votesData.remainingVotes === 'number') {
            setRemainingVotes(votesData.remainingVotes);
          }
        } catch (error) {
          console.error('Error updating remaining votes:', error);
        }
      }

      if (!data.success) {
        console.error('Vote error:', data.error)
        
        // Handle vote limit errors specially
        if (response.status === 429) {
          toast({
            title: "Vote limit reached",
            description: "You've used all 5 of your votes. Sign in to vote more!",
            variant: "destructive"
          });
          
          // Optional: Redirect to sign in page
          if (typeof window !== 'undefined') {
            window.location.href = '/auth/sign-in?redirect=back&reason=vote_limit';
          }
        } else {
          toast({
            title: "Error",
            description: data.error || "Failed to vote. Please try again.",
            variant: "destructive"
          });
        }
        
        return {
          success: false,
          error: data.error || "Failed to vote",
          upvotes: product.upvotes || 0,
          downvotes: product.downvotes || 0,
          voteType: product.userVote || null
        }
      }

      // Invalidate queries to refresh UI
      await queryClient.invalidateQueries({ queryKey: ['product'] });
      await queryClient.invalidateQueries({ queryKey: ['products'] });
      await queryClient.invalidateQueries({ queryKey: ['activities'] });

      // Success message
      toast({
        title: data.voteType === null ? "Vote Removed" : (voteType === 1 ? "Upvoted" : "Downvoted"),
        description: data.message || "Your vote has been recorded"
      });

      return {
        upvotes: typeof data.upvotes === 'number' ? data.upvotes : (product.upvotes || 0),
        downvotes: typeof data.downvotes === 'number' ? data.downvotes : (product.downvotes || 0),
        voteType: data.voteType !== undefined ? data.voteType : null,
        success: true,
        message: data.message
      }
    } catch (error) {
      console.error('Vote error:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to vote. Please try again.",
        variant: "destructive"
      })
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        upvotes: product.upvotes || 0,
        downvotes: product.downvotes || 0,
        voteType: product.userVote || null
      }
    } finally {
      setIsLoading(false)
    }
  }, [toast, clientId, queryClient, user, remainingVotes]);

  return {
    vote,
    getVoteStatus,
    isLoading,
    clientId,
    getClientId: getClientIdFn,
    remainingVotes
  }
} 