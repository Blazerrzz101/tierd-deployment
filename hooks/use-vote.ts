"use client";

import { useState } from "react";
import { Product, VoteType } from "@/types/product";
import { supabase } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "./use-auth";
import { useRouter } from "next/navigation";

function generateClientId() {
  return 'anon_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
}

function getClientId() {
  if (typeof window === 'undefined') return null;
  
  let clientId = localStorage.getItem('vote_client_id');
  if (!clientId) {
    clientId = generateClientId();
    localStorage.setItem('vote_client_id', clientId);
  }
  return clientId;
}

export function useVote() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const router = useRouter();

  const vote = async (product: Product | undefined, voteType: VoteType) => {
    if (!product) {
      console.error('No product provided to vote function');
      return false;
    }

    if (loading) {
      return false;
    }

    try {
      setLoading(true);
      const clientId = getClientId();

      const { data, error } = await supabase.rpc('vote_for_product', {
        p_product_id: product.id,
        p_vote_type: voteType === 1 ? 'upvote' : 'downvote',
        p_client_id: clientId
      });

      if (error) {
        console.error('Error voting:', error);
        toast({
          title: "Error",
          children: "Failed to submit vote. Please try again.",
          variant: "destructive"
        });
        return false;
      }

      toast({
        title: "Success",
        children: `Successfully ${voteType === 1 ? 'upvoted' : 'downvoted'} ${product.name}`,
      });

      // Refresh the page to update the UI
      router.refresh();
      return true;

    } catch (error) {
      console.error('Error in vote function:', error);
      toast({
        title: "Error",
        children: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    vote,
    loading,
    isAuthenticated: !!user
  };
}
