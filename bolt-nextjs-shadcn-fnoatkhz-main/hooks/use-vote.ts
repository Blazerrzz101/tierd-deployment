"use client";

import { useEffect, useState } from "react";
import { Product, VoteType } from "@/types";
import { supabase } from "@/lib/supabase/client";
import { toast } from "sonner";
import { useAuth } from "./use-auth";

export function useVote(initialProduct: Product) {
  const [product, setProduct] = useState(initialProduct);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  // Listen for real-time vote updates
  useEffect(() => {
    const handleVoteUpdate = (event: CustomEvent) => {
      const voteData = event.detail;
      if (voteData.product_id === product.id) {
        setProduct((prev) => ({
          ...prev,
          votes: voteData.total_votes,
        }));
      }
    };

    window.addEventListener("vote-update", handleVoteUpdate as EventListener);
    return () => {
      window.removeEventListener(
        "vote-update",
        handleVoteUpdate as EventListener
      );
    };
  }, [product.id]);

  const vote = async (voteType: VoteType) => {
    if (!user) {
      toast.error("Please sign in to vote");
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

      const optimisticProduct = {
        ...product,
        votes: product.votes + voteChange + previousVoteChange,
        userVote: voteType,
      };

      setProduct(optimisticProduct);

      const { error } = await supabase.from("product_votes").upsert({
        product_id: product.id,
        user_id: user.id,
        vote_type: voteType,
        updated_at: new Date().toISOString(),
      });

      if (error) throw error;

      await supabase.from("activities").insert({
        user_id: user.id,
        type: "vote",
        product_id: product.id,
        product_name: product.name,
        action:
          voteType === "up"
            ? "upvoted"
            : voteType === "down"
            ? "downvoted"
            : "removed vote",
      });

      toast.success(
        voteType === "up"
          ? "Upvoted successfully!"
          : voteType === "down"
          ? "Downvoted successfully!"
          : "Vote removed successfully!"
      );
    } catch (error) {
      setProduct(product);
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
