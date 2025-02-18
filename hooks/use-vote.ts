"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase/client";
import type { VoteType } from '@/types/vote';
import type { Product } from '@/types/product';
import { v4 as uuidv4 } from 'uuid';

const ANONYMOUS_ID_KEY = 'anonymous_id';

export function useVote(initialProduct: Product) {
  const [product, setProduct] = useState<Product>(initialProduct);
  const [isLoading, setIsLoading] = useState(false);
  const [anonymousId, setAnonymousId] = useState<string>('');
  const [isVoting, setIsVoting] = useState(false);

  // Initialize or get anonymous ID
  useEffect(() => {
    let id = localStorage.getItem(ANONYMOUS_ID_KEY);
    if (!id) {
      id = uuidv4();
      localStorage.setItem(ANONYMOUS_ID_KEY, id);
    }
    setAnonymousId(id);
  }, []);

  // Subscribe to real-time vote updates
  useEffect(() => {
    if (!initialProduct.id || !anonymousId) return;

    const channel = supabase
      .channel(`product_votes:${initialProduct.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'product_votes',
          filter: `product_id=eq.${initialProduct.id}`
        },
        async () => {
          // Get current session
          const { data: { session } } = await supabase.auth.getSession();
          
          // Refresh product data
          const { data } = await supabase
            .rpc('get_product_details', { 
              p_slug: initialProduct.url_slug,
              p_user_id: session?.user?.id,
              p_anonymous_id: !session ? anonymousId : null
            });
          
          if (data?.[0]) {
            setProduct(data[0]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [initialProduct.id, anonymousId]);

  const vote = async (voteType: VoteType) => {
    if (isVoting) return;
    setIsVoting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Must be logged in to vote');
      }

      // Convert vote type to numeric value
      const voteValue = voteType === 'upvote' ? 1 : -1;

      // Call the authenticated vote function
      const { data, error } = await supabase.rpc(
        'handle_authenticated_vote',
        {
          p_product_id: product.id,
          p_vote_type: voteType,
          p_user_id: user.id
        }
      );

      if (error) throw error;

      // Update local state based on the vote
      setProduct(prev => {
        const newUpvotes = voteType === 'upvote'
          ? (prev.userVote === 1 ? prev.upvotes - 1 : prev.upvotes + 1)
          : prev.upvotes;

        const newDownvotes = voteType === 'downvote'
          ? (prev.userVote === -1 ? prev.downvotes - 1 : prev.downvotes + 1)
          : prev.downvotes;

        const newScore = prev.score + (
          voteType === 'upvote'
            ? (prev.userVote === 1 ? -1 : 1)
            : (prev.userVote === -1 ? 1 : -1)
        );

        return {
          ...prev,
          userVote: voteValue,
          upvotes: newUpvotes,
          downvotes: newDownvotes,
          score: newScore,
          total_votes: newUpvotes + newDownvotes
        };
      });

      // Show success message
      toast.success(
        data.vote_type ? "Vote recorded" : "Vote removed"
      );

    } catch (error) {
      console.error('Error voting:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to record vote');
    } finally {
      setIsVoting(false);
    }
  };

  return {
    product,
    isLoading,
    vote,
    isVoting
  };
}
