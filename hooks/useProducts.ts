"use client"

import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import type { Database } from '@/types/supabase'
import { useToast } from '@/components/ui/use-toast'

type ProductRanking = Database['public']['Views']['product_rankings']['Row']

export function useProducts() {
  const { toast } = useToast()
  const [products, setProducts] = useState<ProductRanking[]>([])
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

      console.log('Fetched products:', data?.length)
      setProducts(data || [])
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

  const vote = useCallback(async (productId: string, voteType: 'up' | 'down') => {
    try {
      const { error } = await supabase.rpc(
        'vote_for_product',
        {
          p_product_id: productId,
          p_vote_type: voteType === 'up' ? 1 : -1
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
        .select('*')
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