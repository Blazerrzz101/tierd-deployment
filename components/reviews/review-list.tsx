"use client"

import { Review } from "@/types"
import { ReviewCard } from "./review-card"
import { Button } from "@/components/ui/button"
import { ArrowUpDown } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface ReviewListProps {
  reviews: Review[]
  sortBy: "recent" | "helpful"
  onSort: (sort: "recent" | "helpful") => void
}

export function ReviewList({ reviews, sortBy, onSort }: ReviewListProps) {
  const sortedReviews = [...reviews].sort((a, b) => {
    if (sortBy === "recent") {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    }
    return b.helpfulCount - a.helpfulCount
  })

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <ArrowUpDown className="mr-2 h-4 w-4" />
              Sort by: {sortBy === "recent" ? "Most Recent" : "Most Helpful"}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onSort("recent")}>
              Most Recent
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onSort("helpful")}>
              Most Helpful
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="grid gap-6">
        {sortedReviews.map((review) => (
          <ReviewCard key={review.id} review={review} />
        ))}
      </div>
    </div>
  )
}