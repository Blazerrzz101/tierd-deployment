"use client"

import { useState, useEffect } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"

export function BetaBanner() {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const dismissed = localStorage.getItem("beta-banner-dismissed")
    if (dismissed) {
      setIsVisible(false)
    }
  }, [])

  const handleDismiss = () => {
    localStorage.setItem("beta-banner-dismissed", "true")
    setIsVisible(false)
  }

  if (!isVisible) return null

  return (
    <div className="relative bg-gradient-to-r from-[#ff4b26] to-[#ff9426] px-4 py-3 text-white">
      <div className="container flex items-center justify-between">
        <p className="text-sm font-medium">
          🎮 Welcome to the beta! Help us improve by providing feedback.
        </p>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-white hover:bg-white/20"
          onClick={handleDismiss}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
} 