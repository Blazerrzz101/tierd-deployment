"use client"

import { Product, ProductStats } from "@/lib/types/product"

export class ProductService {
  private static activeUsers: Map<string, Set<string>> = new Map()
  private static voteStats: Map<string, { up: number; down: number }> = new Map()
  private static readonly ACTIVE_TIMEOUT = 30 * 60 * 1000 // 30 minutes

  static trackUserActivity(productId: string, userId: string): void {
    if (!this.activeUsers.has(productId)) {
      this.activeUsers.set(productId, new Set())
    }
    this.activeUsers.get(productId)?.add(userId)

    // Clean up inactive users after timeout
    setTimeout(() => {
      this.activeUsers.get(productId)?.delete(userId)
    }, this.ACTIVE_TIMEOUT)
  }

  static getProductStats(productId: string): ProductStats {
    const votes = this.voteStats.get(productId) || { up: 0, down: 0 }
    const activeUsers = this.activeUsers.get(productId)?.size || 0

    return {
      upvotes: votes.up,
      downvotes: votes.down,
      totalVotes: votes.up + votes.down,
      activeUsers,
      lastUpdated: Date.now()
    }
  }

  static recordVote(productId: string, voteType: 'up' | 'down' | null, previousVote: 'up' | 'down' | null): void {
    if (!this.voteStats.has(productId)) {
      this.voteStats.set(productId, { up: 0, down: 0 })
    }

    const stats = this.voteStats.get(productId)!

    // Remove previous vote if exists
    if (previousVote === 'up') stats.up--
    if (previousVote === 'down') stats.down--

    // Add new vote
    if (voteType === 'up') stats.up++
    if (voteType === 'down') stats.down++

    this.voteStats.set(productId, stats)
  }
}