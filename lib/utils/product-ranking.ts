import { Product, ProductVote } from "@/types";

/**
 * Calculate the confidence score for a product based on its votes
 * Using Wilson score interval for sorted rating
 */
export function calculateConfidenceScore(upvotes: number, downvotes: number): number {
  const n = upvotes + downvotes;
  if (n === 0) return 0;

  const z = 1.96; // 95% confidence interval
  const p = upvotes / n;

  // Wilson score interval
  const left = p + (z * z) / (2 * n);
  const right = z * Math.sqrt((p * (1 - p) + (z * z) / (4 * n)) / n);
  const under = 1 + (z * z) / n;

  return ((left - right) / under) * 100;
}

/**
 * Calculate time decay factor for ranking
 * Newer items get a boost in ranking
 */
export function calculateTimeDecay(createdAt: string): number {
  const postTime = new Date(createdAt).getTime();
  const now = new Date().getTime();
  const age = (now - postTime) / (1000 * 60 * 60); // Age in hours
  return Math.pow(age + 2, -0.6);
}

/**
 * Calculate overall product ranking
 * Combines vote confidence and time decay
 */
export function calculateProductRanking(product: Product): number {
  const upvotes = product.votes || 0;
  const downvotes = 0; // You'll need to track this separately
  const confidence = calculateConfidenceScore(upvotes, downvotes);
  const timeDecay = calculateTimeDecay(product.created_at);
  
  return confidence * timeDecay;
}

/**
 * Sort products by their ranking
 */
export function sortProductsByRanking(products: Product[]): Product[] {
  return [...products].sort((a, b) => b.ranking - a.ranking);
}

/**
 * Get vote distribution for a product
 */
export function getVoteDistribution(votes: ProductVote[]): { upvotes: number; downvotes: number } {
  return votes.reduce(
    (acc, vote) => {
      if (vote.vote_type === 'up') acc.upvotes++;
      else if (vote.vote_type === 'down') acc.downvotes++;
      return acc;
    },
    { upvotes: 0, downvotes: 0 }
  );
}

/**
 * Format ranking for display
 */
export function formatRanking(ranking: number): string {
  return ranking.toFixed(1);
}

/**
 * Get trending products based on recent votes and high ranking
 */
export function getTrendingProducts(products: Product[], timeWindow: number = 24): Product[] {
  const now = new Date();
  const windowStart = new Date(now.getTime() - timeWindow * 60 * 60 * 1000);

  return products
    .filter(product => {
      const productDate = new Date(product.created_at);
      return productDate >= windowStart;
    })
    .sort((a, b) => calculateProductRanking(b) - calculateProductRanking(a))
    .slice(0, 10);
} 