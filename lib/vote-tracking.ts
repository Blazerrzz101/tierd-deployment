"use client"

import { Product } from "@/types"

interface VoteStats {
  upvotes: number
  downvotes: number
  totalVotes: number
  activeUsers: number
  lastUpdated: number
}

class VoteTracker {
  private static instance: VoteTracker
  private voteStats: Map<string, VoteStats> = new Map()
  private activeUsers: Set<string> = new Set()
  private readonly ACTIVE_THRESHOLD = 30 * 60 * 1000 // 30 minutes

  private constructor() {
    // Initialize with empty stats
    this.cleanupInactiveUsers()
  }

  static getInstance(): VoteTracker {
    if (!VoteTracker.instance) {
      VoteTracker.instance = new VoteTracker()
    }
    return VoteTracker.instance
  }

  trackVote(productId: string, userId: string, voteType: 'up' | 'down' | null): void {
    // Get or initialize stats for this product
    const stats = this.voteStats.get(productId) || {
      upvotes: 0,
      downvotes: 0,
      totalVotes: 0,
      activeUsers: 0,
      lastUpdated: Date.now()
    }

    // Update vote counts
    if (voteType === 'up') {
      stats.upvotes++
      stats.totalVotes++
    } else if (voteType === 'down') {
      stats.downvotes++
      stats.totalVotes++
    }

    // Track active user
    this.activeUsers.add(userId)
    stats.activeUsers = this.activeUsers.size
    stats.lastUpdated = Date.now()

    // Update stats
    this.voteStats.set(productId, stats)
  }

  getProductStats(productId: string): VoteStats {
    return this.voteStats.get(productId) || {
      upvotes: 0,
      downvotes: 0,
      totalVotes: 0,
      activeUsers: 0,
      lastUpdated: Date.now()
    }
  }

  getActiveUsers(): number {
    return this.activeUsers.size
  }

  private cleanupInactiveUsers(): void {
    setInterval(() => {
      const now = Date.now()
      this.voteStats.forEach((stats, productId) => {
        if (now - stats.lastUpdated > this.ACTIVE_THRESHOLD) {
          stats.activeUsers = Math.max(0, stats.activeUsers - 1)
          this.voteStats.set(productId, stats)
        }
      })
    }, 60000) // Check every minute
  }
}

export const voteTracker = VoteTracker.getInstance()