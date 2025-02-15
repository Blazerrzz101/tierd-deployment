"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase/client";
import type { VoteType } from '@/types/vote';
import type { Product } from '@/types/product';
import { v4 as uuidv4 } from 'uuid';

const ANONYMOUS_ID_KEY = 'anonymous_id';

export function useVote(initialProduct: Product | undefined) {
  const [product, setProduct] = useState<Product | undefined>(initialProduct);
  const [isLoading, setIsLoading] = useState(false);
  const [anonymousId, setAnonymousId] = useState<string>('');

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
    if (!initialProduct?.id || !anonymousId) return;

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
  }, [initialProduct?.id, anonymousId]);

  const vote = async (productId: string, voteType: VoteType) => {
    if (!productId || !anonymousId) {
      console.error('Cannot vote without a product ID and anonymous ID');
      return;
    }

    try {
      setIsLoading(true);

      // Get current session
      const { data: { session } } = await supabase.auth.getSession();
      
      // Call the cast_vote function
      const { data, error } = await supabase
        .rpc('cast_vote', {
          p_product_id: productId,
          p_vote_type: voteType,
          p_user_id: session?.user?.id || null,
          p_anonymous_id: !session ? anonymousId : null
        });

      if (error) throw error;

      if (data) {
        if (!data.success) {
          if (data.message === 'Anonymous vote limit reached') {
            toast.error("Vote Limit Reached", {
              description: "You've reached the limit of 5 anonymous votes per day. Please sign in to continue voting.",
              action: {
                label: "Sign In",
                onClick: () => window.location.href = "/auth/sign-in"
              }
            });
            return;
          }
          throw new Error(data.message);
        }

        // Update local state optimistically
        setProduct(prev => {
          if (!prev) return prev;

          const newVoteType = data.vote_type as VoteType | null;
          const oldVoteType = prev.userVote;

          let voteDiff = 0;
          let upvoteDiff = 0;
          let downvoteDiff = 0;

          if (!oldVoteType && newVoteType) {
            // Adding new vote
            voteDiff = newVoteType === 'up' ? 1 : -1;
            upvoteDiff = newVoteType === 'up' ? 1 : 0;
            downvoteDiff = newVoteType === 'down' ? 1 : 0;
          } else if (oldVoteType && !newVoteType) {
            // Removing vote
            voteDiff = oldVoteType === 'up' ? -1 : 1;
            upvoteDiff = oldVoteType === 'up' ? -1 : 0;
            downvoteDiff = oldVoteType === 'down' ? -1 : 0;
          } else if (oldVoteType && newVoteType && oldVoteType !== newVoteType) {
            // Changing vote
            voteDiff = newVoteType === 'up' ? 2 : -2;
            upvoteDiff = newVoteType === 'up' ? 1 : -1;
            downvoteDiff = newVoteType === 'down' ? 1 : -1;
          }

          const currentVotes = prev.votes ?? 0;
          const currentUpvotes = prev.upvotes ?? 0;
          const currentDownvotes = prev.downvotes ?? 0;

          return {
            ...prev,
            userVote: newVoteType,
            votes: Math.max(0, currentVotes + voteDiff),
            upvotes: Math.max(0, currentUpvotes + upvoteDiff),
            downvotes: Math.max(0, currentDownvotes + downvoteDiff)
          };
        });

        // Show appropriate toast message
        if (!data.vote_type) {
          toast.success("Vote Removed");
        } else if (!session) {
          toast.success("Vote Recorded", {
            description: "Sign in to make your votes permanent!",
            action: {
              label: "Sign In",
              onClick: () => window.location.href = "/auth/sign-in"
            }
          });
        } else {
          toast.success(data.message);
        }
      }
    } catch (error: any) {
      console.error('Error voting:', error);
      toast.error(error.message || "Failed to record vote");
    } finally {
      setIsLoading(false);
    }
  };

  return {
    product,
    isLoading,
    vote
  };
}
