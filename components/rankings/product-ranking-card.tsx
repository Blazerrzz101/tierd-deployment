'use client'

import { cn } from '@/lib/utils'
import Image from 'next/image'
import Link from 'next/link'
import { Star } from 'lucide-react'
import { VoteButtons } from '@/components/products/vote-buttons'
import { useVote } from '@/hooks/use-vote'
import type { Database } from '@/types/supabase'

type ProductRanking = Database['public']['Views']['product_rankings']['Row']

interface ProductRankingCardProps {
  product: ProductRanking
  rank: number
}

export function ProductRankingCard({ product, rank }: ProductRankingCardProps) {
  const { vote } = useVote()

  return (
    <div className="group relative flex items-center gap-4 rounded-lg border border-white/10 bg-white/5 p-4 transition-colors hover:bg-white/10">
      {/* Rank */}
      <div className={cn(
        "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg font-bold",
        rank === 1 && "bg-yellow-500/20 text-yellow-500",
        rank === 2 && "bg-gray-500/20 text-gray-400",
        rank === 3 && "bg-orange-900/20 text-orange-700",
        rank > 3 && "bg-white/10 text-white/50"
      )}>
        #{rank}
      </div>

      {/* Product Image */}
      <div className="relative aspect-square w-16 overflow-hidden rounded-lg bg-zinc-100">
        <Image
          src={product.image_url || "/images/products/placeholder.svg"}
          alt={product.name}
          fill
          sizes="(max-width: 768px) 64px, 64px"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          onError={(e) => {
            const img = e.target as HTMLImageElement
            img.src = "/images/products/placeholder.svg"
          }}
        />
      </div>

      {/* Product Info */}
      <div className="flex flex-1 flex-col gap-1">
        <Link 
          href={`/products/${product.url_slug}`}
          className="text-lg font-medium hover:underline"
        >
          {product.name}
        </Link>
        <div className="flex items-center gap-2 text-sm text-white/60">
          <span className="capitalize">{product.category.replace('-', ' ')}</span>
          <span>•</span>
          <span>${product.price?.toFixed(2)}</span>
          {(product.rating ?? 0) > 0 && (
            <>
              <span>•</span>
              <div className="flex items-center gap-1">
                <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                <span>{(product.rating ?? 0).toFixed(1)}</span>
                <span>({product.review_count ?? 0})</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Vote Buttons */}
      <VoteButtons 
        product={{
          id: product.id,
          userVote: null, // We'll implement this later with auth
          upvotes: product.upvotes || 0,
          downvotes: product.downvotes || 0
        }}
        onVote={vote}
        className="shrink-0"
      />
    </div>
  )
} 