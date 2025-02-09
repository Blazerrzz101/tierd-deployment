"use client"

import { useEffect } from "react"
import { useParams } from "next/navigation"
import { MainLayout } from "@/components/home/main-layout"
import { ProductDetails } from "@/components/products/product-details"
import { RelatedProducts } from "@/components/products/related-products"
import { ProductReviews } from "@/components/products/product-reviews"
import { useProduct } from "@/hooks/use-product"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { NotFound } from "@/components/not-found"

export default function ProductPage() {
  const { slug } = useParams()
  const { product, isLoading, error } = useProduct(slug as string)

  // Track product view
  useEffect(() => {
    if (product?.id) {
      // Increment view count in analytics
      fetch('/api/products/track-view', {
        method: 'POST',
        body: JSON.stringify({ productId: product.id })
      })
    }
  }, [product?.id])

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <LoadingSpinner />
        </div>
      </MainLayout>
    )
  }

  if (error || !product) {
    return (
      <MainLayout>
        <NotFound 
          title="Product Not Found"
          description="The product you're looking for doesn't exist or has been removed."
        />
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="py-8">
        <div className="container mx-auto px-4">
          {/* Product Details */}
          <ProductDetails product={product} />

          {/* Related Products */}
          <div className="mt-16">
            <h2 className="text-2xl font-bold mb-8">Related Products</h2>
            <RelatedProducts 
              categoryId={product.category}
              currentProductId={product.id}
            />
          </div>

          {/* Product Reviews */}
          <div className="mt-16">
            <h2 className="text-2xl font-bold mb-8">Reviews</h2>
            <ProductReviews productId={product.id} />
          </div>
        </div>
      </div>
    </MainLayout>
  )
} 