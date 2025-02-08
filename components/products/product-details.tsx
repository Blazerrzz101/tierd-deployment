"use client"

import { Product } from "@/types"
import { Card } from "@/components/ui/card"

interface ProductDetailsProps {
  product: Product
}

export function ProductDetails({ product }: ProductDetailsProps) {
  // Default pros and cons if not provided
  const defaultPros = [
    "High-quality build",
    "Good value for money",
    "Reliable performance"
  ]

  const defaultCons = [
    "Limited availability",
    "Price could be better"
  ]

  // Ensure we have fallback values for all required fields
  const {
    details = {},
    specs = {},
    metadata = {}
  } = product || {}

  // Use metadata.pros/cons if available, otherwise use defaults
  const pros = metadata?.pros || defaultPros
  const cons = metadata?.cons || defaultCons

  return (
    <div className="space-y-8">
      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <h3 className="mb-4 font-medium">✓ Pros</h3>
          <ul className="space-y-2">
            {pros.map((pro: string, index: number) => (
              <li key={index} className="text-sm text-muted-foreground">
                • {pro}
              </li>
            ))}
          </ul>
        </div>
        
        <div>
          <h3 className="mb-4 font-medium">✕ Cons</h3>
          <ul className="space-y-2">
            {cons.map((con: string, index: number) => (
              <li key={index} className="text-sm text-muted-foreground">
                • {con}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div>
        <h3 className="mb-4 font-medium">⚙ Specifications</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          {Object.entries({ ...specs, ...details }).map(([key, value]) => (
            <div key={key} className="flex justify-between">
              <span className="text-muted-foreground capitalize">
                {key.replace(/_/g, ' ')}
              </span>
              <span>{value || 'N/A'}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}