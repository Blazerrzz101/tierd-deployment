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
  const topProduct = products
    .sort((a, b) => b.votes - a.votes)[0]

  return (
    <div className="relative overflow-hidden rounded-xl border bg-card p-8">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent" />
      
      <div className="relative grid gap-8 lg:grid-cols-2">
        <div className="flex flex-col justify-center space-y-4">
          <Badge className="w-fit bg-primary text-primary-foreground">
            <Crown className="mr-1 h-3 w-3" /> #1 Ranked
          </Badge>
          
          <h2 className="text-3xl font-bold">{topProduct.name}</h2>
          <p className="text-lg text-muted-foreground">
            {topProduct.description}
          </p>
          
          <div className="flex items-center gap-4">
            <ProductLink href={`/products/${topProduct.id}`}>
              <Button size="lg" className="group">
                Learn More
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </ProductLink>
            <div className="text-sm text-muted-foreground">
              {topProduct.votes.toLocaleString()} community votes
            </div>
          </div>
        </div>

        <ProductLink 
          href={`/products/${topProduct.id}`}
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