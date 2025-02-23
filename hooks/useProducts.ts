"use client"

import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import type { Database } from '@/types/supabase'
import { useToast } from '@/components/ui/use-toast'
import { Product } from '@/types/product'

type ProductRanking = Database['public']['Functions']['get_product_rankings']['Returns'][0]

export function useProducts() {
  const { toast } = useToast()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProducts = useCallback(async (category?: string) => {
    try {
      setLoading(true)
      console.log('Fetching products with category:', category)
      
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
        score: product.score || 0,
        rank: product.rank || 0
      }))
      setProducts(normalizedProducts)
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
      const { error } = await supabase.rpc(
        'vote_for_product',
        {
          p_product_id: productId,
          p_vote_type: voteType
        }
      )

      if (error) throw error

      // Refresh products to get updated rankings
      await fetchProducts()
      toast({
        title: 'Success',
        description: 'Your vote has been recorded.',
      })
    } catch (err) {
      console.error('Error voting:', err)
      toast({
        title: 'Error',
        description: 'Failed to record your vote. Please try again.',
        variant: 'destructive',
      })
    }
  }, [fetchProducts, toast])

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