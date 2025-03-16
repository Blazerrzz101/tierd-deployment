"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ThumbsUp, MessageSquare, Star } from "lucide-react"
import { cn } from "@/lib/utils"
import { Review } from "@/types"

interface ReviewCardProps {
  review: Review
  onVoteHelpful: () => void
}

export function ReviewCard({ review, onVoteHelpful }: ReviewCardProps) {
  return (
    <Card className="card-gradient">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src={review.user.image} />
              <AvatarFallback>{review.user.name[0]}</AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold">{review.user.name}</span>
                {review.user.badge && (
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                    {review.user.badge}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>{new Date(review.createdAt).toLocaleDateString()}</span>
                <span>•</span>
                <span>{review.productCategory}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
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

        {/* Content */}
        <div className="mt-4">
          <h3 className="text-lg font-semibold">{review.title}</h3>
          <p className="mt-2 text-muted-foreground">{review.content}</p>
        </div>

        {/* Pros & Cons */}
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg bg-secondary/50 p-4">
            <h4 className="mb-2 font-medium text-green-500">Pros</h4>
            <ul className="space-y-1 text-sm">
              {review.pros?.map((pro, i) => (
                <li key={i} className="flex items-center gap-2">
                  <span className="text-green-500">+</span>
                  {pro}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-lg bg-secondary/50 p-4">
            <h4 className="mb-2 font-medium text-red-500">Cons</h4>
            <ul className="space-y-1 text-sm">
              {review.cons?.map((con, i) => (
                <li key={i} className="flex items-center gap-2">
                  <span className="text-red-500">-</span>
                  {con}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex items-center gap-4">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onVoteHelpful}
            className="button-outline-gradient"
          >
            <ThumbsUp className="mr-2 h-4 w-4" />
            Helpful ({review.helpfulCount})
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            className="button-outline-gradient"
          >
            <MessageSquare className="mr-2 h-4 w-4" />
            Reply
          </Button>
        </div>
      </div>
    </Card>
  )
}