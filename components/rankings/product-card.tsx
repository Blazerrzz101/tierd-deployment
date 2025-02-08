"use client"

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { Product } from '@/types'

interface ProductCardProps {
  product: Product
  variant?: 'default' | 'compact'
}

export function ProductCard({ product, variant = 'default' }: ProductCardProps) {
  const isCompact = variant === 'compact'

  // Ensure we have fallback values for all required fields
  const {
    name = 'Product Name',
    description = 'No description available',
    imageUrl = '/placeholder.png',
    image_url = '/placeholder.png', // Fallback for both image field names
    price = 0,
    votes = 0,
    rank = 0,
    category = '',
    url_slug = ''
  } = product || {}

  return (
    <Link 
      href={`/products/${url_slug}`}
      className="block cursor-pointer"
    >
      <Card className={cn(
        "group relative overflow-hidden transition-all duration-300",
        "hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5",
        "bg-card/95 backdrop-blur-sm"
      )}>
        <div className={cn(
          "relative flex gap-4 p-6",
          isCompact && "p-4"
        )}>
          {/* Product Image */}
          <div className={cn(
            "relative shrink-0 overflow-hidden rounded-lg",
            isCompact ? "h-16 w-16" : "h-24 w-24"
          )}>
            <Image
              src={imageUrl || image_url}
              alt={name}
              fill
              className="object-cover"
            />
          </div>

          {/* Product Info */}
          <div className="min-w-0 flex-1">
            <h3 className={cn(
              "truncate font-semibold transition-colors group-hover:text-primary",
              isCompact ? "text-base" : "text-lg"
            )}>
              {name}
            </h3>
            <p className={cn(
              "line-clamp-2 text-sm text-muted-foreground",
              isCompact && "line-clamp-1 text-xs"
            )}>
              {description}
            </p>
            <div className="mt-2 flex items-center gap-4 text-sm">
              <span className="font-medium">
                ${typeof price === 'number' ? price.toFixed(2) : '0.00'}
              </span>
              <span className="text-muted-foreground">
                {votes.toLocaleString()} votes
              </span>
              {rank > 0 && (
                <span className="text-primary">
                  Rank #{rank}
                </span>
              )}
            </div>
          </div>
        </div>
      </Card>
    </Link>
  )
}