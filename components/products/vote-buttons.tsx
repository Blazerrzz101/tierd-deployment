"use client"

import { Button } from "@/components/ui/button"
import { ChevronUp, ChevronDown } from "lucide-react"
import { useVote } from "@/hooks/use-vote"
import { Product } from "@/types/product"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"

interface VoteButtonsProps {
  product: Product
  className?: string
}

export function VoteButtons({ product, className }: VoteButtonsProps) {
  const { product: votedProduct, vote, isLoading } = useVote(product)

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          "h-8 w-8 rounded-md p-0",
          votedProduct.userVote === 'up' 
            ? "text-[#ff4b26] bg-[#ff4b26]/5" 
            : "text-white/50 hover:text-white hover:bg-white/5"
        )}
        disabled={isLoading}
        onClick={() => vote(votedProduct.userVote === 'up' ? null : 'up')}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={votedProduct.userVote === 'up' ? 'voted' : 'not-voted'}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <ChevronUp className="h-4 w-4" />
          </motion.div>
        </AnimatePresence>
      </Button>

      <AnimatePresence mode="wait">
        <motion.span
          key={votedProduct.votes}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="min-w-[2rem] text-center text-sm font-medium text-white/50"
        >
          {votedProduct.votes ?? 0}
        </motion.span>
      </AnimatePresence>

      <Button
        variant="ghost"
        size="sm"
        className={cn(
          "h-8 w-8 rounded-md p-0",
          votedProduct.userVote === 'down' 
            ? "text-red-500 bg-red-500/5" 
            : "text-white/50 hover:text-white hover:bg-white/5"
        )}
        disabled={isLoading}
        onClick={() => vote(votedProduct.userVote === 'down' ? null : 'down')}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={votedProduct.userVote === 'down' ? 'voted' : 'not-voted'}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <ChevronDown className="h-4 w-4" />
          </motion.div>
        </AnimatePresence>
      </Button>
    </div>
  )
}