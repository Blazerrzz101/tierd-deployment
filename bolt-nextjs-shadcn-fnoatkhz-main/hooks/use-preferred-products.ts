"use client"

import { useState, useEffect } from "react"
import { Product } from "@/types"
import { products } from "@/lib/data"

export function usePreferredProducts(productIds: string[]): Product[] {
  const [preferredProducts, setPreferredProducts] = useState<Product[]>([])

  useEffect(() => {
    const filtered = products.filter(p => productIds.includes(p.id))
    setPreferredProducts(filtered)
  }, [productIds])

  return preferredProducts
}