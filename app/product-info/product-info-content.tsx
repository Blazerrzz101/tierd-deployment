"use client"

import { useState } from "react"
import { ProductTemplate } from "@/components/products/product-template"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Database } from "@/lib/supabase/database.types"

type Product = Database['public']['Tables']['products']['Row']

interface ProductInfoContentProps {
  initialProducts: Product[]
}

export function ProductInfoContent({ initialProducts }: ProductInfoContentProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const sortedProducts = [...initialProducts].sort((a, b) => 
    (a.created_at > b.created_at ? -1 : 1)
  )
  const currentProduct = sortedProducts[currentIndex]

  const goToNext = () => {
    setCurrentIndex((prev) => 
      prev === sortedProducts.length - 1 ? 0 : prev + 1
    )
  }

  const goToPrevious = () => {
    setCurrentIndex((prev) => 
      prev === 0 ? sortedProducts.length - 1 : prev - 1
    )
  }

  if (!currentProduct) {
    return <div>No products found</div>
  }

  return (
    <div className="relative">
      <ProductTemplate product={{
        id: currentProduct.id,
        name: currentProduct.name,
        description: currentProduct.description || '',
        category: currentProduct.category,
        price: currentProduct.price || 0,
        imageUrl: currentProduct.image_url || '',
        votes: 0,
        rank: 0,
        specs: {},
        userVote: null,
        url_slug: currentProduct.url_slug
      }} />
      
      {/* Navigation Buttons */}
      <div className="fixed bottom-8 right-8 flex gap-4">
        <Button
          variant="outline"
          size="lg"
          onClick={goToPrevious}
          className="rounded-full"
        >
          <ChevronLeft className="h-6 w-6" />
        </Button>
        <Button
          size="lg"
          onClick={goToNext}
          className="rounded-full bg-primary"
        >
          <ChevronRight className="h-6 w-6" />
        </Button>
      </div>

      {/* Progress Indicator */}
      <div className="fixed bottom-8 left-8 rounded-full bg-background/80 px-4 py-2 backdrop-blur">
        <span className="text-sm font-medium">
          Product {currentIndex + 1} of {sortedProducts.length}
        </span>
      </div>
    </div>
  )
} 