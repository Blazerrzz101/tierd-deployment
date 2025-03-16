"use client"

import { Product } from "@/types"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ProductSpecsSection } from "./product-specs-section"
import { ProductReviews } from "./product-reviews"
import { ProductComparison } from "./product-comparison"

interface ProductTabsProps {
  product: Product
}

export function ProductTabs({ product }: ProductTabsProps) {
  return (
    <div className="container mx-auto max-w-4xl">
      <Tabs defaultValue="specs" className="space-y-4">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="specs">Specifications</TabsTrigger>
          <TabsTrigger value="reviews">Reviews</TabsTrigger>
          <TabsTrigger value="compare">Compare</TabsTrigger>
        </TabsList>

        <TabsContent value="specs" className="min-h-[400px]">
          <ProductSpecsSection product={product} />
        </TabsContent>

        <TabsContent value="reviews" className="min-h-[400px]">
          <ProductReviews productId={product.id} />
        </TabsContent>

        <TabsContent value="compare" className="min-h-[400px]">
          <ProductComparison product={product} />
        </TabsContent>
      </Tabs>
    </div>
  )
}