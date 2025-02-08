"use client"

import { useState } from "react"
import Image from "next/image"
import { Product } from "@/types"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { Maximize2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogTitle,
} from "@/components/ui/dialog"

interface ProductGalleryProps {
  product: Product
}

export function ProductGallery({ product }: ProductGalleryProps) {
  const [selectedImage, setSelectedImage] = useState(0)
  
  // Mock multiple product images
  const images = [
    product.imageUrl,
    product.imageUrl.replace("random", "random/1"),
    product.imageUrl.replace("random", "random/2"),
    product.imageUrl.replace("random", "random/3")
  ]

  return (
    <div className="space-y-4">
      <Dialog>
        <DialogTrigger asChild>
          <Card className="group relative aspect-square w-full max-w-[500px] cursor-zoom-in overflow-hidden">
            <Image
              src={images[selectedImage]}
              alt={product.name}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              priority
            />
            <div className="absolute right-4 top-4">
              <Maximize2 className="h-5 w-5 opacity-50 transition-opacity group-hover:opacity-100" />
            </div>
          </Card>
        </DialogTrigger>
        <DialogContent className="max-w-3xl">
          <DialogTitle className="sr-only">
            {product.name} - Image {selectedImage + 1}
          </DialogTitle>
          <div className="relative aspect-square">
            <Image
              src={images[selectedImage]}
              alt={product.name}
              fill
              className="object-contain"
              priority
            />
          </div>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-4 gap-4">
        {images.map((image, index) => (
          <Card
            key={index}
            className={cn(
              "relative aspect-square cursor-pointer overflow-hidden transition-all hover:ring-2 hover:ring-primary",
              selectedImage === index && "ring-2 ring-primary"
            )}
            onClick={() => setSelectedImage(index)}
          >
            <Image
              src={image}
              alt={`${product.name} view ${index + 1}`}
              fill
              className="object-cover"
            />
          </Card>
        ))}
      </div>
    </div>
  )
}