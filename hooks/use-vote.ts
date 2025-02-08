"use client";

import { useEffect, useState } from "react";
import { Product } from "@/types/product";
import { toast } from "sonner";
import { useAuth } from "./use-auth";
import { handleVote, getUserVote } from "@/app/actions";

type VoteType = 'up' | 'down' | null;

export function useVote(initialProduct: Product) {
  const [product, setProduct] = useState(initialProduct);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  // Load initial vote state
  useEffect(() => {
    async function loadUserVote() {
      if (!user) return;

      try {
        const { userVote } = await getUserVote(product.id);
        if (userVote) {
          setProduct(prev => ({
            ...prev,
            userVote,
            url_slug: prev.url_slug
          }));
        }
      } catch (err) {
        console.error("Error in loadUserVote:", err);
      }
    }

    loadUserVote();
  }, [user, product.id]);

  const vote = async (voteType: VoteType) => {
    if (!user) {
      toast.error("Please sign in to vote", {
        description: "Create an account or sign in to vote on products"
      });
      return;
    }

    if (isLoading) return;
    setIsLoading(true);

    try {
      if (product.userVote === voteType) {
        voteType = null;
      }

      const previousVote = product.userVote;
      const voteChange = voteType === "up" ? 1 : voteType === "down" ? -1 : 0;
      const previousVoteChange =
        previousVote === "up" ? -1 : previousVote === "down" ? 1 : 0;

      // Optimistic update
      setProduct(prev => ({
        ...prev,
        votes: prev.votes + voteChange + previousVoteChange,
        userVote: voteType,
        url_slug: prev.url_slug
      }));

      const { success, error } = await handleVote(product.id, voteType);

      if (!success) throw new Error(error);

      toast.success(
        voteType === "up"
          ? "Upvoted successfully!"
          : voteType === "down"
          ? "Downvoted successfully!"
          : "Vote removed successfully!"
      );
    } catch (error) {
      // Revert optimistic update
      setProduct(product);
      console.error("Error submitting vote:", error);
      toast.error("Failed to submit vote. Please try again.");
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
