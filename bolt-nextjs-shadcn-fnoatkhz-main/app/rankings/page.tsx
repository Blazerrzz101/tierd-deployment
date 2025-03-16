"use client"

import { useState } from "react"
import { SearchBar } from "@/components/search/search-bar"
import { categories } from "@/lib/data"
import { Button } from "@/components/ui/button"
import { RankingList } from "@/components/rankings/ranking-list"

export default function RankingsPage() {
  const [selectedCategory, setSelectedCategory] = useState(categories[0].id)

  return (
    <div className="container py-8">
      {/* Search Bar */}
      <div className="mb-8">
        <SearchBar />
      </div>

      {/* Category Buttons */}
      <div className="mb-8 flex flex-wrap gap-2">
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
    </div>
  )
}