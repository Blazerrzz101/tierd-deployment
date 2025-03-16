"use client"

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { Product } from '@/types/product'
import { PLACEHOLDER_IMAGE } from "@/lib/constants"
import { Star } from 'lucide-react'
import { VoteButtons } from '@/components/products/vote-buttons'
import { useVote } from '@/hooks/use-vote'
import type { Database } from '@/types/supabase'
import { ProductImage } from "@/components/ui/product-image"

type ProductRanking = Database['public']['Views']['product_rankings']['Row']

interface ProductCardProps {
  product: ProductRanking
  variant?: 'default' | 'compact'
  className?: string
}

export function ProductCard({ product, variant = 'default', className }: ProductCardProps) {
  const { vote } = useVote()
  const isCompact = variant === 'compact'

  return (
    <div className={cn(
      "group relative overflow-hidden rounded-lg border border-white/10 bg-white/5 transition-colors hover:bg-white/10",
      className
    )}>
      {/* Product Image */}
      <div className={cn(
        "relative overflow-hidden",
        isCompact ? "aspect-[4/3]" : "aspect-square"
      )}>
        <ProductImage
          src={product.image_url}
          alt={product.name}
          category={product.category}
          fill
          sizes={isCompact 
            ? "(max-width: 768px) 50vw, 33vw"
            : "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          }
          className="transition-transform duration-300 group-hover:scale-105"
        />
      </div>

      {/* Product Info */}
      <div className={cn(
        "space-y-2",
        isCompact ? "p-3" : "p-4"
      )}>
        <Link 
          href={`/products/${product.url_slug}`}
          className={cn(
            "block font-medium hover:underline",
            isCompact ? "text-base" : "text-lg"
          )}
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

        {/* Vote Buttons */}
        <VoteButtons 
          product={{
            id: product.id,
            userVote: null, // We'll implement this later with auth
            upvotes: product.upvotes || 0,
            downvotes: product.downvotes || 0
          }}
          onVote={vote}
          className={cn(
            "mt-4",
            isCompact && "scale-90 origin-left"
          )}
        />
      </div>
    </div>
  )
}