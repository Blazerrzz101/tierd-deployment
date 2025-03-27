"use client";

import { useState, useEffect, useRef } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { useToast } from "@/components/ui/use-toast"
import { getClientId, ensureClientId, isValidClientId } from '@/utils/client-id'
import { Product } from '@/types/product'
import { toast as sonnerToast } from 'sonner'

interface VoteProduct {
  id: string;
  name: string;
}

interface VoteResponse {
  success: boolean;
  error?: string;
  upvotes?: number;
  downvotes?: number;
  voteType?: number | null;
  score?: number;
  hasVoted?: boolean;
  message?: string;
  remainingVotes?: number;
}

// Rate limit settings
const VOTE_COOLDOWN_MS = 1000; // 1 second cooldown

interface VoteHookResult {
  vote: (product: { id: string; name: string }, voteType: 1 | -1) => Promise<any>;
  getVoteStatus: (productId: string) => Promise<VoteResponse>;
  isLoading: boolean;
  error: string | null;
}

// Store the last vote time globally across rerenders
let lastVoteTime = 0;

export function useVote(): VoteHookResult {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clientId, setClientId] = useState<string | null>(null);

  // Initialize client ID when hook is first used
  useEffect(() => {
    try {
      // Use ensureClientId to get a valid client ID
      const id = ensureClientId();
      setClientId(id);
      console.log('[useVote] hook initialized with client ID:', id);
      
      // Diagnostic request to check if client ID is working
      const diagnosticUrl = `/api/debug/client-id?clientId=${encodeURIComponent(id)}`;
      fetch(diagnosticUrl)
        .then(res => res.json())
        .then(data => {
          console.log('[useVote] Client ID diagnostic:', data.diagnostics?.clientId);
        })
        .catch(err => {
          console.error('[useVote] Diagnostic request failed:', err);
        });
    } catch (error) {
      console.error('[useVote] Error initializing client ID in hook:', error);
    }
  }, []);

  /**
   * Submit a vote for a product
   */
  const vote = async (product: { id: string; name: string }, voteType: 1 | -1): Promise<any> => {
    if (!product?.id) {
      const errorMsg = "Cannot vote - invalid product";
      setError(errorMsg);
      sonnerToast(errorMsg);
      return { success: false, error: errorMsg };
    }

    try {
      // Implement rate limiting
      const now = Date.now();
      const timeSinceLastVote = now - lastVoteTime;
      
      // If trying to vote too quickly
      if (timeSinceLastVote < VOTE_COOLDOWN_MS) {
        const remainingMs = VOTE_COOLDOWN_MS - timeSinceLastVote;
        const remainingSec = (remainingMs / 1000).toFixed(1);
        
        const errorMsg = `Please wait ${remainingSec}s between votes`;
        setError(errorMsg);
        
        sonnerToast("Vote Cooldown", {
          description: `Slow down, hotshot! Wait ${remainingSec} seconds before voting again.`
        });
        
        return { success: false, error: errorMsg, cooldown: true };
      }
      
      // Update last vote time for future rate limit checks
      lastVoteTime = now;
      
      setIsLoading(true);
      setError(null);

      // Get a fresh client ID and ensure it's valid
      const currentClientId = clientId || ensureClientId();
      
      if (!isValidClientId(currentClientId)) {
        const errorMsg = "Client ID is required and could not be generated";
        setError(errorMsg);
        sonnerToast.error("Error", {
          description: "Unable to vote. Please visit the debug page to fix this issue.",
          action: {
            label: "Fix Now",
            onClick: () => {
              if (typeof window !== 'undefined') {
                window.location.href = '/debug/client-id';
              }
            }
          }
        });
        return { success: false, error: errorMsg };
      }
      
      // Update state with current client ID
      if (currentClientId !== clientId) {
        setClientId(currentClientId);
      }

      console.log(`[useVote] Submitting vote: productId=${product.id}, clientId=${currentClientId}, voteType=${voteType}`);

      // Call the vote API
      const response = await fetch("/api/vote", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Client-ID": currentClientId, // Add client ID to headers as well
        },
        body: JSON.stringify({
          productId: product.id,
          clientId: currentClientId,
          voteType,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Check if it's a rate limit error
        if (response.status === 429 || data.error?.includes("rate limit")) {
          sonnerToast("Rate Limited", {
            description: "You're voting too quickly! Please wait a few seconds before trying again."
          });
          return { success: false, error: "Rate limited", rateLimit: true };
        }
        
        throw new Error(data.error || "Failed to vote");
      }

      // Success toast with product name
      sonnerToast(
        voteType === 1 ? "Upvoted Successfully" : "Downvoted Successfully", 
        { description: `Your vote for ${product.name} has been recorded.` }
      );
      
      return data;
    } catch (err: any) {
      const errorMsg = err.message || "Error submitting vote";
      setError(errorMsg);
      
      sonnerToast("Vote Error", {
        description: errorMsg,
      });
      
      console.error("[useVote] Vote error:", err);
      return { success: false, error: errorMsg };
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Get the current vote status for a product
   */
  const getVoteStatus = async (productId: string): Promise<VoteResponse> => {
    if (!productId) {
      return { 
        success: false, 
        error: "Product ID is required",
        voteType: null,
      };
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Get a fresh client ID
      const currentClientId = clientId || ensureClientId();
      
      if (!isValidClientId(currentClientId)) {
        console.error("[useVote] Invalid client ID when getting vote status");
        return { 
          success: false, 
          error: "Client ID is invalid",
          voteType: null,
        };
      }
      
      // Update state with current client ID if different
      if (currentClientId !== clientId) {
        setClientId(currentClientId);
      }
      
      console.log(`[useVote] Getting vote status: productId=${productId}, clientId=${currentClientId}`);
      
      // Use our vote API endpoint with query parameter
      const response = await fetch(`/api/vote?productId=${encodeURIComponent(productId)}&clientId=${encodeURIComponent(currentClientId)}`, {
        headers: {
          "X-Client-ID": currentClientId, // Add client ID to headers as well
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to get vote status: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || "Failed to get vote status");
      }
      
      return {
        success: true,
        upvotes: data.upvotes ?? 0,
        downvotes: data.downvotes ?? 0,
        voteType: data.voteType !== undefined ? data.voteType : null,
        score: data.score ?? (data.upvotes ?? 0) - (data.downvotes ?? 0),
        hasVoted: data.hasVoted ?? (data.voteType !== null),
      };
    } catch (err: any) {
      const errorMsg = err.message || "Error fetching vote status";
      setError(errorMsg);
      console.error("[useVote] Vote status error:", err);
      
      return {
        success: false,
        error: errorMsg,
        voteType: null,
      };
    } finally {
      setIsLoading(false);
    }
  };

  return { vote, getVoteStatus, isLoading, error };
}
