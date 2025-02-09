"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Product } from "@/types/product";

type VoteType = "up" | "down" | null;

interface Vote {
  id: string;
  user_id: string;
  product_id: string;
  type: VoteType;
}

export function useVote(initialProduct: Product) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch current product with votes
  const { data: product } = useQuery<Product & { userVote?: VoteType }>({
    queryKey: ['product', initialProduct.id, 'votes', user?.id],
    queryFn: async () => {
      const [productVote] = await Promise.all([
        // Get user's vote if logged in
        user ? supabase
          .from('product_votes')
          .select('type')
          .eq('product_id', initialProduct.id)
          .eq('user_id', user.id)
          .single()
          .then(({ data }) => data?.type)
          : null,
      ]);

      return {
        ...initialProduct,
        userVote: productVote || null
      };
    },
    initialData: { ...initialProduct, userVote: null },
    enabled: !!initialProduct.id
  });

  // Vote mutation
  const { mutate: vote, isLoading } = useMutation({
    mutationFn: async (voteType: VoteType) => {
      if (!user) {
        throw new Error('Must be logged in to vote');
      }

      if (voteType === product?.userVote) {
        // Remove vote
        await supabase
          .from('product_votes')
          .delete()
          .eq('product_id', product.id)
          .eq('user_id', user.id);
      } else {
        // Upsert vote
        await supabase
          .from('product_votes')
          .upsert({
            product_id: product.id,
            user_id: user.id,
            type: voteType
          });
      }
    },
    onMutate: async (newVoteType) => {
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to vote.",
          variant: "destructive"
        });
        return;
      }

      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['product', product?.id] });

      // Optimistically update the product
      const previousProduct = queryClient.getQueryData(['product', product?.id]);
      
      queryClient.setQueryData(['product', product?.id], {
        ...product,
        votes: (product?.votes || 0) + (
          newVoteType === 'up' ? 1 : 
          newVoteType === 'down' ? -1 : 
          product?.userVote === 'up' ? -1 :
          product?.userVote === 'down' ? 1 : 0
        ),
        userVote: newVoteType
      });

      return { previousProduct };
    },
    onError: (err, newVoteType, context) => {
      // Revert optimistic update
      queryClient.setQueryData(
        ['product', product?.id],
        context?.previousProduct
      );
      
      toast({
        title: "Error",
        description: "Failed to save vote. Please try again.",
        variant: "destructive"
      });
    },
    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['product', product?.id] });
    }
  });

  return {
    product: product || initialProduct,
    vote,
    isLoading
  };
}
