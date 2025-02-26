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
  result?: {
    upvotes: number;
    downvotes: number;
    voteType: number | null;
  };
}

export function useVote() {
  const [isLoading, setIsLoading] = useState(false)
  const queryClient = useQueryClient()

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
      const response = await fetch("/api/vote", {
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

      if (!response.ok) {
        throw new Error(data.error || "Failed to vote")
      }

      // Invalidate queries to refresh data
      await queryClient.invalidateQueries({ queryKey: ["products"] })
      await queryClient.invalidateQueries({ queryKey: ["product", product.id] })

      return {
        success: true,
        result: data.result,
      }
    } catch (error) {
      console.error("Vote error:", error)
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
      const response = await fetch(`/api/vote?productId=${productId}&clientId=${getClientId()}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to get vote status")
      }

      return {
        success: true,
        result: {
          upvotes: data.upvotes,
          downvotes: data.downvotes,
          voteType: data.voteType,
        },
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
