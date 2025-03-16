"use client"

import { cn } from "@/lib/utils"

interface GridProps {
  children: React.ReactNode
  className?: string
  cols?: 1 | 2 | 3 | 4
  gap?: 'sm' | 'md' | 'lg'
}

export function Grid({ 
  children, 
  className,
  cols = 3,
  gap = 'md'
}: GridProps) {
  return (
    <div className={cn(
      "grid",
      gap === 'sm' && 'gap-4',
      gap === 'md' && 'gap-6',
      gap === 'lg' && 'gap-8',
      cols === 1 && 'grid-cols-1',
      cols === 2 && 'grid-cols-1 sm:grid-cols-2',
      cols === 3 && 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
      cols === 4 && 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
      className
    )}>
      {children}
    </div>
  )
}