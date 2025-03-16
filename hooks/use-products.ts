"use client"

import { useQuery } from "@tanstack/react-query"
import { Product } from "@/types/product"

export function useProducts(category?: string) {
  return useQuery<Product[]>({
    queryKey: ['products', category],
    queryFn: async () => {
      try {
        // Use our mock API endpoint with optional category filtering
        const url = new URL('/api/products', window.location.origin)
        if (category) {
          url.searchParams.append('category', category)
        }
        
        const response = await fetch(url.toString())
        
        if (!response.ok) {
          throw new Error(`Error fetching products: ${response.statusText}`)
        }
        
        const products = await response.json()
        
        // Sort products by score (most upvoted first)
        return products.sort((a: Product, b: Product) => {
          // First by score (upvotes - downvotes)
          const scoreA = (a.upvotes || 0) - (a.downvotes || 0)
          const scoreB = (b.upvotes || 0) - (b.downvotes || 0)
          
          if (scoreB !== scoreA) {
            return scoreB - scoreA
          }
          
          // Then by total votes
          const totalVotesA = (a.upvotes || 0) + (a.downvotes || 0)
          const totalVotesB = (b.upvotes || 0) + (b.downvotes || 0)
          
          if (totalVotesB !== totalVotesA) {
            return totalVotesB - totalVotesA
          }
          
          // Finally by name
          return a.name.localeCompare(b.name)
        })
      } catch (error) {
        console.error('Error in useProducts hook:', error)
        throw error
      }
    },
    staleTime: 1000 * 60 * 5, // Consider data fresh for 5 minutes
  })
}