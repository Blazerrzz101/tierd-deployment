"use client"

import Image from "next/image"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { ImageIcon } from "lucide-react"

interface ProductImageProps {
  src?: string | null
  alt: string
  category?: string
  width?: number
  height?: number
  fill?: boolean
  sizes?: string
  priority?: boolean
  className?: string
  containerClassName?: string
  showPlaceholderIcon?: boolean
}

// Default placeholder image
const DEFAULT_PLACEHOLDER = "/images/placeholder.png"

// Get placeholder image based on category
function getPlaceholderImage(category?: string): string {
  if (!category) return DEFAULT_PLACEHOLDER
  
  // Try category-specific placeholder
  const categoryPlaceholder = `/images/products/${category.toLowerCase()}.png`
  
  // Return the category placeholder or default
  return categoryPlaceholder
}

export function ProductImage({
  src,
  alt,
  category,
  width = 300,
  height = 300,
  fill = false,
  sizes,
  priority = false,
  className,
  containerClassName,
  showPlaceholderIcon = true,
}: ProductImageProps) {
  const [error, setError] = useState(false)
  const [loaded, setLoaded] = useState(false)
  
  // Get placeholder image based on category or use default
  const placeholderImage = getPlaceholderImage(category)
  
  // Use placeholder if src is missing or there was an error loading the image
  const imageSource = error || !src || src === "" ? placeholderImage : src
  
  return (
    <div className={cn(
      "relative bg-muted overflow-hidden",
      fill ? "w-full h-full" : "w-fit h-fit",
      !fill && "flex items-center justify-center",
      containerClassName
    )}
    style={fill ? { aspectRatio: "1/1" } : undefined}
    >
      {/* Main Image */}
      <Image
        src={imageSource}
        alt={alt}
        width={!fill ? width : undefined}
        height={!fill ? height : undefined}
        fill={fill}
        sizes={sizes}
        priority={priority}
        className={cn(
          "object-cover transition-all duration-300",
          !loaded && "scale-110 blur-sm",
          loaded && "scale-100 blur-0",
          className
        )}
        onError={() => {
          console.log(`Image error for: ${src}, using placeholder: ${placeholderImage}`)
          setError(true)
        }}
        onLoad={() => setLoaded(true)}
      />
      
      {/* Loading/Error State */}
      {(!loaded || error) && showPlaceholderIcon && (
        <div className="absolute inset-0 flex items-center justify-center">
          <ImageIcon className="h-1/4 w-1/4 text-muted-foreground/50" />
        </div>
      )}
    </div>
  )
} 