"use client"

interface Vote {
  productId: string
  userId: string
  type: 'up' | 'down'
  timestamp: number
}

interface RankingFactors {
  upvotes: number
  downvotes: number
  recentVotes: number
  timeDecay: number
  controversyScore: number
}

export class RankingAlgorithm {
  private static readonly RECENT_VOTES_WINDOW = 7 * 24 * 60 * 60 * 1000 // 7 days
  private static readonly TIME_DECAY_FACTOR = 1.5
  
  static calculateScore(factors: RankingFactors): number {
    if (factors.upvotes + factors.downvotes === 0) {
      return 0
    }

    // Wilson score interval for rating
    const n = factors.upvotes + factors.downvotes
    const p = factors.upvotes / n
    const z = 1.96 // 95% confidence
    const phat = (p + z * z / (2 * n) - z * Math.sqrt((p * (1 - p) + z * z / (4 * n)) / n)) / (1 + z * z / n)

    // Time decay
    const timeDecayScore = Math.pow(factors.timeDecay, this.TIME_DECAY_FACTOR)

    // Recent activity boost
    const recentActivityBoost = Math.log(factors.recentVotes + 1)

    // Controversy penalty (optional)
    const controversyPenalty = factors.controversyScore > 0.5 ? 0.8 : 1

    return phat * timeDecayScore * recentActivityBoost * controversyPenalty
  }

  static getRecentVotesCount(votes: Vote[]): number {
    const now = Date.now()
    return votes.filter(vote => 
      now - vote.timestamp < this.RECENT_VOTES_WINDOW
    ).length
  }

  static calculateControversyScore(upvotes: number, downvotes: number): number {
    const total = upvotes + downvotes
    if (total === 0) return 0
    
    const upvoteRatio = upvotes / total
    return Math.abs(0.5 - upvoteRatio) * 2
  }
}