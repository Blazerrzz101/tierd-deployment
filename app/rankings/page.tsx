"use client"

import { useState } from "react"
import { MainLayout } from "@/components/home/main-layout"
import { SearchBar } from "@/components/search/search-bar"
import { categories } from "@/lib/data"
import { Button } from "@/components/ui/button"
import { RankingList } from "@/components/rankings/ranking-list"

export default function RankingsPage() {
  const [selectedCategory, setSelectedCategory] = useState(categories[0].id)

  return (
    <MainLayout>
      <div className="py-8 w-full">
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
    </MainLayout>
  )
}