"use client";

import { useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { useToast } from "@/components/ui/use-toast"

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
}

export function useVote() {
  const [isLoading, setIsLoading] = useState(false)
  const queryClient = useQueryClient()
  const { toast } = useToast()

  // Generate a random client ID if one doesn't exist
  const getClientId = () => {
    if (typeof window === 'undefined') return 'server-side'
    
    const storedId = localStorage.getItem('clientId')
    if (storedId) return storedId
    
    const newId = Math.random().toString(36).substring(2)
    localStorage.setItem('clientId', newId)
    return newId
  }

  const vote = async (product: VoteProduct, voteType: 1 | -1): Promise<VoteResponse> => {
    if (!product?.id) {
      return { success: false, error: "Invalid product" }
    }

    setIsLoading(true)
    try {
      // Use our non-dynamic API endpoint
      const response = await fetch("/api/products/product", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId: product.id,
          voteType,
          clientId: getClientId(),
        }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to vote")
      }

      // Invalidate queries to refresh data
      await queryClient.invalidateQueries({ queryKey: ["products"] })
      await queryClient.invalidateQueries({ queryKey: ["product", product.id] })

      // Add a toast notification to confirm vote
      toast({
        title: voteType === 1 ? "Upvoted" : "Downvoted",
        description: `You ${voteType === 1 ? "upvoted" : "downvoted"} ${product.name}`,
        variant: "default",
      })

      return {
        success: true,
        upvotes: data.upvotes,
        downvotes: data.downvotes,
        voteType: data.voteType,
        score: data.score
      }
    } catch (error) {
      console.error("Vote error:", error)
      
      // Show error toast
      toast({
        title: "Vote Failed",
        description: error instanceof Error ? error.message : "Failed to vote",
        variant: "destructive",
      })
      
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to vote",
      }
    } finally {
      setIsLoading(false)
    }
  }

  const getVoteStatus = async (productId: string): Promise<VoteResponse> => {
    try {
      // Use our non-dynamic API endpoint with query parameter
      const response = await fetch(`/api/products/product?id=${productId}&clientId=${getClientId()}`)
      
      if (!response.ok) {
        throw new Error(`Failed to get vote status: ${response.statusText}`)
      }
      
      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || "Failed to get vote status")
      }
      
      const product = data.product
      
      return {
        success: true,
        upvotes: product.upvotes,
        downvotes: product.downvotes,
        voteType: product.userVote,
        score: product.score
      }
    } catch (error) {
      console.error("Vote status error:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to get vote status",
      }
    }
  }

  return {
    vote,
    getVoteStatus,
    isLoading,
  }
}
