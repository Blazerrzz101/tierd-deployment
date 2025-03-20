"use client"

import React, { useState } from "react"
import { ImageOff } from "lucide-react"
import { cn } from "@/lib/utils"
import { getSafeImageUrl, TRANSPARENT_PLACEHOLDER } from "@/lib/utils/image-fallback"

interface SafeImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'onError' | 'onLoad'> {
  fallback?: string
  category?: string
  showPlaceholder?: boolean
}

export function SafeImage({
  src,
  alt = "Image",
  className,
  fallback,
  category,
  showPlaceholder = true,
  ...props
}: SafeImageProps) {
  const [error, setError] = useState(false)
  const [loaded, setLoaded] = useState(false)
  
  const safeImageUrl = getSafeImageUrl(src, fallback)
  
  const handleError = () => {
    if (!error) {
      console.warn(`Image failed to load: ${src}`)
      setError(true)
    }
  }
  
  return (
    <div className={cn("relative overflow-hidden", className)}>
      {/* Actual Image */}
      {!error && (
        <img
          src={safeImageUrl}
          alt={alt}
          className={cn(
            "transition-opacity duration-300",
            loaded ? "opacity-100" : "opacity-0"
          )}
          onLoad={() => setLoaded(true)}
          onError={handleError}
          {...props}
        />
      )}
      
      {/* Placeholder shown during loading or on error */}
      {((!loaded && !error) || (error && showPlaceholder)) && (
        <div
          className="absolute inset-0 flex items-center justify-center bg-muted/30"
          aria-hidden="true"
        >
          <ImageOff className="h-6 w-6 text-muted-foreground/50" />
        </div>
      )}
      
      {/* Hidden image for layout preservation */}
      {error && !showPlaceholder && (
        <img
          src={TRANSPARENT_PLACEHOLDER}
          alt=""
          className="invisible"
          aria-hidden="true"
          width={props.width}
          height={props.height}
        />
      )}
    </div>
  )
} 