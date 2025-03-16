"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { Trophy, TrendingUp, TrendingDown } from "lucide-react"

interface VoteStatusProps {
  votes: number
  maxVotes?: number
}

export function VoteStatus({ votes, maxVotes = 1000 }: VoteStatusProps) {
  const percentage = Math.min((votes / maxVotes) * 100, 100)
  
  const getStatusInfo = (percent: number) => {
    if (percent < 33) return {
      color: "from-blue-500/40 to-blue-500/60",
      text: "Gaining Traction",
      icon: TrendingDown,
      textColor: "text-blue-400"
    }
    if (percent < 66) return {
      color: "from-blue-400/40 to-blue-400/60",
      text: "Rising Product",
      icon: TrendingUp,
      textColor: "text-blue-300"
    }
    return {
      color: "from-blue-300/40 to-blue-300/60",
      text: "Community Favorite",
      icon: Trophy,
      textColor: "text-blue-200"
    }
  }

  const status = getStatusInfo(percentage)
  const Icon = status.icon

  return (
    <div className="w-full space-y-2">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-1.5">
          <Icon className={cn("h-4 w-4", status.textColor)} />
          <span className={cn("font-medium", status.textColor)}>
            {status.text}
          </span>
        </div>
        <span className="text-muted-foreground">
          {votes.toLocaleString()} votes
        </span>
      </div>
      
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted/30">
        <motion.div
          className={cn(
            "absolute inset-y-0 left-0 bg-gradient-to-r",
            status.color
          )}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, ease: [0.65, 0, 0.35, 1] }}
        />
      </div>
    </div>
  )
}