import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ThumbsUp, ThumbsDown } from 'lucide-react'
import type { Database } from '@/types/supabase'
import { cn } from '@/lib/utils'

type ProductRanking = Database['public']['Views']['product_rankings']['Row']

interface ProductCardProps {
  product: ProductRanking
  onVote: (productId: string, voteType: 'upvote' | 'downvote') => Promise<void>
  userVote?: number | null
}

export function ProductCard({ product, onVote, userVote }: ProductCardProps) {
  const [isVoting, setIsVoting] = useState(false)

  const handleVote = async (voteType: 'upvote' | 'downvote') => {
    if (isVoting) return
    setIsVoting(true)
    try {
      await onVote(product.id, voteType)
    } finally {
      setIsVoting(false)
    }
  }

  return (
    <Card className="h-full">
      <CardHeader className="relative aspect-square overflow-hidden p-0">
        <Link href={`/products/${product.url_slug}`}>
          <Image
            src={product.image_url || '/placeholder.png'}
            alt={product.name}
            fill
            className="object-cover transition-transform hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </Link>
      </CardHeader>
      <CardContent className="p-4">
        <Link 
          href={`/products/${product.url_slug}`}
          className="text-lg font-semibold hover:underline"
        >
          {product.name}
        </Link>
        <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
          {product.description}
        </p>
        <div className="mt-2 flex items-center justify-between">
          <div className="text-sm">
            <span className="font-medium">Category:</span> {product.category}
          </div>
          {product.price && (
            <div className="text-lg font-bold">
              ${product.price.toFixed(2)}
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <div className="flex w-full items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleVote('upvote')}
              disabled={isVoting}
              className={cn(
                'gap-1',
                userVote === 1 && 'bg-green-100 hover:bg-green-200'
              )}
            >
              <ThumbsUp className="h-4 w-4" />
              <span>{product.upvotes}</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleVote('downvote')}
              disabled={isVoting}
              className={cn(
                'gap-1',
                userVote === -1 && 'bg-red-100 hover:bg-red-200'
              )}
            >
              <ThumbsDown className="h-4 w-4" />
              <span>{product.downvotes}</span>
            </Button>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Rank: #{product.rank}</span>
            {product.rating > 0 && (
              <>
                <span>•</span>
                <span>Rating: {product.rating.toFixed(1)}/5</span>
                <span>({product.review_count})</span>
              </>
            )}
          </div>
        </div>
      </CardFooter>
    </Card>
  )
} 