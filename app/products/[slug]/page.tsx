"use client"

import { Suspense } from "react"
import { useProduct } from "@/hooks/use-product"
import { ProductDetails } from "@/components/products/product-details"
import { ProductSkeleton } from "@/components/products/product-skeleton"
import { ErrorBoundary } from "@/components/error-boundary"
import { notFound } from "next/navigation"

interface ProductPageProps {
  params: {
    slug: string
  }
}

export default function ProductPage({ params }: ProductPageProps) {
  const { data: product, isLoading, error } = useProduct(params.slug, true)

  if (error) {
    console.error('Product page error:', error)
    return notFound()
  }

  if (!isLoading && !product) {
    console.error('Product not found:', params.slug)
    return notFound()
  }

  return (
    <ErrorBoundary>
      <Suspense fallback={<ProductSkeleton />}>
        {isLoading ? (
          <ProductSkeleton />
        ) : product ? (
          <ProductDetails product={product} />
        ) : null}
      </Suspense>
    </ErrorBoundary>
  )
} 