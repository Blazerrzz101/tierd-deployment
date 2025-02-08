"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { StarRating } from "@/components/reviews/star-rating"
import { ReviewForm } from "@/components/reviews/review-form"
import { ReviewList } from "@/components/reviews/review-list"
import { mockReviews } from "@/lib/mock-reviews"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

interface ProductReviewsProps {
  productId: string
}

export function ProductReviews({ productId }: ProductReviewsProps) {
  const [sortBy, setSortBy] = useState<"recent" | "helpful">("helpful")
  const productReviews = mockReviews.filter(review => review.productId === productId)

  // Calculate average rating
  const averageRating = productReviews.reduce((acc, review) => acc + review.rating, 0) / productReviews.length

  // Calculate rating distribution
  const ratingDistribution = Array.from({ length: 5 }, (_, i) => {
    const count = productReviews.filter(review => review.rating === i + 1).length
    return {
      stars: i + 1,
      count,
      percentage: (count / productReviews.length) * 100
    }
  }).reverse()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Customer Reviews</h2>
          <p className="text-muted-foreground">
            {productReviews.length} reviews
          </p>
        </div>
        <Sheet>
          <SheetTrigger asChild>
            <Button>Write a Review</Button>
          </SheetTrigger>
          <SheetContent className="sm:max-w-2xl">
            <SheetHeader>
              <SheetTitle>Write a Review</SheetTitle>
              <SheetDescription>
                Share your experience with this product
              </SheetDescription>
            </SheetHeader>
            <ReviewForm productId={productId} onSubmit={() => {}} />
          </SheetContent>
        </Sheet>
      </div>

      <div className="grid gap-6 lg:grid-cols-[300px,1fr]">
        {/* Rating Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Rating Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <div className="text-4xl font-bold">
                {averageRating.toFixed(1)}
              </div>
              <StarRating rating={averageRating} />
              <p className="mt-2 text-sm text-muted-foreground">
                Based on {productReviews.length} reviews
              </p>
            </div>

            <div className="space-y-2">
              {ratingDistribution.map((dist) => (
                <div key={dist.stars} className="flex items-center gap-2">
                  <div className="w-12 text-sm">{dist.stars} stars</div>
                  <div className="flex-1">
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full bg-primary transition-all"
                        style={{ width: `${dist.percentage}%` }}
                      />
                    </div>
                  </div>
                  <div className="w-12 text-right text-sm text-muted-foreground">
                    {dist.count}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Review List */}
        <ReviewList
          reviews={productReviews}
          sortBy={sortBy}
          onSort={setSortBy}
        />
      </div>
    </div>
  )
}