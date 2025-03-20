"use client"

import React from "react"
import { getUserReputationLevel, getProgressToNextLevel } from "@/lib/utils/reputation"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface ReputationBadgeProps {
  points: number
  showProgress?: boolean
  size?: "sm" | "md" | "lg"
  className?: string
}

export function ReputationBadge({ 
  points, 
  showProgress = false,
  size = "md",
  className
}: ReputationBadgeProps) {
  const reputation = getUserReputationLevel(points)
  const progress = showProgress ? getProgressToNextLevel(points) : null
  
  const sizeClasses = {
    sm: "text-xs px-1.5 py-0.5",
    md: "text-sm px-2 py-1",
    lg: "text-base px-3 py-1.5"
  }
  
  return (
    <TooltipProvider>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <div className={cn(
            "inline-flex items-center gap-1.5 rounded-full border",
            reputation.borderColor,
            reputation.bgColor,
            sizeClasses[size],
            className
          )}>
            <span className="text-base leading-none">{reputation.badge}</span>
            <span className={cn("font-medium", reputation.color)}>
              {reputation.name}
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="p-4 space-y-2 max-w-xs">
          <div className="flex items-center gap-2">
            <span className="text-xl">{reputation.badge}</span>
            <div>
              <h4 className={cn("font-bold", reputation.color)}>{reputation.name}</h4>
              <p className="text-xs text-muted-foreground">Reputation: {points} points</p>
            </div>
          </div>
          
          {showProgress && progress !== null && (
            <div className="space-y-1">
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className={cn("h-full", reputation.color.replace("text-", "bg-"))} 
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{reputation.minPoints}</span>
                <span>{
                  reputation.level < 5 
                    ? progress.toFixed(0) + "% to " + getUserReputationLevel(points + 1).name
                    : "Max Level"
                }</span>
              </div>
            </div>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

// Mini version for inline use in thread/comment lists
export function MiniReputationBadge({ points }: { points: number }) {
  const reputation = getUserReputationLevel(points)
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={cn(
            "inline-flex items-center justify-center text-base",
            reputation.color,
          )}>
            {reputation.badge}
          </span>
        </TooltipTrigger>
        <TooltipContent side="top">
          <p>{reputation.name} ({points} points)</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
} 