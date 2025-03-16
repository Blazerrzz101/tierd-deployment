"use client"

import { useState, useEffect } from "react"
import { Product } from "@/lib/types/product"
import { rankingStore } from "@/lib/ranking/ranking-store"

export function useProductRankings(category?: string) {
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