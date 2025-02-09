"use client"

import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase/client"
import { Product } from "@/hooks/use-product"
import { ProductCard } from "@/components/products/product-card"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

interface RelatedProductsProps {
  categoryId: string
  currentProductId: string
}

export function RelatedProducts({ categoryId, currentProductId }: RelatedProductsProps) {
  const { data: relatedProducts, isLoading } = useQuery<Product[]>({
    queryKey: ['related-products', categoryId, currentProductId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('category', categoryId)
        .neq('id', currentProductId)
        .limit(4)

      if (error) throw error
      return data
    },
    staleTime: 1000 * 60 * 5 // Consider data fresh for 5 minutes
  })

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner />
      </div>
    )
  }

  if (!relatedProducts?.length) {
    return (
      <p className="text-center text-gray-500">
        No related products found
      </p>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {relatedProducts.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          className="h-full"
        />
      ))}
    </div>
  )
}