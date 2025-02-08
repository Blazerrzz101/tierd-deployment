"use client"

import Link from "next/link"
import { Product } from "@/types"
import { Button } from "@/components/ui/button"
import { ChevronLeft } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface ProductHeaderProps {
  product: Product
}

export function ProductHeader({ product }: ProductHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/rankings" className="text-muted-foreground hover:text-foreground">
              <ChevronLeft className="mr-1 h-4 w-4" />
              Back to Rankings
            </Link>
          </Button>
          <Badge variant="outline">Rank #{product.rank}</Badge>
        </div>
        <h1 className="text-3xl font-bold">{product.name}</h1>
      </div>
      <div className="text-right">
        <div className="text-2xl font-bold">${product.price.toFixed(2)}</div>
        <div className="text-sm text-muted-foreground">{product.votes} community votes</div>
      </div>
    </div>
  )
}