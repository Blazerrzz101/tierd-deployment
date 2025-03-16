"use client"

import { useState, useEffect } from 'react'
import { Product } from '@/types'
import { RankingService } from '../ranking/RankingService'

export function useRankings(products: Product[], category?: string) {
  const [rankedProducts, setRankedProducts] = useState<Product[]>(products)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const updateRankings = async () => {
      setIsLoading(true)
      try {
        const rankingService = RankingService.getInstance()
        let productsToRank = products
        
        if (category) {
          productsToRank = products.filter(p => p.category === category)
        }

        const ranked = await rankingService.getRankedProducts(productsToRank)
        setRankedProducts(ranked)
      } catch (error) {
        console.error('Error updating rankings:', error)
      } finally {
        setIsLoading(false)
      }
    }

    updateRankings()
    
    // Update rankings periodically
    const interval = setInterval(updateRankings, 5 * 60 * 1000) // Every 5 minutes
    return () => clearInterval(interval)
  }, [products, category])

  return { products: rankedProducts, isLoading }
}