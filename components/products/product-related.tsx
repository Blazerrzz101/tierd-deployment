"use client"

import { Product } from "@/types"
import { supabase } from "@/lib/supabase/client"
import { ProductCard } from "@/components/rankings/product-card"
import { useEffect, useState } from "react"

interface RelatedProductsProps {
  currentProductId: string
  category: string
}

export function RelatedProducts({ currentProductId, category }: RelatedProductsProps) {
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([])

  useEffect(() => {
    async function fetchRelatedProducts() {
      const { data: products, error } = await supabase
        .from('products')
        .select('*')
        .eq('category', category)
        .neq('id', currentProductId)
        .order('votes', { ascending: false })
        .limit(3)

      if (!error && products) {
        setRelatedProducts(products as Product[])
      }
    }

    fetchRelatedProducts()
  }, [category, currentProductId])

  if (relatedProducts.length === 0) return null

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Similar Products</h2>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {relatedProducts.map((product) => (
          <ProductCard 
            key={product.id} 
            product={product}
            variant="compact"
          />
        ))}
      </div>
    </div>
  )
}