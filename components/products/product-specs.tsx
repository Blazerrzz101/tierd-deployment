"use client"

import { Product } from "@/types"
import { Card } from "@/components/ui/card"

interface ProductSpecsProps {
  product: Product
}

export function ProductSpecs({ product }: ProductSpecsProps) {
  return (
    <Card>
      <div className="divide-y">
        {Object.entries(product.specs).map(([key, value], index) => (
          <div
            key={index}
            className="flex items-center justify-between p-4 text-sm"
          >
            <span className="font-medium">{key}</span>
            <span className="text-muted-foreground">{value}</span>
          </div>
        ))}
      </div>
    </Card>
  )
}