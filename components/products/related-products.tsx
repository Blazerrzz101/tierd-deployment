"use client"

import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase/client"
import { Product } from "@/types/product"
import { normalizeProduct } from "@/lib/utils"
import { ProductCard } from "@/components/products/product-card"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

interface RelatedProductsProps {
  product: Product
  limit?: number
}

export function RelatedProducts({ product, limit = 4 }: RelatedProductsProps) {
  // Early return if no product or category
  if (!product?.category) {
    return null
  }

  const { data: relatedProducts, isLoading } = useQuery({
    queryKey: ["related-products", product.category, product.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("category", product.category)
        .neq("id", product.id)
        .order("score", { ascending: false })
        .limit(limit)

      if (error) throw error
      return data.map(p => normalizeProduct(p)) as Product[]
    },
    enabled: !!product.category, // Only run query if we have a category
  })

  if (isLoading) {
    return (
      <div className="flex h-[200px] items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  if (!relatedProducts?.length) {
    return (
      <div className="text-center text-muted-foreground">
        No related products found in {product.category}
      </div>
    )
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {relatedProducts.map((relatedProduct) => (
        <ProductCard
          key={relatedProduct.id}
          product={relatedProduct}
          variant="compact"
        />
      ))}
    </div>
  )
}