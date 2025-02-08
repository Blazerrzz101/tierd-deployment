"use client"

import { Button } from "@/components/ui/button"
import { ThumbsUp, ThumbsDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import { VoteStatus } from "./vote-status"
import VoteLimiterTooltip from "./vote-limiter-tooltip"
import { useVoteLimiter } from "@/hooks/use-vote-limiter"
import { useAuth } from "@/hooks/use-auth"

interface VoteButtonsProps {
  votes: number
  userVote: 'up' | 'down' | null
  onVote: (type: 'up' | 'down' | null) => void
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
  const { user } = useAuth()

  const sizes = {
    sm: "h-10 w-10",
    md: "h-12 w-12",
    lg: "h-14 w-14"
  }

  const iconSizes = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6"
  }

  const handleVote = (type: 'up' | 'down') => {
    if (!user) return
    if (!canVote) return
    
    // If clicking the same vote type, remove the vote
    if (userVote === type) {
      onVote(null)
    } else {
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
            className="text-sm font-medium text-muted-foreground"
          >
            Rate this product
          </motion.p>
        )}
        
        <VoteLimiterTooltip remainingCooldown={remainingCooldown} canVote={canVote && !!user}>
          <div className="flex items-center gap-4 rounded-2xl bg-card/50 p-3 backdrop-blur-sm">
            <motion.div 
              whileHover={{ scale: 1.05 }} 
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleVote('down')}
                disabled={!canVote || !user}
                className={cn(
                  sizes[size],
                  "rounded-xl border transition-all duration-300",
                  "bg-background/50 hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/50",
                  "active:scale-95",
                  userVote === 'down' && [
                    "bg-red-500/10 border-red-500/50 text-red-500",
                    "shadow-[0_0_15px_rgba(239,68,68,0.2)]"
                  ]
                )}
              >
                <ThumbsDown className={iconSizes[size]} />
              </Button>
            </motion.div>

            <AnimatePresence mode="wait">
              <motion.div
                key={votes}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className={cn(
                  "min-w-[3ch] text-center font-medium",
                  size === 'lg' ? "text-2xl" : "text-xl",
                  "text-foreground/80"
                )}
              >
                {votes}
              </motion.div>
            </AnimatePresence>

            <motion.div 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleVote('up')}
                disabled={!canVote || !user}
                className={cn(
                  sizes[size],
                  "rounded-xl border transition-all duration-300",
                  "bg-background/50 hover:bg-blue-500/10 hover:text-blue-500 hover:border-blue-500/50",
                  "active:scale-95",
                  userVote === 'up' && [
                    "bg-blue-500/10 border-blue-500/50 text-blue-500",
                    "shadow-[0_0_15px_rgba(59,130,246,0.2)]"
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