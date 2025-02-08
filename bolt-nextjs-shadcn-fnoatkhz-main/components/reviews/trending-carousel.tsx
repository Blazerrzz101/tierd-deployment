"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Star } from "lucide-react"
import { cn } from "@/lib/utils"

interface TrendingReview {
  id: string
  title: string
  excerpt: string
  rating: number
  author: string
  productName: string
  category: string
}

export function TrendingCarousel({ reviews }: { reviews: TrendingReview[] }) {
  const [currentIndex, setCurrentIndex] = useState(0)

  const next = () => setCurrentIndex((i) => (i + 1) % reviews.length)
  const prev = () => setCurrentIndex((i) => (i - 1 + reviews.length) % reviews.length)

  return (
    <div className="relative">
      <div className="overflow-hidden rounded-lg">
        <div 
          className="flex transition-transform duration-300"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {reviews.map((review) => (
            <Card key={review.id} className="min-w-full p-6">
              <div className="flex items-start justify-between">
                <div>
                  <span className={cn(
                    "mb-2 inline-block rounded-full px-3 py-1 text-xs font-medium",
                    review.category === "Mouse" && "bg-green-500/10 text-green-500",
                    review.category === "Keyboard" && "bg-blue-500/10 text-blue-500",
                    review.category === "Headset" && "bg-purple-500/10 text-purple-500"
                  )}>
                    {review.category}
                  </span>
                  <h3 className="text-xl font-bold">{review.title}</h3>
                  <p className="mt-2 text-muted-foreground">{review.excerpt}</p>
                </div>
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={cn(
                        "h-4 w-4",
                        i < review.rating ? "fill-primary text-primary" : "text-muted"
                      )}
                    />
                  ))}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      <div className="absolute inset-y-0 left-0 flex items-center">
        <Button
          variant="ghost"
          size="icon"
          onClick={prev}
          className="rounded-full bg-background/80 backdrop-blur-sm"
        >
          <ChevronLeft className="h-6 w-6" />
        </Button>
      </div>

      <div className="absolute inset-y-0 right-0 flex items-center">
        <Button
          variant="ghost"
          size="icon"
          onClick={next}
          className="rounded-full bg-background/80 backdrop-blur-sm"
        >
          <ChevronRight className="h-6 w-6" />
        </Button>
      </div>
    </div>
  )
}