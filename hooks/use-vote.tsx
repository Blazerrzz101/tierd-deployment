"use client"

import { useState, useCallback, useEffect } from 'react'
import { useToast } from '@/components/ui/use-toast'
import { useEnhancedAuth } from "@/hooks/enhanced-auth"
import { VoteType, Product } from '@/types/product'

// Type that's acceptable for voting
export type VoteProduct = Pick<Product, "id" | "name">;

interface VoteResult {
  upvotes: number;
  downvotes: number;
  voteType: VoteType | null;
  error?: string;
}

export const useVote = () => {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const { user, clientId } = useEnhancedAuth()

  const vote = async (productOrId: string | VoteProduct, voteType: 1 | -1): Promise<VoteResult | null> => {
    if (isLoading) return null
    
    try {
      setIsLoading(true)
      
      // Extract productId from either a product object or string ID
      const productId = typeof productOrId === 'string' 
        ? productOrId 
        : productOrId?.id;
      
      // Validate that we have a product ID
      if (!productId) {
        toast({
          title: "Error",
          description: "Invalid product",
          variant: "destructive",
        })
        return { upvotes: 0, downvotes: 0, voteType: null, error: "Invalid product" };
      }

      // Extract product name for better toast messages
      const productName = typeof productOrId === 'string'
        ? 'product'
        : productOrId.name || 'product';
      
      const voteData = {
        productId,
        voteType,
        clientId: clientId || undefined,
        userId: user?.id || undefined,
      }
      
      const response = await fetch('/api/vote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(voteData),
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        toast({
          title: "Error",
          description: data.error || "Failed to register vote",
          variant: "destructive",
        })
        
        return { upvotes: 0, downvotes: 0, voteType: null, error: data.error || "Failed to register vote" };
      }
      
      if (data.success) {
        const voteTypeText = voteType === 1 ? "upvoted" : "downvoted"
        
        toast({
          title: "Success",
          description: `You have ${voteTypeText} ${productName}`,
        })
        
        return {
          upvotes: data.upvotes || 0,
          downvotes: data.downvotes || 0,
          voteType
        }
      }
      
      return null
    } catch (error) {
      console.error("Error voting:", error)
      
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      })
      
      return { upvotes: 0, downvotes: 0, voteType: null, error: "An error occurred" };
    } finally {
      setIsLoading(false)
    }
  }
  
  const getVoteStatus = async (productId: string) => {
    if (!productId) return null
    
    try {
      const response = await fetch(`/api/vote?productId=${productId}${clientId ? `&clientId=${clientId}` : ''}`)
      const data = await response.json()
      
      if (!response.ok) {
        return null
      }
      
      return data
    } catch (error) {
      console.error("Error fetching vote status:", error)
      return null
    }
  }
  
  return {
    vote,
    getVoteStatus,
    isLoading,
  }
} 