"use client"

import { useState } from "react"
import { MainLayout } from "@/components/home/main-layout"
import { ProductTemplate } from "@/components/products/product-template"
import { products } from "@/lib/data"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

export default function ProductInfoPage() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const sortedProducts = [...products].sort((a, b) => a.rank - b.rank)
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

  return (
    <MainLayout>
      <div className="relative">
        <ProductTemplate product={currentProduct} />
        
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
    </MainLayout>
  )
}