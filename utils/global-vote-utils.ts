import { Product } from "@/types/product";
import { ProductVoteStatus } from "@/hooks/use-global-votes";

/**
 * Enhances a product with vote data from the given vote status
 */
export function enhanceProductWithVoteData<T extends Pick<Product, "id" | "name">>(
  product: T,
  voteStatus: ProductVoteStatus | undefined
): T & {
  upvotes: number;
  downvotes: number;
  score: number;
  userVote: number | null;
} {
  if (!voteStatus) {
    return {
      ...product,
      upvotes: 0,
      downvotes: 0,
      score: 0,
      userVote: null,
    };
  }

  return {
    ...product,
    upvotes: voteStatus.upvotes,
    downvotes: voteStatus.downvotes,
    score: voteStatus.score,
    userVote: voteStatus.voteType,
  };
}

/**
 * Formats vote data for display
 */
export function formatVoteData(voteStatus?: ProductVoteStatus) {
  return {
    upvotes: voteStatus?.upvotes ?? 0,
    downvotes: voteStatus?.downvotes ?? 0,
    score: voteStatus?.score ?? 0,
    voteType: voteStatus?.voteType ?? null,
    hasVoted: voteStatus?.hasVoted ?? false,
  };
}

/**
 * Batch enhances multiple products with their vote statuses
 */
export function enhanceProductsWithVoteData<T extends Pick<Product, "id" | "name">>(
  products: T[],
  voteStatuses: Record<string, ProductVoteStatus>
): Array<T & {
  upvotes: number;
  downvotes: number;
  score: number;
  userVote: number | null;
}> {
  return products.map(product => {
    const voteStatus = voteStatuses[product.id];
    return enhanceProductWithVoteData(product, voteStatus);
  });
}

/**
 * Gets a query key for the product vote status
 */
export function getProductVoteQueryKey(productId: string): string[] {
  return ['product-vote', productId];
} 