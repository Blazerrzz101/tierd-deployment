"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { VoteType } from "@/types/product";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

export interface VoteProduct {
  id: string;
  name: string;
  upvotes: number;
  downvotes: number;
  userVote?: VoteType;
}

const generateClientId = () => {
  return `${Math.random().toString(36).substring(2)}_${Date.now()}`;
};

const getClientId = () => {
  let clientId = localStorage.getItem('clientId');
  if (!clientId) {
    clientId = generateClientId();
    localStorage.setItem('clientId', clientId);
  }
  return clientId;
};

export const useVote = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const clientId = getClientId();
  const queryClient = useQueryClient();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
    };
    checkAuth();
  }, []);

  const vote = async (product: VoteProduct, voteType: VoteType) => {
    try {
      setIsLoading(true);

      const { data: voteResult, error: voteError } = await supabase.rpc('vote_for_product', {
        p_product_id: product.id,
        p_vote_type: voteType,
        p_client_id: clientId
      });

      if (voteError) {
        console.error('Vote error:', voteError);
        throw voteError;
      }

      await queryClient.invalidateQueries({ queryKey: ['product'] });

      toast.success(
        voteResult.vote_type === null ? 'Vote removed' : `Vote ${voteType === 1 ? 'up' : 'down'} recorded`,
        {
          description: isAuthenticated
            ? 'Your vote has been saved'
            : 'Sign in to keep your votes permanently'
        }
      );

      return {
        voteType: voteResult.vote_type,
        upvotes: voteResult.upvotes,
        downvotes: voteResult.downvotes
      };
    } catch (error) {
      console.error('Error voting:', error);
      toast.error('Failed to vote', {
        description: 'Please try again later'
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    vote,
    isLoading,
    isAuthenticated
  };
};
