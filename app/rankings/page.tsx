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

        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold">Top Ranked Products</h1>
          
          {/* Category Tabs */}
          <div className="flex gap-1">
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "ghost"}
                onClick={() => setSelectedCategory(category.id)}
                className="px-3 h-9"
                size="sm"
              >
                {category.name}
              </Button>
            ))}
          </div>
        </div>

        {/* Rankings */}
        <RankingList categoryId={selectedCategory} />
      </div>
    </MainLayout>
  )
}