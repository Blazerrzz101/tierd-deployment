"use client"

import { useState, useEffect } from "react"
import { UnifiedProductDetail } from "@/components/products/unified-product-detail"
import { Product } from "@/utils/product-utils"
import { products } from "@/lib/data"
import { notFound } from "next/navigation"
import { Skeleton } from "@/components/ui/skeleton"

export default function ProductPage() {
  const productId = "asus-pg279qm"
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadProduct = async () => {
      // Try to find the product in the local data first
      let foundProduct = products.find(p => p.id === productId)
      
      // If not found locally, try to fetch from API
      if (!foundProduct) {
        try {
          const response = await fetch(`/api/products/product?id=${productId}`)
          if (response.ok) {
            const data = await response.json()
            if (data.success && data.product) {
              foundProduct = data.product
            }
          }
        } catch (error) {
          console.error(`Error fetching product with ID ${productId}:`, error)
        }
      }
      
      if (foundProduct) {
        // Cast to Product type to satisfy TypeScript
        setProduct(foundProduct as unknown as Product)
      }
      
      setLoading(false)
    }
    
    loadProduct()
  }, [])
  
  // Show loading state
  if (loading) {
    return (
      <div className="container mx-auto max-w-6xl px-4 py-12">
        <Skeleton className="w-full h-8 mb-4" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-5">
            <Skeleton className="w-full aspect-square rounded-xl" />
          </div>
          <div className="lg:col-span-7">
            <Skeleton className="w-full h-10 mb-4" />
            <Skeleton className="w-3/4 h-4 mb-2" />
            <Skeleton className="w-1/2 h-4 mb-6" />
            <div className="grid grid-cols-2 gap-4 mb-6">
              <Skeleton className="w-full h-20" />
              <Skeleton className="w-full h-20" />
            </div>
            <Skeleton className="w-full h-40" />
          </div>
        </div>
      </div>
    )
  }

  // If product not found, show 404 page
  if (!product) {
    return notFound()
  }
  
  // Ensure all required properties exist on the product
  const standardizedProduct: Product = {
    ...product,
    id: product.id,
    name: product.name,
    category: product.category || "",
    description: product.description || "",
    imageUrl: product.imageUrl || product.image_url || "/images/product-placeholder.png",
    url_slug: product.url_slug || "asus-rog-swift-pg279qm", // Use full product name for URL
    upvotes: product.upvotes || 0,
    downvotes: product.downvotes || 0,
    score: (product.upvotes || 0) - (product.downvotes || 0),
    rank: product.rank || 0,
    price: product.price || 0,
    specifications: product.specifications || (product as any).specs || {},
    created_at: product.created_at || new Date().toISOString(),
    updated_at: product.updated_at || new Date().toISOString()
  }

  return <UnifiedProductDetail product={standardizedProduct} />
}