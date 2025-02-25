"use client"

import Link from "next/link"
import { Card } from "@/components/ui/card"
import { VoteButtons } from "@/components/products/vote-buttons"
import { ProductImage } from "@/components/ui/product-image-fixed"
import { Product } from "@/types/product"

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
    sm: "h-32 w-32",
    md: "h-40 w-40",
    lg: "h-48 w-48",
  }

  const titleStyles = {
    sm: "text-base",
    md: "text-lg",
    lg: "text-xl",
  }

  // Ensure price is formatted correctly
  const formattedPrice = typeof product.price === 'number'
    ? `$${product.price.toFixed(2)}`
    : 'Price unavailable'

  return (
    <Card className={`relative group overflow-hidden transition-all duration-200 hover:shadow-md ${cardStyles[size]}`}>
      <Link href={`/products/${product.url_slug}`} className="block h-full">
        <div className="flex h-full flex-col space-y-2">
          <div className="relative mx-auto flex items-center justify-center">
            <ProductImage
              src={product.image_url || '/images/products/placeholder.png'}
              alt={product.name}
              category={product.category}
              width={size === 'sm' ? 128 : size === 'md' ? 160 : 192}
              height={size === 'sm' ? 128 : size === 'md' ? 160 : 192}
              className={`object-contain transition-transform duration-300 group-hover:scale-105 ${imageStyles[size]}`}
            />
          </div>
          
          <div className="flex flex-col space-y-1 mt-auto">
            <h3 className={`font-semibold line-clamp-2 ${titleStyles[size]}`}>{product.name}</h3>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{formattedPrice}</span>
              
              <div className="flex items-center gap-2">
                <VoteButtons 
                  productId={product.id} 
                  size="sm" 
                  variant="ghost"
                />
              </div>
            </div>
          </div>
        </div>
      </Link>
    </Card>
  )
} 