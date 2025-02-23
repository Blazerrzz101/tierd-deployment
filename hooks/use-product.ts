"use client"

import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase/client"
import { Product, Review, Thread, UserProfile } from "@/types/product"

interface ReviewResponse {
  id: string
  rating: number
  title: string | null
  content: string | null
  pros: string[] | null
  cons: string[] | null
  created_at: string
  user: {
    id: string
    email: string
    username: string
    avatar_url: string | null
  } | null
}

interface ThreadResponse {
  id: string
  title: string | null
  content: string | null
  created_at: string
  user: {
    id: string
    email: string
    username: string
    avatar_url: string | null
  } | null
}

export function useProduct(slug: string) {
  return useQuery<Product>({
    queryKey: ['product', slug],
    queryFn: async () => {
      // First get the product details
      const { data: productData, error: productError } = await supabase
        .rpc('get_product_details', { p_slug: slug })

      if (productError) {
        console.error('Error fetching product:', productError)
        throw productError
      }
      
      if (!productData || productData.length === 0) {
        console.error('No product found with slug:', slug)
        throw new Error('Product not found')
      }

      const product = productData[0]

      // Get reviews with user profiles
      const { data: reviews, error: reviewsError } = await supabase
        .from('reviews')
        .select(`
          id,
          rating,
          title,
          content,
          pros,
          cons,
          created_at,
          user:user_profiles (
            id,
            email,
            username,
            avatar_url
          )
        `)
        .eq('product_id', product.id)
        .order('created_at', { ascending: false })
        .returns<ReviewResponse[]>()

      if (reviewsError) {
        console.error('Error fetching reviews:', reviewsError)
      }

      // Get threads with user profiles
      const { data: threads, error: threadsError } = await supabase
        .from('threads')
        .select(`
          id,
          title,
          content,
          created_at,
          user:user_profiles (
            id,
            email,
            username,
            avatar_url
          )
        `)
        .eq('product_id', product.id)
        .order('created_at', { ascending: false })
        .returns<ThreadResponse[]>()

      if (threadsError) {
        console.error('Error fetching threads:', threadsError)
      }

      // Calculate average rating
      const reviewsList = reviews || []
      const averageRating = reviewsList.length > 0
        ? reviewsList.reduce((acc, review) => acc + review.rating, 0) / reviewsList.length
        : 0

      // Transform the data to match the Product interface
      const transformedProduct: Product = {
        id: product.id,
        name: product.name,
        description: product.description,
        category: product.category,
        price: product.price,
        imageUrl: product.image_url || `/images/products/${product.category}/placeholder.jpg`,
        image_url: product.image_url || `/images/products/${product.category}/placeholder.jpg`,
        url_slug: product.url_slug,
        specifications: product.specifications || {},
        created_at: product.created_at,
        updated_at: product.updated_at,
        upvotes: product.upvotes || 0,
        downvotes: product.downvotes || 0,
        rating: averageRating,
        review_count: reviewsList.length,
        reviews: reviewsList.map(review => ({
          id: review.id,
          content: review.content || '',
          title: review.title || '',
          rating: review.rating,
          pros: review.pros || [],
          cons: review.cons || [],
          created_at: review.created_at,
          user: {
            id: review.user?.id || 'anonymous',
            email: review.user?.email || '',
            display_name: review.user?.username || 'Anonymous',
            username: review.user?.username || 'anonymous',
            avatar_url: review.user?.avatar_url || null
          }
        })),
        threads: (threads || []).map(thread => ({
          id: thread.id,
          title: thread.title || '',
          content: thread.content || '',
          created_at: thread.created_at,
          user: {
            id: thread.user?.id || 'anonymous',
            email: thread.user?.email || '',
            display_name: thread.user?.username || 'Anonymous',
            username: thread.user?.username || 'anonymous',
            avatar_url: thread.user?.avatar_url || null
          }
        }))
      }

      return transformedProduct
    },
    staleTime: 1000 * 60 * 5, // Consider data fresh for 5 minutes
    retry: 2
  })
} 