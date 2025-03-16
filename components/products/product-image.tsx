"use client"

import Image from "next/image"
import { Product } from "@/types"
import { Card } from "@/components/ui/card"
import { Maximize2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog"

interface ProductImageProps {
  product: Product
}

export function ProductImage({ product }: ProductImageProps) {
  return (
    <Card className="group relative aspect-square overflow-hidden">
      <Image
        src={product.imageUrl}
        alt={product.name}
        fill
        className="object-cover"
        priority
      />
      <Dialog>
        <DialogTrigger asChild>
          <button className="absolute right-4 top-4 rounded-full bg-background/80 p-2 opacity-0 transition-opacity group-hover:opacity-100">
            <Maximize2 className="h-4 w-4" />
          </button>
        </DialogTrigger>
        <DialogContent className="max-w-3xl">
          <div className="relative aspect-square">
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              className="object-contain"
              priority
            />
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  )
}