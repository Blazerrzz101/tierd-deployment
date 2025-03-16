"use client"

import { useState, useEffect } from "react"
import { Product } from "@/types"
import { rankingStore } from "@/lib/ranking-store"

export function useRankings(category?: string) {
  const [products, setProducts] = useState<Product[]>([])

  useEffect(() => {
    function updateProducts() {
      const allProducts = category 
        ? rankingStore.getProductsByCategory(category)
        : rankingStore.getProducts()
      setProducts(allProducts)
    }

    updateProducts()
    return rankingStore.subscribe(updateProducts)
  }, [category])

  return products
}