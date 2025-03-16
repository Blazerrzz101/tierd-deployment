"use client"

import { useState } from "react"
import { Product, VoteType } from "@/types"
import { rankingStore } from "@/lib/ranking-store"
import { toast } from "sonner"

export function useProductVote(initialProduct: Product) {
  const [isLoading, setIsLoading] = useState(false)

  const vote = async (voteType: VoteType) => {
    if (isLoading) return

    setIsLoading(true)
    try {
      // If voting the same way twice, remove the vote
      if (initialProduct.userVote === voteType) {
        voteType = null
      }

      rankingStore.vote(initialProduct.id, voteType)
      
      const message = voteType === "up" 
        ? "Upvoted successfully!" 
        : voteType === "down"
        ? "Downvoted successfully!"
        : "Vote removed successfully!"
      
      toast.success(message)
    } catch (error) {
      toast.error("Failed to submit vote. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return {
    isLoading,
    vote
  }
}