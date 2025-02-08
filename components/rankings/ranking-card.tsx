"use client"

import Link from "next/link"
import { Product } from "@/types/product"
import { Button } from "@/components/ui/button"
import { ThumbsUp, ThumbsDown, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"
import Image from "next/image"
import { motion } from "framer-motion"
import { VoteButtons } from "@/components/products/vote-buttons"
import { useVote } from "@/hooks/use-vote"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

// Base64 encoded SVG placeholder
const PLACEHOLDER_IMAGE = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDQwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjQwMCIgaGVpZ2h0PSI0MDAiIGZpbGw9IiMyMDIwMjAiLz48cGF0aCBkPSJNMTgyIDIwMkMyMDAgMTY2IDIxNSAxNDUgMjM1IDE0NUMyNTUgMTQ1IDI2NSAxNjYgMjcwIDIwMkMzMDAgMTY2IDMxNSAxNDUgMzM1IDE0NUMzNTUgMTQ1IDM2NSAxNjYgMzcwIDIwMiIgc3Ryb2tlPSIjNDA0MDQwIiBzdHJva2Utd2lkdGg9IjIwIiBzdHJva2UtbGluZWNhcD0icm91bmQiLz48L3N2Zz4="

interface RankingCardProps {
  rank: number
  product: Product
}

export function RankingCard({ rank, product }: RankingCardProps) {
  const { product: currentProduct, vote } = useVote(product)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: rank * 0.1 }}
      className={cn(
        "group relative flex items-center gap-6 rounded-lg border p-4",
        "bg-gradient-to-br from-black/40 to-black/60",
        "hover:from-black/50 hover:to-black/70"
      )}
    >
      {/* Rank */}
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-lg font-bold text-white/70">
        #{rank}
      </div>

      {/* Image */}
      <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg border border-white/10">
        <Image
          src={currentProduct.imageUrl || PLACEHOLDER_IMAGE}
          alt={currentProduct.name}
          fill
          className="object-cover"
        />
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-2">
        <h3 className="text-2xl font-bold tracking-tight text-white/90 transition-colors group-hover:text-white">
          {currentProduct.name}
        </h3>
        <p className="text-sm font-medium text-white/50">
          {currentProduct.category}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-8">
        <VoteButtons product={currentProduct} />
        <Link href={`/products/${currentProduct.url_slug}`}>
          <Button 
            variant="ghost" 
            size="sm" 
            className="group/btn flex items-center gap-2 text-white/70 transition-colors hover:bg-white/5 hover:text-white"
          >
            Learn More
            <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-0.5" />
          </Button>
        </Link>
      </div>
    </motion.div>
  )
}