"use client";

import { useState, useCallback, useEffect } from 'react';
import { supabase } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { VoteType } from '@/types/product';

// Ensure a value is a number
const ensureNumber = (value: any): number => {
  if (value === null || value === undefined) return 0;
  const num = Number(value);
  return isNaN(num) ? 0 : num;
};

// Generate a unique client ID for anonymous voting
const generateClientId = () => {
  return `${Math.random().toString(36).substring(2)}_${Date.now()}`;
};

// Get the client ID from localStorage or create a new one
const getClientId = (): string => {
  if (typeof window === 'undefined') return generateClientId();
  
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

interface VoteProduct {
  id: string;
  name: string;
}

interface VoteResponse {
  success: boolean;
  error?: string;
  result?: {
    voteType: VoteType;
    upvotes: number;
    downvotes: number;
    score: number;
  };
}

export function useVote() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [clientId, setClientId] = useState<string>("");
  const queryClient = useQueryClient();

  // Initialize or get clientId from localStorage for anonymous users
  useEffect(() => {
    setClientId(getClientId());
  }, []);

  // Check if a user has voted for a product
  const checkUserVote = useCallback(async (productId: string): Promise<number | null> => {
    try {
      console.log('Checking user vote for product:', productId);
      if (!productId) return null;
      
      // Get current client ID
      const currentClientId = clientId || getClientId();
      
      // Try API endpoint first
      try {
        console.log('Attempting to check vote via API endpoint');
        const response = await fetch(`/api/vote?productId=${productId}&clientId=${currentClientId}`);
        
        if (response.ok) {
          const data = await response.json();
          console.log('API vote check result:', data);
          
          if (data && data.success) {
            return data.voteType;
          }
        }
      } catch (apiError) {
        console.error('API vote check failed:', apiError);
      }
      
      // Fall back to direct query
      console.log('Falling back to direct query for vote check');
      
      try {
        const { data, error } = await supabase
          .from('votes')
          .select('vote_type')
          .eq('product_id', productId)
          .eq('metadata->client_id', currentClientId)
          .maybeSingle();
          
        if (error) {
          console.error('Vote check error:', error);
          return null;
        }
        
        return data?.vote_type || null;
      } catch (error) {
        console.error('Error in checkUserVote:', error);
        return null;
      }
    } catch (error) {
      console.error('Error in checkUserVote:', error);
      return null;
    }
  }, [clientId]);

  // Vote for a product
  const vote = async (product: VoteProduct, voteType: 1 | -1): Promise<VoteResponse> => {
    try {
      const clientId = localStorage.getItem('clientId') || 'anonymous';
      
      const response = await fetch('/api/vote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId: product.id,
          voteType,
          clientId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to vote');
      }

      if (!data.success) {
        return {
          success: false,
          error: data.error || 'Vote operation failed',
        };
      }

      return {
        success: true,
        result: data.result,
      };
    } catch (error) {
      console.error('Vote error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to vote',
      };
    }
  };

  return {
    vote,
    checkUserVote,
    isLoading,
    clientId
  };
}
