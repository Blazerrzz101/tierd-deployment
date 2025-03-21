"use client"

import { cn } from "@/lib/utils"

interface StaticLogoProps {
  className?: string
}

export function StaticLogo({ className }: StaticLogoProps) {
  return (
    <div className={cn("relative", className)}>
      {/* Simple black and white logo text */}
      <h1 className="text-2xl font-bold text-white">
        <span className="relative">
          Tier'd
          
          {/* Static apostrophe */}
          <span className="absolute top-0 right-[-2px] text-white">
            '
          </span>
        </span>
      </h1>
    </div>
  )
} 