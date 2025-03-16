"use client"

import { ReviewsHero } from "@/components/reviews/hero-section"
import { TrendingCarousel } from "@/components/reviews/trending-carousel"
import { ReviewCard } from "@/components/reviews/review-card"
import { CommunitySidebar } from "@/components/reviews/community-sidebar"
import { mockReviews } from "@/lib/mock-reviews"

const trendingReviews = [
  {
    id: "1",
    title: "The Perfect Gaming Mouse for FPS Games",
    excerpt: "After months of testing, this mouse has completely transformed my aim...",
    rating: 5,
    author: "Alex Chen",
    productName: "Razer DeathAdder V3 Pro",
    category: "Mouse"
  },
  // Add more trending reviews...
]

export default function ReviewsPage() {
  return (
    <div className="min-h-screen">
      <ReviewsHero />
      
      <div className="container py-8">
        <div className="mb-8">
          <h2 className="mb-4 text-2xl font-bold">Trending Reviews</h2>
          <TrendingCarousel reviews={trendingReviews} />
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr,300px]">
          {/* Main Content */}
          <div className="space-y-6">
            {mockReviews.map((review) => (
              <ReviewCard
                key={review.id}
                review={review}
                onVoteHelpful={() => {}}
              />
            ))}
          </div>

          {/* Sidebar */}
          <CommunitySidebar />
        </div>
      </div>
    </div>
  )
}