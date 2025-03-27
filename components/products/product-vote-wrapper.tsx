"use client"

import { ReactNode } from "react"
import { Product } from "@/types/product"
import { useGlobalVotes } from "@/hooks/use-global-votes"

interface ProductVoteWrapperProps {
  product: Pick<Product, "id" | "name">
  children: (voteData: {
    voteType: number | null
    upvotes: number
    downvotes: number
    score: number
    isLoading: boolean
  }) => ReactNode
}

/**
 * A wrapper component that provides vote data for a product
 * and ensures consistent vote tracking across different parts of the site.
 */
export function ProductVoteWrapper({
  product,
  children
}: ProductVoteWrapperProps) {
  const { useProductVoteStatus } = useGlobalVotes()
  
  // Get vote status from global cache
  const { 
    data: voteStatus,
    isLoading: isLoadingVoteStatus,
  } = useProductVoteStatus(product.id)
  
  // Extract vote info with sensible defaults
  const upvotes = voteStatus?.upvotes ?? 0
  const downvotes = voteStatus?.downvotes ?? 0
  const voteType = voteStatus?.voteType ?? null
  const score = voteStatus?.score ?? upvotes - downvotes
  
  // Render children with vote data
  return (
    <>
      {children({
        voteType,
        upvotes,
        downvotes,
        score,
        isLoading: isLoadingVoteStatus
      })}
    </>
  )
} 