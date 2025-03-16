import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

interface CategoryAnalytics {
  id: string
  category_id: string
  views: number
  clicks: number
  conversion_rate: number
  trending_score: number
  updated_at: string
}

interface TrendingCategory extends CategoryAnalytics {
  name: string
  description: string
  icon: string
  product_count: number
}

export function useCategoryAnalytics() {
  const queryClient = useQueryClient()

  // Fetch trending categories
  const { data: trendingCategories, isLoading } = useQuery<TrendingCategory[]>({
    queryKey: ['trending-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trending_categories')
        .select('*')
        .order('trending_score', { ascending: false })

      if (error) throw error
      return data
    },
    refetchInterval: 30000 // Refetch every 30 seconds
  })

  // Track category view
  const trackView = useMutation({
    mutationFn: async (categoryId: string) => {
      const { error } = await supabase.rpc('increment_category_views', {
        category: categoryId
      })
      if (error) throw error
    }
  })

  // Track category click
  const trackClick = useMutation({
    mutationFn: async (categoryId: string) => {
      const { error } = await supabase.rpc('increment_category_clicks', {
        category: categoryId
      })
      if (error) throw error
    }
  })

  // Subscribe to real-time updates
  useEffect(() => {
    const subscription = supabase
      .channel('category_analytics')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'category_analytics'
      }, () => {
        // Invalidate and refetch trending categories
        queryClient.invalidateQueries({ queryKey: ['trending-categories'] })
      })
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [queryClient])

  return {
    trendingCategories,
    isLoading,
    trackView: (categoryId: string) => trackView.mutate(categoryId),
    trackClick: (categoryId: string) => trackClick.mutate(categoryId)
  }
} 