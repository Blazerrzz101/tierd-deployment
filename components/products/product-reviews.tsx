"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase/client"
import { useAuth } from "@/hooks/use-auth"
import { Star, ThumbsUp, Flag } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar } from "@/components/ui/avatar"
import { useToast } from "@/hooks/use-toast"
import { formatDistanceToNow } from "date-fns"

interface Review {
  id: string
  user_id: string
  product_id: string
  rating: number
  comment: string
  helpful_count: number
  created_at: string
  user: {
    display_name: string
    avatar_url: string
  }
}

interface ProductReviewsProps {
  productId: string
}

export function ProductReviews({ productId }: ProductReviewsProps) {
  const [newReview, setNewReview] = useState("")
  const [rating, setRating] = useState(5)
  const { user } = useAuth()
  const { toast } = useToast()

  // Fetch reviews
  const { data: reviews, refetch } = useQuery<Review[]>({
    queryKey: ['product-reviews', productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_reviews')
        .select(`
          *,
          user:user_profiles (
            display_name,
            avatar_url
          )
        `)
        .eq('product_id', productId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data
    }
  })

  // Submit review
  const handleSubmitReview = async () => {
    if (!user) {
      toast({
        title: "Please sign in",
        description: "You need to be signed in to leave a review."
      })
      return
    }

    try {
      const { error } = await supabase
        .from('product_reviews')
        .insert({
          product_id: productId,
          user_id: user.id,
          rating,
          comment: newReview
        })

      if (error) throw error

      toast({
        title: "Review submitted",
        description: "Thank you for your feedback!"
      })

      setNewReview("")
      setRating(5)
      refetch()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit review. Please try again.",
        variant: "destructive"
      })
    }
  }

  // Mark review as helpful
  const handleHelpful = async (reviewId: string) => {
    if (!user) {
      toast({
        title: "Please sign in",
        description: "You need to be signed in to mark reviews as helpful."
      })
      return
    }

    try {
      const { error } = await supabase.rpc('increment_helpful_count', {
        review_id: reviewId
      })

      if (error) throw error
      refetch()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to mark review as helpful.",
        variant: "destructive"
      })
    }
  }

  return (
    <div className="space-y-8">
      {/* Write a review */}
      {user && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                onClick={() => setRating(value)}
                className="focus:outline-none"
              >
                <Star
                  className={`h-6 w-6 ${
                    value <= rating
                      ? "text-yellow-400 fill-current"
                      : "text-gray-300"
                  }`}
                />
              </button>
            ))}
          </div>

          <Textarea
            value={newReview}
            onChange={(e) => setNewReview(e.target.value)}
            placeholder="Write your review..."
            className="min-h-[100px]"
          />

          <Button
            onClick={handleSubmitReview}
            disabled={!newReview.trim()}
          >
            Submit Review
          </Button>
        </div>
      )}

      {/* Reviews list */}
      <div className="space-y-6">
        {reviews?.map((review) => (
          <div key={review.id} className="space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <Avatar>
                  <img
                    src={review.user.avatar_url || "/default-avatar.png"}
                    alt={review.user.display_name}
                  />
                </Avatar>
                <div>
                  <p className="font-medium">{review.user.display_name}</p>
                  <div className="flex items-center gap-2">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < review.rating
                              ? "text-yellow-400 fill-current"
                              : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-gray-500">
                      {formatDistanceToNow(new Date(review.created_at), {
                        addSuffix: true
                      })}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleHelpful(review.id)}
                >
                  <ThumbsUp className="h-4 w-4 mr-1" />
                  {review.helpful_count}
                </Button>
                <Button variant="ghost" size="sm">
                  <Flag className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <p className="text-gray-600">{review.comment}</p>
          </div>
        ))}

        {!reviews?.length && (
          <p className="text-center text-gray-500">
            No reviews yet. Be the first to review this product!
          </p>
        )}
      </div>
    </div>
  )
}