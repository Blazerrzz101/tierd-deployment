"use client"

import { useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { notFound } from "next/navigation"
import { supabase } from "@/lib/supabase/client"
import { ProductDetails } from "@/components/products/product-details"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { normalizeProduct } from "@/lib/utils"
import { Product } from "@/types/product"

interface ProductPageProps {
  params: {
    slug: string
  }
}

export default function ProductPage({ params }: ProductPageProps) {
  const { data: product, isLoading, error } = useQuery({
    queryKey: ["product", params.slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("url_slug", params.slug)
        .single()

      if (error || !data) {
        throw new Error("Product not found")
      }

      const normalized = normalizeProduct(data)
      
      // Ensure all required fields are present
      if (!normalized.id || !normalized.name || !normalized.category) {
        throw new Error("Invalid product data")
      }

      return normalized as Required<Product>
    },
  })

  // Handle loading state
  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="flex min-h-[50vh] items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    )
  }

  // Handle error state
  if (error || !product) {
    notFound()
  }

  return (
    <div className="container py-8">
      <ProductDetails product={product} />
    </div>
  )
} 