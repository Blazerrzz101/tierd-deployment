"use client"

import Link from "next/link"
import { Product } from "@/types/product"
import { Button } from "@/components/ui/button"
import { ArrowRight, Star } from "lucide-react"
import { cn } from "@/lib/utils"
import Image from "next/image"
import { motion } from "framer-motion"
import { VoteButtons } from "@/components/products/vote-buttons"
import { useVote } from "@/hooks/use-vote"
import { createProductUrl } from "@/utils/product-utils"
import { useState, useEffect, useRef } from "react"
import { toast } from "sonner"

interface RankingCardProps {
  rank: number
  product: Product
}

// Cooldown period between votes (ms)
const VOTE_COOLDOWN = 1000;

// Funny messages for when users click too rapidly
const SPAM_CLICK_MESSAGES = [
  "Whoa there, eager voter! Your clicks are faster than our servers! ⚡",
  "Easy on the clicks, champ! Even pro gamers need a cooldown. 🎮",
  "Our vote counter needs a breather! Try again in a second. ⏱️",
  "Vote throttled! You're too enthusiastic for our servers! 🚀",
  "Save your APM for StarCraft! Voting has a cooldown. 🌟",
  "Click... wait... click... That's the rhythm we're looking for! 🎵",
];

export function RankingCard({ rank, product }: RankingCardProps) {
  const { vote } = useVote()
  
  // Get the image URL, falling back to placeholder
  const imageUrl = product.image_url || "/images/products/placeholder.svg"
  
  // Generate a proper product URL using the utility function
  const productUrl = createProductUrl(product)
  
  // Add state for vote rate limiting
  const [lastVoteTime, setLastVoteTime] = useState(0)
  const [spamClickCount, setSpamClickCount] = useState(0)
  const spamTimerRef = useRef<NodeJS.Timeout | null>(null)
  
  // Clear spam timer on unmount
  useEffect(() => {
    return () => {
      if (spamTimerRef.current) {
        clearTimeout(spamTimerRef.current)
      }
    }
  }, [])
  
  // Handle voting with rate limiting
  const handleVote = (voteType: number) => {
    const now = Date.now()
    const timeSinceLastVote = now - lastVoteTime
    
    // If trying to vote too quickly
    if (timeSinceLastVote < VOTE_COOLDOWN) {
      // Increment spam counter
      const newSpamCount = spamClickCount + 1
      setSpamClickCount(newSpamCount)
      
      // Show toast for repeated rapid clicks
      if (newSpamCount >= 3) {
        // Get a random message from our list
        const randomMessage = SPAM_CLICK_MESSAGES[Math.floor(Math.random() * SPAM_CLICK_MESSAGES.length)]
        toast(randomMessage)
        
        // Reset spam counter after a delay
        if (spamTimerRef.current) {
          clearTimeout(spamTimerRef.current)
        }
        
        spamTimerRef.current = setTimeout(() => {
          setSpamClickCount(0)
        }, 3000)
      }
      
      return
    }
    
    // Update last vote time
    setLastVoteTime(now)
    
    // Make the vote API call
    vote({
      id: product.id,
      name: product.name
    }, voteType)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <div className="group relative border-b border-white/5 last:border-0">
        <div className="relative flex items-center gap-8 px-8 py-6 transition-colors duration-200 hover:bg-white/5">
          {/* Rank */}
          <div className={cn(
            "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br",
            rank === 1 && "from-amber-500/20 to-amber-500/5 text-amber-500",
            rank === 2 && "from-slate-400/20 to-slate-400/5 text-slate-400",
            rank === 3 && "from-orange-900/20 to-orange-900/5 text-orange-900",
            rank > 3 && "from-white/10 to-white/5 text-white/30"
          )}>
            <span className="text-2xl font-bold transition-colors group-hover:text-white/50">
              {String(rank).padStart(2, '0')}
            </span>
          </div>

          {/* Image with Error Handling */}
          <div className="relative aspect-square w-20 overflow-hidden rounded-lg bg-black/20">
            <Image
              src={imageUrl}
              alt={product.name || 'Product image'}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              onError={(e) => {
                const img = e.target as HTMLImageElement
                img.src = "/images/products/placeholder.svg"
              }}
            />
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          </div>

          {/* Content */}
          <div className="flex flex-1 flex-col gap-2">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-medium text-white/90 transition-colors group-hover:text-white">
                {product.name}
              </h3>
              <div className="flex items-center gap-1.5 rounded-full bg-white/5 px-2 py-0.5">
                <Star className="h-3.5 w-3.5 fill-[#ff4b26] text-[#ff4b26]" />
                <span className="text-sm font-medium text-white/70">
                  {(product.votes ?? 0) > 0 ? `+${product.votes}` : product.votes ?? 0}
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-4 text-sm text-white/50">
              <span className="capitalize">{product.category.replace('-', ' ')}</span>
              <span className="h-1 w-1 rounded-full bg-white/20" />
              <span>${product.price?.toFixed(2) ?? '0.00'}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-6">
            <VoteButtons 
              product={product}
              onVote={vote}
            />
            <Link href={productUrl}>
              <Button 
                variant="ghost" 
                size="sm"
                className="h-9 gap-2 rounded-lg border border-white/10 px-4 text-sm font-medium text-white/70 
                         transition-all hover:border-white/20 hover:bg-white/5 hover:text-white
                         group-hover:border-white/20"
              >
                Details
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  )
}