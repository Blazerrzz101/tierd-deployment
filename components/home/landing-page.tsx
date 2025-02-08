"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { SearchBar } from "@/components/search/search-bar"
import { RankingList } from "@/components/rankings/ranking-list"
import { categories } from "@/lib/data"
import { Button } from "@/components/ui/button"
import { AboutSection } from "@/components/home/about-section"

const taglines = [
  "Ranked by Gamers",
  "Ranked by Pros", 
  "Ranked by Streamers",
  "Ranked by YOU"
]

export function LandingPage() {
  const [currentTagline, setCurrentTagline] = useState(0)
  const [selectedCategory, setSelectedCategory] = useState(categories[0].id)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTagline((prev) => (prev + 1) % taglines.length)
    }, 2000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="flex min-h-screen flex-col">
      {/* Hero Section */}
      <div className="relative flex min-h-[600px] items-center justify-center">
        <div className="relative z-10 container mx-auto px-4">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-auto max-w-4xl text-center"
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
              className="mx-auto mt-6 max-w-2xl text-lg text-gray-300"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              Join our community to discover, rank, and discuss the best gaming gear
            </motion.p>

            <motion.div 
              className="mx-auto mt-8 max-w-2xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <SearchBar />
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Content Sections */}
      <div className="flex-1">
        <div className="container mx-auto px-4 py-16">
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "outline"}
                onClick={() => setSelectedCategory(category.id)}
                className="min-w-[100px]"
              >
                {category.name}
              </Button>
            ))}
          </div>

          <RankingList categoryId={selectedCategory} />
        </div>

        <AboutSection />
      </div>
    </div>
  )
}