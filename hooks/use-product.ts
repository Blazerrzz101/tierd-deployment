"use client"

import { useQuery } from "@tanstack/react-query"
import { Product } from "@/types/product"

export function useProduct(productId: string) {
  return useQuery<Product>({
    queryKey: ['product', productId],
    queryFn: async () => {
      try {
        // Use our non-dynamic API endpoint with query parameter
        const response = await fetch(`/api/products/product?id=${productId}`)
        
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Product not found')
          }
          throw new Error(`Error fetching product: ${response.statusText}`)
        }
        
        const data = await response.json()
        
        if (!data.success) {
          throw new Error(data.error || 'Error fetching product')
        }
        
        return data.product
      } catch (error) {
        console.error('Error in useProduct hook:', error)
        throw error
      }
    },
    staleTime: 1000 * 60 * 5, // Consider data fresh for 5 minutes
    retry: 2
  })
} 