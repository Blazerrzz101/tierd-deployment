"use client";

import { useState, useEffect } from "react"
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
  hasVoted?: boolean;
  message?: string;
  remainingVotes?: number;
}

export function useVote() {
  const [isLoading, setIsLoading] = useState(false)
  const [remainingVotes, setRemainingVotes] = useState<number | null>(null)
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

  // Fetch remaining votes for anonymous users
  const fetchRemainingVotes = async (): Promise<number> => {
    try {
      const response = await fetch(`/api/vote/remaining-votes?clientId=${getClientId()}`)
      
      if (!response.ok) {
        throw new Error(`Failed to get remaining votes: ${response.statusText}`)
      }
      
      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || "Failed to get remaining votes")
      }
      
      setRemainingVotes(data.remainingVotes)
      return data.remainingVotes
    } catch (error) {
      console.error("Error fetching remaining votes:", error)
      return 0
    }
  }

  // Load remaining votes on mount
  useEffect(() => {
    fetchRemainingVotes()
  }, [])

  const vote = async (product: VoteProduct, voteType: 1 | -1): Promise<VoteResponse> => {
    if (!product?.id) {
      return { success: false, error: "Invalid product" }
    }

    setIsLoading(true)
    try {
      // Use our API endpoint
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

      // Handle HTTP errors
      if (!response.ok) {
        // Check for rate limit errors specifically
        if (response.status === 429) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Rate limit exceeded. Please sign in to vote more.")
        }
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      // Handle API errors
      if (!data.success) {
        throw new Error(data.error || "Failed to vote")
      }

      // Update remaining votes if included in the response
      if (data.remainingVotes !== undefined) {
        setRemainingVotes(data.remainingVotes)
      } else {
        // Refresh the remaining votes count
        fetchRemainingVotes()
      }

      // Ensure the data has the expected properties, with defaults if missing
      const result: VoteResponse = {
        success: true,
        upvotes: data.upvotes ?? 0,
        downvotes: data.downvotes ?? 0, 
        voteType: data.voteType !== undefined ? data.voteType : null,
        score: data.score ?? (data.upvotes ?? 0) - (data.downvotes ?? 0),
        hasVoted: data.hasVoted ?? (data.voteType !== null),
        message: data.message || "Vote recorded successfully",
      }

      // Invalidate queries to refresh data
      await queryClient.invalidateQueries({ queryKey: ["products"] })
      await queryClient.invalidateQueries({ queryKey: ["product", product.id] })
      
      // Add a toast notification to confirm vote
      if (data.voteType === null) {
        toast({
          title: "Vote Removed",
          description: `Your vote for ${product.name} has been removed`,
          variant: "default",
        })
      } else {
        toast({
          title: voteType === 1 ? "Upvoted" : "Downvoted",
          description: `You ${voteType === 1 ? "upvoted" : "downvoted"} ${product.name}`,
          variant: "default",
        })
      }

      return result
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
        voteType: null, // Add this to prevent the error
      }
    } finally {
      setIsLoading(false)
    }
  }

  const getVoteStatus = async (productId: string): Promise<VoteResponse> => {
    try {
      if (!productId) {
        return { 
          success: false, 
          error: "Product ID is required",
          voteType: null, // Add this to prevent the error
        }
      }
      
      // Use our vote API endpoint with query parameter
      const response = await fetch(`/api/vote?productId=${productId}&clientId=${getClientId()}`)
      
      if (!response.ok) {
        throw new Error(`Failed to get vote status: ${response.statusText}`)
      }
      
      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || "Failed to get vote status")
      }
      
      return {
        success: true,
        upvotes: data.upvotes ?? 0,
        downvotes: data.downvotes ?? 0,
        voteType: data.voteType !== undefined ? data.voteType : null,
        score: data.score ?? (data.upvotes ?? 0) - (data.downvotes ?? 0),
        hasVoted: data.hasVoted ?? (data.voteType !== null),
      }
    } catch (error) {
      console.error("Vote status error:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to get vote status",
        voteType: null, // Add this to prevent the error
      }
    }
  }

  return {
    vote,
    getVoteStatus,
    isLoading,
    getClientId,
    remainingVotes,
    fetchRemainingVotes,
  }
}
