"use client"

import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import type { Database } from '@/types/supabase'
import { useToast } from '@/components/ui/use-toast'
import { Product } from '@/types/product'

type ProductRanking = Database['public']['Functions']['get_product_rankings']['Returns'][0]

// Helper function to calculate score
const calculateScore = (product: any) => {
  const upvotes = typeof product.upvotes === 'number' ? product.upvotes : 0;
  const downvotes = typeof product.downvotes === 'number' ? product.downvotes : 0;
  return upvotes - downvotes;
};

export function useProducts() {
  const { toast } = useToast()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProducts = useCallback(async (category?: string) => {
    try {
      setLoading(true)
      console.log('Fetching products with category:', category)
      
      // Try to fetch from API first
      try {
        const url = new URL('/api/products', window.location.origin);
        if (category) {
          url.searchParams.append('category', category);
        }
        
        // Get client ID from localStorage or generate a new one
        let clientId = 'anonymous';
        if (typeof window !== 'undefined') {
          clientId = localStorage.getItem('tierd_client_id') || 'anonymous';
        }
        url.searchParams.append('clientId', clientId);
        
        const response = await fetch(url.toString());
        if (response.ok) {
          const data = await response.json();
          
          if (data.products && Array.isArray(data.products)) {
            console.log('Fetched products from API:', data.products.length);
            
            // Ensure all products have the required fields
            const validatedProducts = data.products.map((product: Partial<Product>) => ({
              ...product,
              upvotes: typeof product.upvotes === 'number' ? product.upvotes : 0,
              downvotes: typeof product.downvotes === 'number' ? product.downvotes : 0,
              score: product.score !== undefined ? product.score : calculateScore(product),
              image_url: product.image_url || '/images/products/placeholder.svg'
            }));
            
            // Sort products by score
            const sortedProducts = [...validatedProducts].sort((a, b) => {
              // First sort by score (upvotes - downvotes) in descending order
              const scoreA = a.score !== undefined ? a.score : calculateScore(a);
              const scoreB = b.score !== undefined ? b.score : calculateScore(b);
              
              if (scoreB !== scoreA) {
                return scoreB - scoreA;
              }
              
              // If scores are equal, sort by total votes (upvotes + downvotes) in descending order
              const totalVotesA = (a.upvotes || 0) + (a.downvotes || 0);
              const totalVotesB = (b.upvotes || 0) + (b.downvotes || 0);
              
              if (totalVotesB !== totalVotesA) {
                return totalVotesB - totalVotesA;
              }
              
              // If total votes are equal, sort by name
              return a.name.localeCompare(b.name);
            });
            
            setProducts(sortedProducts);
            setError(null);
            setLoading(false);
            return;
          }
        }
      } catch (apiError) {
        console.error('Error fetching products from API:', apiError);
        // Fall back to Supabase
      }
      
      // Fall back to Supabase
      const { data, error: err } = await supabase.rpc(
        'get_product_rankings',
        category ? { p_category: category } : {}
      )

      if (err) {
        console.error('Error fetching products:', err)
        throw err
      }

      if (!data) {
        console.log('No products found')
        setProducts([])
        setError(null)
        return
      }

      console.log('Fetched products:', data.length)
      const normalizedProducts = data.map((product: ProductRanking) => ({
        id: product.id,
        name: product.name,
        description: product.description || '',
        category: product.category,
        price: product.price || 0,
        image_url: product.image_url || `/images/products/${product.category.toLowerCase()}.png`,
        imageUrl: product.image_url || `/images/products/${product.category.toLowerCase()}.png`,
        url_slug: product.url_slug,
        specifications: product.specifications || {},
        created_at: product.created_at,
        updated_at: product.updated_at,
        upvotes: product.upvotes || 0,
        downvotes: product.downvotes || 0,
        rating: product.rating || 0,
        review_count: product.review_count || 0,
        score: product.score || calculateScore(product),
        rank: product.rank || 0
      }))
      
      // Sort products by score
      const sortedProducts = [...normalizedProducts].sort((a, b) => {
        // First sort by score (upvotes - downvotes) in descending order
        if (b.score !== a.score) {
          return b.score - a.score;
        }
        
        // If scores are equal, sort by total votes (upvotes + downvotes) in descending order
        const totalVotesA = a.upvotes + a.downvotes;
        const totalVotesB = b.upvotes + b.downvotes;
        
        if (totalVotesB !== totalVotesA) {
          return totalVotesB - totalVotesA;
        }
        
        // If total votes are equal, sort by name
        return a.name.localeCompare(b.name);
      });
      
      setProducts(sortedProducts)
      setError(null)
    } catch (err) {
      console.error('Error fetching products:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch products')
      toast({
        title: 'Error',
        description: 'Failed to fetch products. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  const vote = useCallback(async (productId: string, voteType: 'upvote' | 'downvote') => {
    try {
      // Get client ID from localStorage
      let clientId = 'anonymous';
      if (typeof window !== 'undefined') {
        clientId = localStorage.getItem('tierd_client_id') || 'anonymous';
      }

      // Call the vote API endpoint
      const response = await fetch('/api/vote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId,
          voteType: voteType === 'upvote' ? 1 : -1,
          clientId
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to vote');
      }

      // Refresh products to get updated rankings
      await fetchProducts();
      
      toast({
        title: 'Success',
        description: 'Your vote has been recorded.',
      });
    } catch (err) {
      console.error('Error voting:', err);
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to record your vote. Please try again.',
        variant: 'destructive',
      });
    }
  }, [fetchProducts, toast]);

  const submitReview = useCallback(async (
    productId: string,
    review: {
      rating: number
      title: string
      content: string
      pros?: string[]
      cons?: string[]
    }
  ) => {
    try {
      const { error } = await supabase
        .from('reviews')
        .insert({
          product_id: productId,
          ...review
        })

      if (error) throw error

      // Refresh products to get updated rankings
      await fetchProducts()
      toast({
        title: 'Success',
        description: 'Your review has been submitted.',
      })
    } catch (err) {
      console.error('Error submitting review:', err)
      toast({
        title: 'Error',
        description: 'Failed to submit your review. Please try again.',
        variant: 'destructive',
      })
    }
  }, [fetchProducts, toast])

  const getProductReviews = useCallback(async (productId: string) => {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('*, user:user_profiles(id, username, avatar_url)')
        .eq('product_id', productId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data
    } catch (err) {
      console.error('Error fetching reviews:', err)
      toast({
        title: 'Error',
        description: 'Failed to fetch reviews. Please try again.',
        variant: 'destructive',
      })
      return []
    }
  }, [toast])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  return {
    products,
    loading,
    error,
    fetchProducts,
    vote,
    submitReview,
    getProductReviews,
  }
} 