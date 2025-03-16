"use client"

import { useState } from "react"
import { MainLayout } from "@/components/home/main-layout"
import { SearchBar } from "@/components/search/search-bar"
import { categories } from "@/lib/data"
import { Button } from "@/components/ui/button"
import { RankingList } from "@/components/rankings/ranking-list"
import { CATEGORY_IDS } from "@/lib/constants"

type CategoryId = typeof CATEGORY_IDS[keyof typeof CATEGORY_IDS]

export default function RankingsPage() {
  const [selectedCategory, setSelectedCategory] = useState<CategoryId | "all">("all")
  const [searchQuery, setSearchQuery] = useState("")

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  return (
    <MainLayout>
      <div className="py-8 w-full">
        {/* Search Bar */}
        <div className="mb-8">
          <SearchBar onSearch={handleSearch} />
        </div>

        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold">Top Ranked Products</h1>
          
          {/* Category Tabs */}
          <div className="flex gap-1">
            <Button
              variant={selectedCategory === "all" ? "default" : "ghost"}
              onClick={() => setSelectedCategory("all")}
              className="px-3 h-9"
              size="sm"
            >
              All
            </Button>
            {Object.entries(CATEGORY_IDS).map(([key, value]) => (
              <Button
                key={key}
                variant={selectedCategory === value ? "default" : "ghost"}
                onClick={() => setSelectedCategory(value)}
                className="px-3 h-9"
                size="sm"
              >
                {value.replace('Gaming ', '')}
              </Button>
            ))}
          </div>
        </div>

        {/* Rankings */}
        <RankingList selectedCategory={selectedCategory} searchQuery={searchQuery} />
      </div>
    </MainLayout>
  )
}