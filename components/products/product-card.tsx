"use client"

import Link from "next/link"
import { Card } from "@/components/ui/card"
import { VoteButtons } from "@/components/products/vote-buttons"
import { ProductImage } from "@/components/ui/product-image-fixed"
import { Product } from "@/types/product"
import { Star, ExternalLink, ArrowUpRight, Zap } from "lucide-react"

interface ProductCardProps {
  product: Product
  size?: "sm" | "md" | "lg"
}

export function ProductCard({ product, size = "md" }: ProductCardProps) {
  // Size-based styling
  const cardStyles = {
    sm: "max-w-[280px] p-3",
    md: "max-w-[350px] p-4",
    lg: "max-w-[400px] p-5",
  }

  const imageStyles = {
    sm: "h-36 w-36",
    md: "h-44 w-44",
    lg: "h-52 w-52",
  }

  const titleStyles = {
    sm: "text-base",
    md: "text-lg",
    lg: "text-xl",
  }

  // Calculate score
  const score = (product.upvotes || 0) - (product.downvotes || 0);

  // Ensure price is formatted correctly
  const formattedPrice = typeof product.price === 'number'
    ? `$${product.price.toFixed(2)}`
    : 'Price unavailable'

  return (
    <Card className={`modern-card relative group overflow-hidden transition-all duration-300 hover:shadow-lg hover:border-primary/30 hover:translate-y-[-3px] ${cardStyles[size]}`}>
      {/* Score badge */}
      {score > 0 && (
        <div className="absolute top-2 right-2 z-10 bg-accent/80 text-white text-xs px-2 py-1 rounded-full flex items-center shadow-md">
          <Zap className="h-3 w-3 mr-1" />
          {score}
        </div>
      )}
      
      <Link href={`/products/${product.url_slug}`} className="block h-full">
        <div className="flex h-full flex-col space-y-4">
          <div className="relative mx-auto flex items-center justify-center">
            {/* Spotlight effect */}
            <div className="absolute -inset-1 bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/5 rounded-full blur-lg opacity-0 group-hover:opacity-70 transition-opacity duration-500"></div>
            
            {/* Image container */}
            <div className="relative overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-white/5 to-transparent p-2">
              <ProductImage
                src={product.image_url || '/images/products/placeholder.png'}
                alt={product.name}
                category={product.category}
                width={size === 'sm' ? 144 : size === 'md' ? 176 : 208}
                height={size === 'sm' ? 144 : size === 'md' ? 176 : 208}
                className={`object-contain transition-transform duration-300 group-hover:scale-105 ${imageStyles[size]}`}
              />
              
              {/* Hover overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-end justify-center p-2">
                <span className="text-xs text-white px-2 py-1 rounded-full bg-black/40 backdrop-blur-sm flex items-center">
                  View Details
                  <ArrowUpRight className="h-3 w-3 ml-1" />
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col space-y-3 mt-auto">
            <div className="space-y-1">
              <h3 className={`font-semibold line-clamp-2 group-hover:text-primary transition-colors ${titleStyles[size]}`}>
                {product.name}
              </h3>
              
              <div className="text-xs text-muted-foreground line-clamp-2 min-h-[2.5rem]">
                {product.description}
              </div>
            </div>
            
            <div className="flex items-center gap-2 text-xs">
              <span className="capitalize bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                {product.category.replace('-', ' ')}
              </span>
              
              {product.rating > 0 && (
                <div className="flex items-center gap-1 bg-white/5 px-2 py-0.5 rounded-full">
                  <Star className="h-3 w-3 fill-secondary text-secondary" />
                  <span className="font-medium">{product.rating.toFixed(1)}</span>
                </div>
              )}
            </div>
            
            <div className="flex items-center justify-between mt-1 pt-3 border-t border-white/5">
              <span className="text-sm font-semibold text-secondary">{formattedPrice}</span>
              
              <div className="flex items-center gap-2">
                <div className="bg-card-background backdrop-blur-sm rounded-lg p-1 border border-white/5 shadow-inner">
                  <VoteButtons 
                    product={{ id: product.id, name: product.name }}
                    initialUpvotes={product.upvotes || 0}
                    initialDownvotes={product.downvotes || 0}
                    initialVoteType={typeof product.userVote === 'number' ? product.userVote : null}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </Card>
  )
} 