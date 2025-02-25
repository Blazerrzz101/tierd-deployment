"use client"

import { useQuery } from "@tanstack/react-query"
import { Product } from "@/types/product"

export function useProduct(slug: string) {
  return useQuery<Product>({
    queryKey: ['product', slug],
    queryFn: async () => {
      try {
        // Use our new API endpoint
        const response = await fetch(`/api/products/${slug}`)
        
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Product not found')
          }
          throw new Error(`Error fetching product: ${response.statusText}`)
        }
        
        const product = await response.json()
        return product
      } catch (error) {
        console.error('Error in useProduct hook:', error)
        throw error
      }
    },
    staleTime: 1000 * 60 * 5, // Consider data fresh for 5 minutes
    retry: 2
  })
} 