"use client"

import { motion } from "framer-motion"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Crown, ArrowRight } from "lucide-react"
import { products } from "@/lib/data"
import { ProductLink } from "@/components/products/product-link"

export function TopRankedSpotlight() {
  // Get the #1 ranked product
  const topProduct = products[0]
  
  // Guard against missing product
  if (!topProduct) {
    return null
  }

  const productUrl = `/products/${topProduct.url_slug}`

  return (
    <div className="relative">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-primary/10 blur-3xl" />
      
      <div className="relative grid gap-8 md:grid-cols-2">
        {/* Content */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Badge variant="outline" className="border-primary/20 text-primary">
              Top Ranked
            </Badge>
            <h2 className="text-3xl font-bold tracking-tight">
              {topProduct.name}
            </h2>
            <p className="text-lg text-muted-foreground">
              {topProduct.description}
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-2xl font-bold">
              ${topProduct.price.toFixed(2)}
            </div>
            <Badge variant="secondary">
              {topProduct.votes.toLocaleString()} votes
            </Badge>
          </div>

          <div className="flex gap-4">
            <ProductLink href={productUrl}>
              <Button size="lg">
                Learn More
              </Button>
            </ProductLink>
            <Button variant="outline" size="lg">
              Compare
            </Button>
          </div>
        </div>

        {/* Image */}
        <ProductLink 
          href={productUrl}
          className="block"
        >
          <motion.div
            className="relative aspect-square cursor-pointer"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", duration: 0.8 }}
          >
            <Image
              src={topProduct.imageUrl}
              alt={topProduct.name}
              fill
              className="object-cover transition-transform duration-300 hover:scale-105"
              priority
            />
          </motion.div>
        </ProductLink>
      </div>
    </div>
  )
}