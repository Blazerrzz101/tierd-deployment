"use client"

import { useState, useEffect } from "react"
import { voteTracker } from "@/lib/vote-tracking"

interface VoteStats {
  upvotes: number
  downvotes: number
  totalVotes: number
  activeUsers: number
  lastUpdated: number
}

export function useVoteTracking(productId: string) {
  const [stats, setStats] = useState(() => voteTracker.getProductStats(productId))
  const [activeUsers, setActiveUsers] = useState(() => voteTracker.getActiveUsers())
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let isMounted = true

    const updateStats = async () => {
      try {
        if (!isMounted) return

        setIsLoading(true)
        setError(null)

        const newStats = voteTracker.getProductStats(productId)
        const newActiveUsers = voteTracker.getActiveUsers()

        if (isMounted) {
          setStats(newStats)
          setActiveUsers(newActiveUsers)
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Failed to fetch vote stats'))
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    // Initial update
    updateStats()

    // Update stats every 5 seconds
    const interval = setInterval(updateStats, 5000)

    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [productId])

  return {
    stats,
    activeUsers,
    isLoading,
    error
  }
}