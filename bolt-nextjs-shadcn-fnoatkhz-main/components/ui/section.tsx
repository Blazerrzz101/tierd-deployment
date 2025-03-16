"use client"

import { cn } from "@/lib/utils"

interface SectionProps {
  children: React.ReactNode
  className?: string
  variant?: "default" | "muted" | "gradient"
}

export function Section({ 
  children, 
  className,
  variant = "default" 
}: SectionProps) {
  return (
    <section className={cn(
      "py-12 md:py-16 lg:py-20",
      variant === "muted" && "bg-muted/50",
      variant === "gradient" && "bg-gradient-to-b from-background to-muted/50",
      className
    )}>
      <div className="container">
        {children}
      </div>
    </section>
  )
}