"use client"

import { useQuery } from "@tanstack/react-query"
import { Product } from "@/types/product"

export function useProduct(productIdOrSlug: string, isSlug = false) {
  return useQuery<Product>({
    queryKey: ['product', productIdOrSlug],
    queryFn: async () => {
      try {
        // Determine if we're looking up by ID or slug
        const queryParam = isSlug ? 'slug' : 'id';
        
        // Use our non-dynamic API endpoint with appropriate query parameter
        const response = await fetch(`/api/products/product?${queryParam}=${productIdOrSlug}&clientId=${getClientId()}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Product not found');
          }
          throw new Error(`Error fetching product: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (!data.success) {
          throw new Error(data.error || 'Error fetching product');
        }
        
        return data.product;
      } catch (error) {
        console.error('Error in useProduct hook:', error);
        throw error;
      }
    },
    staleTime: 1000 * 60 * 5, // Consider data fresh for 5 minutes
    retry: 2
  });
}

// Get client ID for voting
function getClientId() {
  if (typeof window === 'undefined') return 'server-side';
  
  const storedId = localStorage.getItem('clientId');
  if (storedId) return storedId;
  
  const newId = Math.random().toString(36).substring(2);
  localStorage.setItem('clientId', newId);
  return newId;
} 