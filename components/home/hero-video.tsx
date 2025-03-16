"use client"

import { useEffect, useRef } from "react"

interface HeroVideoProps {
  onLoaded: () => void
}

export function HeroVideo({ onLoaded }: HeroVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(() => {
        // Fallback for browsers that block autoplay
        console.log("Autoplay blocked")
      })
    }
  }, [])

  return (
    <div className="relative h-[70vh] w-full overflow-hidden">
      <video
        ref={videoRef}
        className="absolute inset-0 h-full w-full object-cover"
        autoPlay
        muted
        loop
        playsInline
        onCanPlay={onLoaded}
        poster="/video-poster.jpg"
      >
        <source src="/hero-video.mp4" type="video/mp4" />
        {/* Fallback content */}
        <div className="absolute inset-0 flex items-center justify-center bg-black">
          <p className="text-white">Your browser does not support video playback.</p>
        </div>
      </video>
    </div>
  )
}