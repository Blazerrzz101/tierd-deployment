"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getClientId, isValidClientId } from '@/utils/client-id';
import { useEnhancedAuth } from "@/hooks/enhanced-auth";
import { toast } from "sonner";

// Type definitions
export interface ProductVoteStatus {
  productId: string;
  voteType: number | null;
  upvotes: number;
  downvotes: number;
  score: number;
  hasVoted: boolean;
}

export interface VoteResponse {
  success: boolean;
  error?: string;
  productId?: string;
  voteType?: number | null;
  upvotes?: number;
  downvotes?: number;
  score?: number;
  hasVoted?: boolean;
}

// Constants
const VOTE_QUERY_KEY = 'votes';
const PRODUCT_VOTE_KEY = 'product-vote';

/**
 * A hook that provides methods to track and update vote status globally
 */
export function useGlobalVotes() {
  const queryClient = useQueryClient();
  const { user } = useEnhancedAuth();
  
  // Get the client ID for consistent identification
  const getVoteClientId = () => {
    const clientId = getClientId();
    if (!isValidClientId(clientId)) {
      console.error('Invalid client ID in useGlobalVotes');
      return null;
    }
    return clientId;
  };

  // Fetch vote status for a product
  const fetchVoteStatus = async (productId: string): Promise<ProductVoteStatus> => {
    const clientId = getVoteClientId();
    if (!clientId) {
      throw new Error('Client ID is required to fetch vote status');
    }

    console.log(`[GlobalVotes] Fetching vote status for ${productId} with client ${clientId}`);
    
    const response = await fetch(`/api/vote?productId=${encodeURIComponent(productId)}&clientId=${encodeURIComponent(clientId)}`, {
      headers: {
        "X-Client-ID": clientId,
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch vote status: ${errorText}`);
    }
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch vote status');
    }
    
    return {
      productId,
      voteType: data.voteType !== undefined ? data.voteType : null,
      upvotes: data.upvotes ?? 0,
      downvotes: data.downvotes ?? 0,
      score: data.score ?? (data.upvotes ?? 0) - (data.downvotes ?? 0),
      hasVoted: data.hasVoted ?? (data.voteType !== null)
    };
  };

  // Submit a vote for a product
  const submitVote = async ({
    productId,
    name,
    voteType
  }: {
    productId: string;
    name: string;
    voteType: 1 | -1 | null;  // Allow null for removing votes
  }): Promise<VoteResponse> => {
    const clientId = getVoteClientId();
    if (!clientId) {
      throw new Error('Client ID is required to vote');
    }

    // Log the appropriate action based on vote type
    if (voteType === null) {
      console.log(`[GlobalVotes] Removing vote for ${productId} with client ${clientId}`);
    } else {
      console.log(`[GlobalVotes] Submitting ${voteType === 1 ? 'upvote' : 'downvote'} for ${productId} with client ${clientId}`);
    }
    
    const response = await fetch('/api/vote', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Client-ID': clientId
      },
      body: JSON.stringify({
        productId,
        voteType,
        clientId
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Failed to vote: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to submit vote');
    }
    
    return data;
  };
  
  // Query hook to get vote status for a product
  const useProductVoteStatus = (productId: string) => {
    return useQuery({
      queryKey: [PRODUCT_VOTE_KEY, productId],
      queryFn: () => fetchVoteStatus(productId),
      enabled: !!productId && isValidClientId(getClientId()),
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
    });
  };
  
  // Mutation hook to vote for a product
  const useVoteMutation = () => {
    return useMutation({
      mutationFn: submitVote,
      onSuccess: (data, variables) => {
        // Update the cache for this product
        queryClient.setQueryData(
          [PRODUCT_VOTE_KEY, variables.productId],
          {
            productId: variables.productId,
            voteType: data.voteType,
            upvotes: data.upvotes,
            downvotes: data.downvotes,
            score: data.score,
            hasVoted: data.voteType !== null
          }
        );
        
        // Invalidate queries to ensure data is fresh
        queryClient.invalidateQueries({ queryKey: [PRODUCT_VOTE_KEY, variables.productId] });
        
        // Invalidate all product lists that might contain this product
        queryClient.invalidateQueries({ queryKey: ['products'] });
        queryClient.invalidateQueries({ queryKey: ['rankings'] });
        
        // Show success toast
        if (data.voteType === null) {
          toast.info(`Vote removed for ${variables.name}`);
        } else {
          toast.success(
            data.voteType === 1 
              ? `Upvoted ${variables.name}` 
              : `Downvoted ${variables.name}`
          );
        }
      },
      onError: (error) => {
        console.error('Vote error:', error);
        toast.error(`Error: ${error instanceof Error ? error.message : 'Failed to vote'}`);
      }
    });
  };
  
  return {
    useProductVoteStatus,
    useVoteMutation,
    // Expose methods for direct access if needed
    fetchVoteStatus,
    submitVote,
    // Helper to clear the vote cache for a product
    invalidateProductVote: (productId: string) => {
      queryClient.invalidateQueries({ queryKey: [PRODUCT_VOTE_KEY, productId] });
    },
    // Helper to clear all vote cache
    invalidateAllVotes: () => {
      queryClient.invalidateQueries({ queryKey: [PRODUCT_VOTE_KEY] });
    }
  };
} 