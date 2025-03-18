"use client"

import { Suspense } from "react"
import { useProduct } from "@/hooks/use-product"
import { ProductDetails } from "@/components/products/product-details"
import { ProductSkeleton } from "@/components/products/product-skeleton"
import { ErrorBoundary } from "@/components/error-boundary"
import { notFound, useRouter } from "next/navigation"
import { useEffect } from "react"

interface ProductPageProps {
  params: {
    slug: string
  }
}

export default function ProductPage({ params }: ProductPageProps) {
  const router = useRouter()
  
  // Redirect to products page if slug is undefined or contains "undefined"
  useEffect(() => {
    if (!params.slug || params.slug === "undefined" || params.slug.includes("undefined")) {
      console.error("Invalid product slug:", params.slug)
      router.push("/products")
      return
    }
  }, [params.slug, router])
  
  // Don't even try to load a product with an invalid slug
  if (!params.slug || params.slug === "undefined" || params.slug.includes("undefined")) {
    return <ProductSkeleton />
  }
  
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