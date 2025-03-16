import { Product, VoteType } from "@/types"
import { calculateRankings, updateRankings } from "./ranking"

// In-memory database simulation
let products: Product[] = []

// Initialize with data and calculate initial rankings
export function initializeDb(initialProducts: Product[]) {
  products = calculateRankings(initialProducts)
}

// Get all products with current rankings
export function getAllProducts(): Product[] {
  return [...products]
}

// Get products by category
export function getProductsByCategory(category: string): Product[] {
  return calculateRankings(products, category)
}

// Update product votes and recalculate rankings
export function updateProductVotes(
  productId: string,
  voteType: VoteType,
  previousVote: VoteType | null
): Product {
  // Update rankings
  products = updateRankings(products, productId, voteType, previousVote)
  
  // Return updated product
  const product = products.find(p => p.id === productId)
  if (!product) throw new Error("Product not found")
  
  return product
}

// Get a single product
export function getProduct(id: string): Product | undefined {
  return products.find(p => p.id === id)
}