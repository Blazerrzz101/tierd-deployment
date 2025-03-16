"use client"

import { useState, useEffect } from "react"
import { Product } from "@/types"
import { getAllProducts, getProductsByCategory } from "@/lib/db"

export function useProducts(category?: string) {
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setIsLoading(true)
    const data = category ? getProductsByCategory(category) : getAllProducts()
    setProducts(data)
    setIsLoading(false)
  }, [category])

  return {
    products,
    isLoading
  }
}