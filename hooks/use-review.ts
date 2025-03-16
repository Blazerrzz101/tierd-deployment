"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase/client"
import { useAuth } from "./use-auth"
import { toast } from "sonner"

interface Review {
  id: string
  product_id: string
  user_id: string
  rating: number
  title: string
  content: string
  helpful_count: number
  created_at: string
}

interface ReviewInput {
  title: string
  content: string
  rating: number
}

export function useReview(productId: string) {
  const [isLoading, setIsLoading] = useState(false)
  const [reviews, setReviews] = useState<Review[]>([])
  const { user } = useAuth()

  // Listen for real-time review updates
  useEffect(() => {
    const handleReviewUpdate = (event: CustomEvent) => {
      const reviewData = event.detail
      if (reviewData.product_id === productId) {
        setReviews(prev => {
          const index = prev.findIndex(r => r.id === reviewData.id)
          if (index === -1) {
            return [...prev, reviewData]
          }
          const updated = [...prev]
          updated[index] = reviewData
          return updated
        })
      }
    }

    window.addEventListener('review-update', handleReviewUpdate as EventListener)
    return () => {
      window.removeEventListener('review-update', handleReviewUpdate as EventListener)
    }
  }, [productId])

  const submitReview = async (input: ReviewInput) => {
    if (!user) {
      toast.error("Please sign in to submit a review")
      return
    }

    if (isLoading) return

    setIsLoading(true)

    try {
      // Check if user has already reviewed this product
      const { data: existingReview } = await supabase
        .from('reviews')
        .select()
        .eq('product_id', productId)
        .eq('user_id', user.id)
        .single()

      if (existingReview) {
        // Update existing review
        const { error } = await supabase
          .from('reviews')
          .update({
            rating: input.rating,
            title: input.title,
            content: input.content
          })
          .eq('id', existingReview.id)

        if (error) throw error
        toast.success("Review updated successfully!")
      } else {
        // Insert new review
        const { error } = await supabase
          .from('reviews')
          .insert({
            product_id: productId,
            user_id: user.id,
            rating: input.rating,
            title: input.title,
            content: input.content
          })

        if (error) throw error
        toast.success("Review submitted successfully!")
      }
    } catch (error) {
      console.error('Error submitting review:', error)
      toast.error("Failed to submit review. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const deleteReview = async (reviewId: string) => {
    if (!user) return

    try {
      const { error } = await supabase
        .from('reviews')
        .delete()
        .eq('id', reviewId)
        .eq('user_id', user.id)

      if (error) throw error
      toast.success("Review deleted successfully!")
    } catch (error) {
      console.error('Error deleting review:', error)
      toast.error("Failed to delete review")
    }
  }

  return {
    reviews,
    isLoading,
    submitReview,
    deleteReview
  }
}