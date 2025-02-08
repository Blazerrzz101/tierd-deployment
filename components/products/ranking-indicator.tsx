"use client"

import { motion } from "framer-motion"
import { Trophy, TrendingUp, TrendingDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface RankingIndicatorProps {
  rank: number
  previousRank?: number
  size?: 'sm' | 'md' | 'lg'
}

export function RankingIndicator({ rank, previousRank, size = 'md' }: RankingIndicatorProps) {
  const rankChange = previousRank ? previousRank - rank : 0
  
  const sizes = {
    sm: "text-xl",
    md: "text-3xl",
    lg: "text-5xl"
  }

  const iconSizes = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6"
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div className={cn(
        "flex items-center gap-2 font-bold",
        sizes[size],
        rank <= 3 && "text-gradient-gold"
      )}>
        {rank <= 3 && <Trophy className={iconSizes[size]} />}
        #{rank}
      </div>
      
      {rankChange !== 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "flex items-center gap-1 text-sm",
            rankChange > 0 ? "text-green-500" : "text-red-500"
          )}
        >
          {rankChange > 0 ? (
            <>
              <TrendingUp className="h-3 w-3" />
              <span>Up {rankChange}</span>
            </>
          ) : (
            <>
              <TrendingDown className="h-3 w-3" />
              <span>Down {Math.abs(rankChange)}</span>
            </>
          )}
        </motion.div>
      )}
    </div>
  )
}