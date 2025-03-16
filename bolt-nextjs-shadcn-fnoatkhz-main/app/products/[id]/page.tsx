import { notFound } from "next/navigation"
import { products } from "@/lib/data"
import { ProductGallery } from "@/components/products/product-gallery"
import { ProductInfo } from "@/components/products/product-info"
import { ProductTabs } from "@/components/products/product-tabs"
import { RelatedProducts } from "@/components/products/product-related"

// Generate static params for all products with pagination
export function generateStaticParams() {
  try {
    // Limit to first 20 products for initial build
    return products.slice(0, 20).map((product) => ({
      id: product.id,
    }))
  } catch (error) {
    console.error('Error generating static params:', error)
    return [] // Return empty array as fallback
  }
}

export default function ProductPage({ params }: { params: { id: string } }) {
  try {
    const product = products.find(p => p.id === params.id)
    if (!product) return notFound()

    return (
      <div className="container space-y-8 pt-24 pb-8">
        <div className="grid gap-8 lg:grid-cols-2">
          <ProductGallery product={product} />
          <ProductInfo product={product} />
        </div>

        <ProductTabs product={product} />
        
        <RelatedProducts 
          currentProductId={product.id}
          category={product.category}
        />
      </div>
    )
  } catch (error) {
    console.error('Error rendering product page:', error)
    return notFound()
  }
}