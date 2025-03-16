"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { StarRating } from "@/components/reviews/star-rating"
import { formatDistanceToNow } from "date-fns"
import { useAuth } from "@/hooks/use-auth"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreVertical, ThumbsUp } from "lucide-react"

interface Review {
  id: string
  user_id: string
  title: string
  content: string
  rating: number
  helpful_count: number
  created_at: string
  user: {
    name: string
    image?: string
  }
}

interface ReviewListProps {
  reviews: Review[]
  onDelete?: (reviewId: string) => Promise<void>
  onEdit?: (review: Review) => void
  onHelpful?: (reviewId: string) => Promise<void>
}

export function ReviewList({ reviews, onDelete, onEdit, onHelpful }: ReviewListProps) {
  const { user } = useAuth()
  const [sortBy, setSortBy] = useState<"recent" | "helpful">("helpful")

  const sortedReviews = [...reviews].sort((a, b) => {
    if (sortBy === "recent") {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    }
    return b.helpful_count - a.helpful_count
  })

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              Sort by: {sortBy === "recent" ? "Most Recent" : "Most Helpful"}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setSortBy("recent")}>
              Most Recent
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSortBy("helpful")}>
              Most Helpful
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="space-y-4">
        {sortedReviews.map((review) => (
          <Card key={review.id} className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Avatar>
                  <AvatarImage src={review.user.image} />
                  <AvatarFallback>{review.user.name[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-semibold">{review.user.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}
                  </div>
                </div>
              </div>

              {user?.id === review.user_id && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEdit?.(review)}>
                      Edit Review
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => onDelete?.(review.id)}
                      className="text-destructive"
                    >
                      Delete Review
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>

            <div className="mt-4">
              <StarRating rating={review.rating} />
              <h4 className="mt-2 text-lg font-semibold">{review.title}</h4>
              <p className="mt-2 text-muted-foreground">{review.content}</p>
            </div>

            <div className="mt-4 flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onHelpful?.(review.id)}
                className="gap-2"
              >
                <ThumbsUp className="h-4 w-4" />
                Helpful ({review.helpful_count})
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}