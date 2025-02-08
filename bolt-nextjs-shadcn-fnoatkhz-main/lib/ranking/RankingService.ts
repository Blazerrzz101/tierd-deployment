"use client"

import { RankingAlgorithm } from './RankingAlgorithm'
import { ActivityTracker } from '../activity/ActivityTracker'
import { Product } from '@/types'

export class RankingService {
  private static instance: RankingService
  private rankingCache: Map<string, number> = new Map()
  private readonly CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

  private constructor() {
    this.startPeriodicUpdate()
  }

  static getInstance(): RankingService {
    if (!RankingService.instance) {
      RankingService.instance = new RankingService()
    }
    return RankingService.instance
  }

  async updateProductRanking(product: Product): Promise<number> {
    const activityTracker = ActivityTracker.getInstance()
    const metrics = activityTracker.getProductMetrics(product.id)
    
    const factors = {
      upvotes: product.votes, // Simplified for example
      downvotes: 0, // You'd track this separately in real implementation
      recentVotes: metrics.votes,
      timeDecay: this.calculateTimeDecay(metrics.lastActivity),
      controversyScore: RankingAlgorithm.calculateControversyScore(product.votes, 0)
    }

    const score = RankingAlgorithm.calculateScore(factors)
    this.rankingCache.set(product.id, score)
    
    return score
  }

  async getRankedProducts(products: Product[]): Promise<Product[]> {
    const rankedProducts = await Promise.all(
      products.map(async (product) => {
        const cachedScore = this.rankingCache.get(product.id)
        const score = cachedScore || await this.updateProductRanking(product)
        return { ...product, score }
      })
    )

    return rankedProducts
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .map((product, index) => ({
        ...product,
        rank: index + 1
      }))
  }

  private calculateTimeDecay(lastActivityTimestamp: number): number {
    const now = Date.now()
    const hoursSinceActivity = (now - lastActivityTimestamp) / (1000 * 60 * 60)
    return 1 / (1 + Math.log(1 + hoursSinceActivity))
  }

  private startPeriodicUpdate(): void {
    setInterval(() => {
      this.rankingCache.clear()
    }, this.CACHE_DURATION)
  }
}