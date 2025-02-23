"use client"

import { Suspense } from "react"
import { useProduct } from "@/hooks/use-product"
import { ProductDetails } from "@/components/products/product-details"
import { ProductSkeleton } from "@/components/products/product-skeleton"
import { ErrorBoundary } from "@/components/error-boundary"

interface ProductPageProps {
  params: {
    slug: string
  }
}

export default function ProductPage({ params }: ProductPageProps) {
  const { data: product, isLoading, error } = useProduct(params.slug)

  if (error) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold">Error Loading Product</h2>
          <p className="mt-2 text-muted-foreground">
            {error instanceof Error ? error.message : 'Failed to load product. Please try again.'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <ErrorBoundary>
      <Suspense fallback={<ProductSkeleton />}>
        {isLoading ? (
          <ProductSkeleton />
        ) : product ? (
          <ProductDetails product={product} />
        ) : (
          <div className="flex min-h-[50vh] items-center justify-center">
            <div className="text-center">
              <h2 className="text-2xl font-bold">Product Not Found</h2>
              <p className="mt-2 text-muted-foreground">
                The product you're looking for doesn't exist or has been removed.
              </p>
            </div>
          </div>
        )}
      </Suspense>
    </ErrorBoundary>
  )
} 