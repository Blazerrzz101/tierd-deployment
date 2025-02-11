import { Suspense } from "react"
import { ProductDetails } from "@/components/products/product-details"
import { RelatedProducts } from "@/components/products/related-products"
import { ProductReviews } from "@/components/products/product-reviews"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { NotFound } from "@/components/not-found"
import { getProduct } from "@/lib/supabase/server"

interface Props {
  params: {
    slug: string
  }
}

export default async function ProductPage({ params }: Props) {
  // Normalize the slug to match database format
  const normalizedSlug = params.slug.replace(/-g-pro-/, '-gpro-')
  const product = await getProduct(normalizedSlug)

  if (!product) {
    return (
      <NotFound 
        title="Product Not Found"
        description="The product you're looking for doesn't exist or has been removed."
      />
    )
  }

  return (
    <div className="py-8">
      <div className="container mx-auto px-4">
        <Suspense fallback={<LoadingSpinner />}>
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
        </Suspense>
      </div>
    </div>
  )
} 