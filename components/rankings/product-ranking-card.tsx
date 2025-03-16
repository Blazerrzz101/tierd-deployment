'use client'

import { cn, normalizeProduct } from '@/lib/utils'
import Image from 'next/image'
import Link from 'next/link'
import { Star, ExternalLink, Award, Zap } from 'lucide-react'
import { VoteButtons } from '@/components/products/vote-buttons'
import { useVote } from '@/hooks/use-vote'
import type { Database } from '@/types/supabase'
import { ProductImage } from "@/components/ui/product-image"
import { Product } from '@/types/product'

type ProductRanking = Database['public']['Views']['product_rankings']['Row'] | Product

interface ProductRankingCardProps {
  product: ProductRanking
  rank: number
}

export function ProductRankingCard({ product: rawProduct, rank }: ProductRankingCardProps) {
  const { vote } = useVote()
  
  // Normalize the product to ensure it has all required fields
  const product = normalizeProduct(rawProduct)

  // Get the appropriate styling based on rank
  const getRankStyles = () => {
    switch(rank) {
      case 1:
        return {
          container: "border-l-[6px] border-l-secondary shadow-lg shadow-secondary/5",
          badge: "bg-secondary text-black font-bold border-2 border-secondary/20 shadow-xl",
          icon: <Award className="h-4 w-4 text-secondary absolute -top-1 -right-1" />
        };
      case 2:
        return {
          container: "border-l-[6px] border-l-primary shadow-lg shadow-primary/5",
          badge: "bg-primary text-white font-bold border-2 border-primary/20 shadow-xl",
          icon: <Award className="h-4 w-4 text-primary absolute -top-1 -right-1" />
        };
      case 3:
        return {
          container: "border-l-[6px] border-l-accent shadow-lg shadow-accent/5",
          badge: "bg-accent text-white font-bold border-2 border-accent/20 shadow-xl",
          icon: <Award className="h-4 w-4 text-accent absolute -top-1 -right-1" />
        };
      default:
        return {
          container: "border-l-[3px] border-l-muted",
          badge: "bg-card-background text-muted-foreground border border-white/10",
          icon: null
        };
    }
  };

  const rankStyles = getRankStyles();

  return (
    <div className={cn(
      "modern-card group relative flex items-center gap-4 p-5 transition-all duration-300 hover:translate-y-[-2px]",
      rankStyles.container
    )}>
      {/* Rank */}
      <div className="relative">
        <div className={cn(
          "flex h-14 w-14 shrink-0 items-center justify-center rounded-lg font-bold text-lg",
          rankStyles.badge
        )}>
          #{rank}
        </div>
        {rankStyles.icon}
      </div>

      {/* Product Image */}
      <div className="relative aspect-square w-24 overflow-hidden rounded-lg border border-white/5">
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg z-10"></div>
        <ProductImage
          src={product.imageUrl}
          alt={product.name}
          category={product.category}
          fill
          sizes="96px"
          className="transition-transform duration-300 group-hover:scale-105 z-0 p-1"
          showPlaceholderIcon={false}
        />
        
        {/* Hover overlay effect */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-1">
          <span className="text-xs text-white px-2 py-1 rounded-full bg-black/40 backdrop-blur-sm">
            View Details
          </span>
        </div>
      </div>

      {/* Product Info */}
      <div className="flex flex-1 flex-col gap-2">
        <Link 
          href={`/products/${product.url_slug}`}
          className="text-lg font-medium hover:text-primary transition-colors flex items-center gap-1"
        >
          {product.name}
          <ExternalLink className="h-3.5 w-3.5 opacity-0 group-hover:opacity-70 transition-opacity duration-200" />
        </Link>
        <p className="text-sm text-muted-foreground line-clamp-1">
          {product.description}
        </p>
        <div className="flex items-center gap-2 text-sm">
          <span className="capitalize bg-primary/10 text-primary px-2 py-0.5 rounded-full text-xs">{product.category.replace('-', ' ')}</span>
          <span className="text-muted-foreground">•</span>
          <span className="font-medium bg-secondary/10 text-secondary px-2 py-0.5 rounded-full text-xs">${product.price.toFixed(2)}</span>
          {product.rating > 0 && (
            <>
              <span className="text-muted-foreground">•</span>
              <div className="flex items-center gap-1 bg-white/5 px-2 py-0.5 rounded-full">
                <Star className="h-3 w-3 fill-secondary text-secondary" />
                <span className="text-xs font-medium">{product.rating.toFixed(1)}</span>
                <span className="text-xs text-muted-foreground">({product.review_count})</span>
              </div>
            </>
          )}
          {(product.upvotes > 0 || product.downvotes > 0) && (
            <>
              <span className="text-muted-foreground">•</span>
              <div className="flex items-center gap-1 bg-white/5 px-2 py-0.5 rounded-full">
                <Zap className="h-3 w-3 text-accent" />
                <span className="text-xs font-medium">Score: {(product.upvotes || 0) - (product.downvotes || 0)}</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Vote Buttons */}
      <div className="bg-card-background backdrop-blur-sm rounded-lg p-1.5 border border-white/5 shadow-inner">
        <VoteButtons 
          product={{
            id: product.id,
            name: product.name
          }}
          initialUpvotes={product.upvotes || 0}
          initialDownvotes={product.downvotes || 0}
          initialVoteType={typeof product.userVote === 'number' ? product.userVote : null}
        />
      </div>
    </div>
  )
} 