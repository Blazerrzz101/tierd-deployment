```tsx
"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"

const taglines = [
  "Ranked by Gamers",
  "Ranked by Pros",
  "Ranked by Streamers",
  "Ranked by YOU"
]

export function DynamicTagline() {
  const [currentTagline, setCurrentTagline] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTagline((prev) => (prev + 1) % taglines.length)
    }, 2000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="space-y-4">
      <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl">
        Gaming Gear
        <br />
        <AnimatePresence mode="wait">
          <motion.span
            key={currentTagline}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            className="bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 bg-clip-text text-transparent"
          >
            {taglines[currentTagline]}
          </motion.span>
        </AnimatePresence>
      </h1>
      <p className="mx-auto max-w-2xl text-lg text-gray-300">
        Join the community to discover, rank, and discuss the best gaming gear
      </p>
    </div>
  )
}
```