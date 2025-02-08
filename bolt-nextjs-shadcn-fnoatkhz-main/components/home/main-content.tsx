"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { MainLayout } from "@/components/home/main-layout"
import { SearchBar } from "@/components/search/search-bar"
import { RankingList } from "@/components/rankings/ranking-list"
import { categories } from "@/lib/data"
import { Button } from "@/components/ui/button"

export function MainContent() {
  const [selectedCategory, setSelectedCategory] = useState(categories[0].id)

  return (
    <MainLayout>
      <div className="container flex-1 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-8"
        >
          {/* Search Bar */}
          <div>
            <SearchBar />
          </div>

          {/* Category Buttons */}
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

          {/* Rankings */}
          <RankingList categoryId={selectedCategory} />
        </motion.div>
      </div>
    </MainLayout>
  )
}