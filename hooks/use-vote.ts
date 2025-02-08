"use client";

import { useState, useEffect } from "react";
import { Product } from "@/types/product";
import { toast } from "sonner";
import { useAuth } from "./use-auth";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

type VoteType = 'up' | 'down' | null;

export function useVote(initialProduct: Product) {
  const [product, setProduct] = useState(initialProduct);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const supabase = createClientComponentClient();

  // Load initial vote state
  useEffect(() => {
    let isMounted = true;
    
    async function loadUserVote() {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('product_votes')
          .select('vote_type')
          .eq('product_id', product.id)
          .eq('user_id', user.id)
          .single();

        if (error) {
          if (error.code !== 'PGRST116') { // Not found error is expected
            console.error("Error loading vote:", error);
          }
          return;
        }

        if (data && isMounted) {
          setProduct(prev => ({
            ...prev,
            userVote: data.vote_type as VoteType
          }));
        }
      } catch (err) {
        console.error("Error loading user vote:", err);
      }
    }

    loadUserVote();
    return () => {
      isMounted = false;
    };
  }, [user, product.id, supabase]);

  const vote = async (voteType: VoteType) => {
    if (!user) {
      toast.error("Please sign in to vote", {
        description: "Create an account or sign in to vote on products"
      });
      return;
    }

    if (isLoading) {
      toast.error("Please wait", {
        description: "Your previous vote is still being processed"
      });
      return;
    }

    // Store the current state for rollback
    const previousState = { ...product };
    setIsLoading(true);

    try {
      const previousVote = product.userVote;
      const voteChange = voteType === "up" ? 1 : voteType === "down" ? -1 : 0;
      const previousVoteChange = previousVote === "up" ? -1 : previousVote === "down" ? 1 : 0;

      // Optimistic update
      setProduct(prev => ({
        ...prev,
        votes: prev.votes + voteChange + previousVoteChange,
        userVote: voteType
      }));

      if (voteType === null) {
        // Remove vote
        const { error } = await supabase
          .from('product_votes')
          .delete()
          .eq('product_id', product.id)
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        // Upsert vote
        const { error } = await supabase
          .from('product_votes')
          .upsert({
            product_id: product.id,
            user_id: user.id,
            vote_type: voteType,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'product_id,user_id'
          });

        if (error) throw error;
      }

      // Update product rankings
      const { error: rankingError } = await supabase.rpc('update_product_rankings', {
        product_id: product.id
      });

      if (rankingError) throw rankingError;

      toast.success(
        voteType === "up"
          ? "Upvoted successfully!"
          : voteType === "down"
          ? "Downvoted successfully!"
          : "Vote removed successfully!"
      );
    } catch (error) {
      // Revert optimistic update
      setProduct(previousState);
      console.error("Error submitting vote:", error);
      toast.error("Failed to submit vote", {
        description: "Please try again. If the problem persists, contact support."
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    product,
    isLoading,
    vote,
  };
}
