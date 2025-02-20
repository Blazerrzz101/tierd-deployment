"use client";

import { useAuth } from "@/hooks/use-auth";
import { VoteType } from "@/types/product";
import { useToast } from "@/components/ui/use-toast";
import { useCallback } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export function useVote() {
  const { user } = useAuth();
  const { toast } = useToast();
  const supabase = createClientComponentClient();

  const vote = useCallback(async (productId: string, voteType: VoteType) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to vote",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase.rpc("vote_for_product", {
        p_product_id: productId,
        p_vote_type: voteType === "up" ? 1 : -1,
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Vote recorded",
        description: "Your vote has been recorded successfully",
      });
    } catch (error) {
      console.error("Error voting:", error);
      toast({
        title: "Error",
        description: "Failed to record your vote. Please try again.",
        variant: "destructive",
      });
    }
  }, [user, supabase, toast]);

  return { vote };
}
