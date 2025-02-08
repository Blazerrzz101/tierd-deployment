"use client"

import { Product } from "@/types"
import { Card, CardContent } from "@/components/ui/card"
import { products } from "@/lib/data"
import Image from "next/image"
import { Check, Minus } from "lucide-react"
import { cn } from "@/lib/utils"

interface ProductComparisonProps {
  product: Product
}

export function ProductComparison({ product }: ProductComparisonProps) {
  // Get similar products from the same category
  const similarProducts = products
    .filter(p => p.category === product.category && p.id !== product.id)
    .slice(0, 2)

  const comparisonProducts = [product, ...similarProducts]

  return (
    <div className="space-y-8">
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {comparisonProducts.map((p) => (
          <Card key={p.id} className={cn(
            p.id === product.id && "border-primary"
          )}>
            <CardContent className="p-6">
              <div className="relative aspect-square overflow-hidden rounded-lg">
                <Image
                  src={p.imageUrl}
                  alt={p.name}
                  fill
                  className="object-cover"
                />
              </div>
              <h4 className="mt-4 text-lg font-semibold">{p.name}</h4>
              <p className="mt-1 text-sm text-muted-foreground">
                ${p.price.toFixed(2)}
              </p>
              <div className="mt-4 space-y-2">
                {[
                  { label: "Rank", value: `#${p.rank}` },
                  { label: "Votes", value: p.votes },
                  { label: "Category", value: p.category },
                ].map((item, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{item.label}</span>
                    <span className="font-medium">{item.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="grid gap-4">
            {[
              { feature: "Wireless", products: [true, false, true] },
              { feature: "RGB Lighting", products: [true, true, false] },
              { feature: "Software Support", products: [true, true, true] },
              { feature: "On-board Memory", products: [true, false, false] },
            ].map((row, index) => (
              <div key={index} className="grid grid-cols-4 items-center gap-4">
                <span className="text-sm font-medium">{row.feature}</span>
                {row.products.map((hasFeature, i) => (
                  <div key={i} className="flex justify-center">
                    {hasFeature ? (
                      <Check className="h-4 w-4 text-primary" />
                    ) : (
                      <Minus className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}