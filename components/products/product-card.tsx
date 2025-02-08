"use client"

import Image from "next/image"
import Link from "next/link"
import { Product } from "@/types"
import { Card, CardHeader, CardContent } from "@/components/ui/card"
import { AspectRatio } from "@/components/ui/aspect-ratio"

interface ProductCardProps {
  product: Product
}

export function ProductCard({ product }: ProductCardProps) {
  return (
    <Card className="group relative overflow-hidden">
      <Link
        href={`/products/${product.url_slug}`}
        className="block"
      >
        <CardHeader className="border-b p-0">
          <AspectRatio ratio={4/3}>
            <Image
              src={product.imageUrl || '/placeholder.png'}
              alt={product.name}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              priority
            />
          </AspectRatio>
        </CardHeader>
        <CardContent className="p-4">
          <h3 className="font-semibold text-lg mb-2">{product.name}</h3>
          <p className="text-sm text-gray-600 line-clamp-2">{product.description}</p>
          {product.ranking && (
            <div className="mt-2 text-sm font-medium text-blue-600">
              Rank #{product.ranking}
            </div>
          )}
        </CardContent>
      </Link>
    </Card>
  )
} 