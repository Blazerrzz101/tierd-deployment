"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { SearchBar } from "@/components/search/search-bar"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

const taglines = [
  "Ranked by Gamers",
  "Ranked by Pros",
  "Ranked by Streamers",
  "Ranked by YOU"
]

export function HeroSection() {
  const [currentTagline, setCurrentTagline] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTagline((prev) => (prev + 1) % taglines.length)
    }, 2000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="relative min-h-[80vh] bg-black">
      <div className="container relative z-10 flex min-h-[80vh] flex-col items-center justify-center px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl"
        >
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

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mx-auto mt-6 max-w-2xl text-lg text-gray-300"
          >
            Join our community to discover, rank, and discuss the best gaming gear
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-8 flex flex-col items-center gap-4"
          >
            <SearchBar />
            <Button size="lg" className="bg-primary text-white hover:bg-primary/90">
              Explore Rankings
              <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}