import { useCallback, useEffect, useState } from 'react'
import { useSupabaseClient } from '@supabase/auth-helpers-react'
import type { Database } from '@/types/supabase'
import { useToast } from '@/components/ui/use-toast'

type Product = Database['public']['Tables']['products']['Row']
type ProductRanking = Database['public']['Views']['product_rankings']['Row']
type Vote = Database['public']['Tables']['votes']['Row']
type Review = Database['public']['Tables']['reviews']['Row']

export function useProducts() {
  const supabase = useSupabaseClient<Database>()
  const { toast } = useToast()
  const [products, setProducts] = useState<ProductRanking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProducts = useCallback(async (category?: string) => {
    try {
      setLoading(true)
      let query = supabase
        .from('product_rankings')
        .select('*')
        .order('rank', { ascending: true })
      
      if (category) {
        query = query.eq('category', category)
      }

      const { data, error: err } = await query

      if (err) throw err
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
  }, [supabase, toast])

  const vote = useCallback(async (productId: string, voteType: 'upvote' | 'downvote') => {
    try {
      const { data: existingVote, error: fetchError } = await supabase
        .from('votes')
        .select('*')
        .eq('product_id', productId)
        .single()

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError
      }

      if (existingVote) {
        if (existingVote.vote_type === voteType) {
          // Remove vote if clicking the same type
          const { error: deleteError } = await supabase
            .from('votes')
            .delete()
            .eq('id', existingVote.id)

          if (deleteError) throw deleteError
        } else {
          // Update vote if changing type
          const { error: updateError } = await supabase
            .from('votes')
            .update({ vote_type: voteType })
            .eq('id', existingVote.id)

          if (updateError) throw updateError
        }
      } else {
        // Create new vote
        const { error: insertError } = await supabase
          .from('votes')
          .insert({ product_id: productId, vote_type: voteType })

        if (insertError) throw insertError
      }

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
  }, [supabase, fetchProducts, toast])

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
  }, [supabase, fetchProducts, toast])

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
  }, [supabase, toast])

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