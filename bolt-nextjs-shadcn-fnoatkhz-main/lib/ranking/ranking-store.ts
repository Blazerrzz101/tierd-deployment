"use client"

import { Product, VoteType } from "@/lib/types/product"
import { calculateRankings, updateRankings } from "./ranking-system"

class RankingStore {
  private products: Product[] = []
  private subscribers: Set<() => void> = new Set()

  constructor(initialProducts: Product[]) {
    this.products = calculateRankings(initialProducts)
  }

  getProducts(): Product[] {
    return [...this.products]
  }

  getProductsByCategory(category: string): Product[] {
    return this.products.filter(p => p.category === category)
  }

  vote(productId: string, voteType: VoteType): void {
    const product = this.products.find(p => p.id === productId)
    if (!product) return

    const previousVote = product.userVote
    this.products = updateRankings(this.products, productId, voteType, previousVote)
    this.notifySubscribers()
  }

  subscribe(callback: () => void): () => void {
    this.subscribers.add(callback)
    return () => this.subscribers.delete(callback)
  }

  private notifySubscribers(): void {
    this.subscribers.forEach(callback => callback())
  }
}

export const rankingStore = new RankingStore([])