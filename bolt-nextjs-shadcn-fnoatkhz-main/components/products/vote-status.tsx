```tsx
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
      color: "from-red-500/80 to-red-500",
      text: "Needs More Votes",
      icon: TrendingDown,
      textColor: "text-red-500"
    }
    if (percent < 66) return {
      color: "from-yellow-500/80 to-yellow-500",
      text: "Rising Product",
      icon: TrendingUp,
      textColor: "text-yellow-500"
    }
    return {
      color: "from-green-500/80 to-green-500",
      text: "Community Favorite",
      icon: Trophy,
      textColor: "text-green-500"
    }
  }

  const status = getStatusInfo(percentage)
  const Icon = status.icon

  return (
    <div className="w-full space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className={cn("h-4 w-4", status.textColor)} />
          <span className={cn("font-medium", status.textColor)}>
            {status.text}
          </span>
        </div>
        <span className="text-sm text-muted-foreground">
          {votes.toLocaleString()} votes
        </span>
      </div>
      
      <div className="h-3 overflow-hidden rounded-full bg-muted/30 p-[2px]">
        <motion.div
          className={cn(
            "h-full rounded-full bg-gradient-to-r",
            status.color
          )}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
    </div>
  )
}
```