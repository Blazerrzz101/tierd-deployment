"use client"

import { useState, useEffect } from "react"
import { ProductStats } from "@/lib/types/product"
import { ProductService } from "@/lib/services/product-service"

export function useProductStats(productId: string, userId: string) {
  const [stats, setStats] = useState<ProductStats>(() => 
    ProductService.getProductStats(productId)
  )

  useEffect(() => {
    // Track user activity
    ProductService.trackUserActivity(productId, userId)

    // Update stats periodically
    const interval = setInterval(() => {
      setStats(ProductService.getProductStats(productId))
    }, 5000)

    return () => clearInterval(interval)
  }, [productId, userId])

  return stats
}