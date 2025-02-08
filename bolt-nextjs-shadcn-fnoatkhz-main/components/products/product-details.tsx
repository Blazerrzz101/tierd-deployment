"use client"

import { Product } from "@/types"
import { Card } from "@/components/ui/card"

interface ProductDetailsProps {
  product: Product
}

export function ProductDetails({ product }: ProductDetailsProps) {
  const pros = [
    "Fits most hands and grip styles",
    "Good battery life",
    "Flawless wireless performance",
    "Lightweight"
  ]

  const cons = [
    "Micro USB charging port",
    "High price"
  ]

  return (
    <div className="space-y-8">
      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <h3 className="mb-4 font-medium">✓ Pros</h3>
          <ul className="space-y-2">
            {pros.map((pro, index) => (
              <li key={index} className="text-sm text-muted-foreground">
                • {pro}
              </li>
            ))}
          </ul>
        </div>
        
        <div>
          <h3 className="mb-4 font-medium">✕ Cons</h3>
          <ul className="space-y-2">
            {cons.map((con, index) => (
              <li key={index} className="text-sm text-muted-foreground">
                • {con}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div>
        <h3 className="mb-4 font-medium">⚙ Specs</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          {Object.entries(product.specs).map(([key, value]) => (
            <div key={key} className="flex justify-between">
              <span className="text-muted-foreground">{key}</span>
              <span>{value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}