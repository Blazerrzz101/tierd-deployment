"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { mockReviews } from "@/lib/mock-reviews"
import { ReviewCard } from "@/components/reviews/review-card"

export function ReviewsSection() {
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr,300px]">
      {/* Main Content */}
      <div className="space-y-6">
        <div className="flex justify-between">
          <h2 className="text-2xl font-bold">Latest Reviews</h2>
          <Button>Write a Review</Button>
        </div>

        <div className="space-y-6">
          {mockReviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        <Card className="p-4">
          <h3 className="mb-4 font-semibold">Top Reviewers</h3>
          <div className="space-y-4">
            {mockReviews.slice(0, 3).map((review) => (
              <div key={review.id} className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-primary/10" />
                <div>
                  <div className="font-medium">{review.user.name}</div>
                  <div className="text-sm text-muted-foreground">12 reviews</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}