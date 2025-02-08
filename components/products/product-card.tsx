"use client"

import Link from "next/link"
import { Product } from "@/types/product"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { VoteButtons } from "./vote-buttons"
import { formatPrice } from "@/lib/utils"

interface ProductCardProps {
  product: Product
}

export function ProductCard({ product }: ProductCardProps) {
  return (
    <Card className="flex flex-col overflow-hidden">
      <Link href={`/products/${product.url_slug}`}>
        <CardHeader className="p-0">
          <div className="aspect-square overflow-hidden">
            <img
              src={product.imageUrl || "/placeholder.png"}
              alt={product.name}
              className="h-full w-full object-cover transition-transform hover:scale-105"
            />
          </div>
        </CardHeader>
        <CardContent className="grid gap-2.5 p-4">
          <h3 className="line-clamp-1 text-lg font-semibold">{product.name}</h3>
          <p className="line-clamp-2 text-sm text-muted-foreground">
            {product.description}
          </p>
          <p className="text-sm font-semibold">{formatPrice(product.price)}</p>
        </CardContent>
      </Link>
      <CardFooter className="p-4 pt-0">
        <VoteButtons product={product} />
      </CardFooter>
    </Card>
  )
} 