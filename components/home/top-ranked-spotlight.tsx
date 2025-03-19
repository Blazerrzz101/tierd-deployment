"use client"

import Image from "next/image"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ProductLink } from "@/components/products/product-link"
import { ChevronRight, ArrowUpRight, Star } from "lucide-react"
import { createProductUrl } from "@/utils/product-utils"

interface TopRankedSpotlightProps {
  topProduct: any
  category: string
}

export function TopRankedSpotlight({ 
  topProduct, 
  category 
}: TopRankedSpotlightProps) {
  if (!topProduct) return null
  
  // Generate product URL using the utility function
  const productUrl = createProductUrl(topProduct)
  
  // Format category name
  const formattedCategory = category
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
  
  return (
    <div className="relative overflow-hidden group rounded-xl bg-gradient-to-br from-zinc-900 to-zinc-800 border border-zinc-800">
      <div className="absolute inset-0 bg-gradient-to-br from-zinc-900/50 to-zinc-900/90 z-10" />
      <div className="absolute inset-0 opacity-40 group-hover:opacity-30 transition-opacity duration-500">
        {topProduct.image && (
          <Image
            src={topProduct.image}
            alt={topProduct.name}
            fill
            className="object-cover"
          />
        )}
      </div>
      
      <div className="relative z-20 p-6 flex flex-col h-full">
        <div className="flex justify-between items-start">
          <Badge variant="secondary" className="font-medium">
            Top Rated {formattedCategory}
          </Badge>
          <div className="flex items-center bg-white/10 backdrop-blur-sm rounded-full px-2 py-1">
            <Star className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400 mr-1" />
            <span className="text-xs font-medium">{topProduct.rating?.toFixed(1) || "N/A"}</span>
          </div>
        </div>
        
        <h3 className="text-2xl sm:text-3xl font-bold mt-auto mb-2 text-white">
          {topProduct.name}
        </h3>
        
        <p className="text-zinc-300 mb-4 line-clamp-2">
          {topProduct.description || "No description available."}
        </p>
        
        <div className="flex flex-wrap gap-2">
          <Button 
            variant="default" 
            className="bg-primary hover:bg-primary/90"
            asChild
          >
            <Link href={productUrl}>
              <span>View Details</span>
              <ChevronRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          
          <Link href={`/category/${category}`} className="text-zinc-300 hover:text-white text-sm font-medium flex items-center transition-colors">
            See all {formattedCategory}
            <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  )
}