"use client"

import Image from "next/image"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { getPlaceholderImage } from "@/lib/constants"
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
  
  // Get appropriate placeholder image based on category
  const getAppropriateImage = () => {
    if (!category) return "/images/products/placeholder.svg";
    
    // Map category to placeholder image
    const categoryMap: Record<string, string> = {
      "mice": "/images/products/placeholder-mouse.svg",
      "gaming-mice": "/images/products/placeholder-mouse.svg",
      "keyboards": "/images/products/placeholder-keyboard.svg",
      "gaming-keyboards": "/images/products/placeholder-keyboard.svg",
      "headsets": "/images/products/placeholder-headset.svg",
      "gaming-headsets": "/images/products/placeholder-headset.svg",
      "headphones": "/images/products/placeholder-headset.svg",
      "monitors": "/images/products/placeholder-monitor.svg",
      "gaming-monitors": "/images/products/placeholder-monitor.svg",
    };
    
    return categoryMap[category.toLowerCase()] || "/images/products/placeholder.svg";
  };
  
  // Use placeholder from constants as fallback, but prefer the SVG files
  const placeholderImage = error || !src ? getAppropriateImage() : src;
  
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
        src={placeholderImage}
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
        onError={() => setError(true)}
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