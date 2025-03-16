"use client"

import { useState } from "react"
import { Product } from "@/types/product"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { ZoomIn } from "lucide-react"
import { ProductImage } from "@/components/ui/product-image"
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog"

interface ProductGalleryProps {
  product: Product
}

export function ProductGallery({ product }: ProductGalleryProps) {
  const [selectedImage, setSelectedImage] = useState(0)
  
  // Generate additional images based on category
  const images = [
    product.image_url,
    `/images/products/${product.category}/detail-1.jpg`,
    `/images/products/${product.category}/detail-2.jpg`,
    `/images/products/${product.category}/detail-3.jpg`,
  ].filter(Boolean) // Filter out any undefined/null values

  return (
    <div className="space-y-4">
      <Dialog>
        <DialogTrigger asChild>
          <Card className="relative aspect-square overflow-hidden cursor-zoom-in group">
            <ProductImage
              src={images[selectedImage]}
              alt={product.name}
              category={product.category}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              priority
              className="object-cover transition-transform group-hover:scale-105"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
              <ZoomIn className="h-8 w-8 text-white" />
            </div>
          </Card>
        </DialogTrigger>
        <DialogContent className="max-w-3xl">
          <div className="relative aspect-square">
            <ProductImage
              src={images[selectedImage]}
              alt={product.name}
              category={product.category}
              fill
              sizes="100vw"
              priority
              className="object-contain"
            />
          </div>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-4 gap-4">
        {images.map((image, index) => (
          <Card
            key={index}
            className={cn(
              "relative aspect-square overflow-hidden cursor-pointer transition-all",
              selectedImage === index && "ring-2 ring-primary"
            )}
            onClick={() => setSelectedImage(index)}
          >
            <ProductImage
              src={image}
              alt={`${product.name} - View ${index + 1}`}
              category={product.category}
              fill
              sizes="(max-width: 768px) 25vw, 15vw"
              className="object-cover"
            />
          </Card>
        ))}
      </div>
    </div>
  )
}