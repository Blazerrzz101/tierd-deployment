"use client"

import { useState, useEffect } from "react"
import { voteTracker } from "@/lib/vote-tracking"

export function useVoteTracking(productId: string) {
  const [stats, setStats] = useState(() => voteTracker.getProductStats(productId))
  const [activeUsers, setActiveUsers] = useState(() => voteTracker.getActiveUsers())

  useEffect(() => {
    // Update stats every 5 seconds
    const interval = setInterval(() => {
      setStats(voteTracker.getProductStats(productId))
      setActiveUsers(voteTracker.getActiveUsers())
    }, 5000)

    return () => clearInterval(interval)
  }, [productId])

  return {
    stats,
    activeUsers
  }
}