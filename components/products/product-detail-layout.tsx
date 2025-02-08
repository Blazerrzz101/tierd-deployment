"use client"

import { Product } from "@/types/product"
import { ProductGallery } from "./product-gallery"
import { ProductInfo } from "./product-info"
import { ProductSpecsSection } from "./product-specs-section"

interface ProductDetailLayoutProps {
  product: Product;
}

export function ProductDetailLayout({ product }: ProductDetailLayoutProps) {
  return (
    <div className="container mx-auto max-w-6xl px-4 pt-24 pb-16">
      <div className="grid gap-8 md:grid-cols-2">
        {/* Left Column - Gallery */}
        <div className="space-y-6">
          <ProductGallery product={product} />
        </div>

        {/* Right Column - Info & Specs */}
        <div className="space-y-8">
          <ProductInfo product={product} />
          <div className="hidden md:block">
            <ProductSpecsSection product={product} />
          </div>
        </div>
      </div>

      {/* Mobile Specs Section */}
      <div className="mt-8 md:hidden">
        <ProductSpecsSection product={product} />
      </div>
    </div>
  )
}