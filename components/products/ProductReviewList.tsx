import { formatDistanceToNow } from 'date-fns'
import type { Database } from '@/types/supabase'
import { Rating } from '@/components/ui/rating'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

type Review = Database['public']['Tables']['reviews']['Row']

interface ProductReviewListProps {
  reviews: Review[]
  isLoading?: boolean
}

export function ProductReviewList({ reviews, isLoading }: ProductReviewListProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="h-20 bg-muted" />
            <CardContent className="space-y-2">
              <div className="h-4 w-1/4 bg-muted" />
              <div className="h-16 bg-muted" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (reviews.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center rounded-lg border border-dashed">
        <p className="text-center text-muted-foreground">
          No reviews yet. Be the first to review this product!
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <Card key={review.id}>
          <CardHeader className="space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">{review.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}
                </p>
              </div>
              <Rating value={review.rating} onValueChange={() => {}} readOnly />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm">{review.content}</p>
            
            {(review.pros?.length > 0 || review.cons?.length > 0) && (
              <div className="space-y-2">
                {review.pros?.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Pros</p>
                    <div className="flex flex-wrap gap-2">
                      {review.pros.map((pro, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="bg-green-100 text-green-800"
                        >
                          {pro}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                {review.cons?.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Cons</p>
                    <div className="flex flex-wrap gap-2">
                      {review.cons.map((con, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="bg-red-100 text-red-800"
                        >
                          {con}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
} 