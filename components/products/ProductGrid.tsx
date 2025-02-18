import { ProductCard } from './ProductCard'
import type { Database } from '@/types/supabase'

type ProductRanking = Database['public']['Views']['product_rankings']['Row']

interface ProductGridProps {
  products: ProductRanking[]
  onVote: (productId: string, voteType: 'upvote' | 'downvote') => Promise<void>
  userVotes?: Record<string, 'upvote' | 'downvote'>
  isLoading?: boolean
}

export function ProductGrid({ products, onVote, userVotes = {}, isLoading }: ProductGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-[400px] animate-pulse rounded-lg bg-muted"
          />
        ))}
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <div className="flex h-[400px] items-center justify-center rounded-lg border border-dashed">
        <p className="text-center text-muted-foreground">
          No products found
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          onVote={onVote}
          userVote={userVotes[product.id]}
        />
      ))}
    </div>
  )
} 