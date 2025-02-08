"use client"

import { Button } from "@/components/ui/button"
import { ThumbsUp, ThumbsDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import { VoteStatus } from "./vote-status"
import { VoteLimiterTooltip } from "./vote-limiter-tooltip"
import { useVoteLimiter } from "@/hooks/use-vote-limiter"

interface VoteButtonsProps {
  votes: number
  userVote: 'up' | 'down' | null
  onVote: (type: 'up' | 'down') => void
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  showStatus?: boolean
}

export function VoteButtons({ 
  votes, 
  userVote, 
  onVote, 
  size = 'md', 
  showLabel = true,
  showStatus = true 
}: VoteButtonsProps) {
  const { canVote, remainingCooldown } = useVoteLimiter()

  const sizes = {
    sm: "h-10 w-10",
    md: "h-14 w-14",
    lg: "h-16 w-16"
  }

  const iconSizes = {
    sm: "h-5 w-5",
    md: "h-7 w-7",
    lg: "h-8 w-8"
  }

  const handleVote = (type: 'up' | 'down') => {
    if (canVote) {
      onVote(type)
    }
  }

  return (
    <div className="space-y-6">
      {showStatus && <VoteStatus votes={votes} />}
      
      <div className="flex flex-col items-center gap-4">
        {showLabel && (
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm font-medium text-primary"
          >
            Your vote determines the ranking
          </motion.p>
        )}
        
        <VoteLimiterTooltip remainingCooldown={remainingCooldown} canVote={canVote}>
          <div className="flex items-center gap-6">
            <motion.div 
              whileHover={{ scale: 1.2 }} 
              whileTap={{ scale: 0.9 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleVote('down')}
                disabled={!canVote}
                className={cn(
                  sizes[size],
                  "rounded-full border-2 transition-all duration-300",
                  "hover:border-red-500 hover:bg-red-500/20 hover:text-red-500 hover:scale-110",
                  "active:scale-95",
                  userVote === 'down' && [
                    "border-red-500 bg-red-500/20 text-red-500",
                    "shadow-[0_0_20px_rgba(239,68,68,0.5)]",
                    "animate-pulse"
                  ]
                )}
              >
                <ThumbsDown className={iconSizes[size]} />
              </Button>
            </motion.div>

            <AnimatePresence mode="wait">
              <motion.div
                key={votes}
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }}
                className={cn(
                  "min-w-[3ch] text-center font-bold",
                  size === 'lg' ? "text-3xl" : "text-2xl"
                )}
              >
                {votes}
              </motion.div>
            </AnimatePresence>

            <motion.div 
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.9 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleVote('up')}
                disabled={!canVote}
                className={cn(
                  sizes[size],
                  "rounded-full border-2 transition-all duration-300",
                  "hover:border-green-500 hover:bg-green-500/20 hover:text-green-500 hover:scale-110",
                  "active:scale-95",
                  userVote === 'up' && [
                    "border-green-500 bg-green-500/20 text-green-500",
                    "shadow-[0_0_20px_rgba(34,197,94,0.5)]",
                    "animate-pulse"
                  ]
                )}
              >
                <ThumbsUp className={iconSizes[size]} />
              </Button>
            </motion.div>
          </div>
        </VoteLimiterTooltip>
      </div>
    </div>
  )
}