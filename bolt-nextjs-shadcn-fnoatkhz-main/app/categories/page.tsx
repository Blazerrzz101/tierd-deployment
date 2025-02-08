"use client"

import { useState, useEffect } from "react"
import { categories, products } from "@/lib/data"
import { ProductCard } from "@/components/rankings/product-card"
import { Search } from "@/components/search"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

// Get unique brands from products
const brands = Array.from(new Set(products.map(p => p.name.split(' ')[0])))

export default function CategoriesPage() {
  // State management
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 500])
  const [maxPrice, setMaxPrice] = useState(500)
  const [sortBy, setSortBy] = useState<"rank" | "price-asc" | "price-desc" | "votes">("rank")
  const [displayCount, setDisplayCount] = useState(12)
  const [isLoading, setIsLoading] = useState(true)

  // Calculate dynamic price range on mount
  useEffect(() => {
    try {
      const prices = products.map(p => p.price)
      const max = Math.ceil(Math.max(...prices) / 100) * 100 // Round up to nearest hundred
      setMaxPrice(max)
      setPriceRange([0, max])
      setIsLoading(false)
    } catch (error) {
      console.error('Error calculating price range:', error)
      toast.error("Failed to load price range")
      setIsLoading(false)
    }
  }, [])

  // Filter and sort products
  const filteredProducts = products
    .filter(product => {
      const matchesCategory = !selectedCategory || product.category === selectedCategory
      const matchesBrand = !selectedBrand || product.name.toLowerCase().startsWith(selectedBrand.toLowerCase())
      const matchesSearch = searchQuery === "" || 
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesPrice = product.price >= priceRange[0] && product.price <= priceRange[1]
      return matchesCategory && matchesBrand && matchesSearch && matchesPrice
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "rank": return a.rank - b.rank
        case "price-asc": return a.price - b.price
        case "price-desc": return b.price - a.price
        case "votes": return b.votes - a.votes
        default: return 0
      }
    })

  const displayedProducts = filteredProducts.slice(0, displayCount)
  const hasMore = displayCount < filteredProducts.length

  // Reset filters
  const resetFilters = () => {
    setSelectedCategory(null)
    setSelectedBrand(null)
    setSearchQuery("")
    setPriceRange([0, maxPrice])
    setSortBy("rank")
  }

  return (
    <div className="container py-8">
      {/* Search and Categories Section */}
      <div className="mx-auto mb-8 flex max-w-2xl flex-col items-center space-y-6">
        <div className="w-full">
          <Search
            onSearch={setSearchQuery}
            className="w-full"
            placeholder="Search products..."
          />
        </div>

        {/* Centered Category Tabs */}
        <div className="flex flex-wrap justify-center gap-2">
          <Button
            variant={selectedCategory === null ? "default" : "outline"}
            onClick={() => setSelectedCategory(null)}
            className="min-w-[100px] rounded-full"
          >
            All
          </Button>
          {categories.map((category) => (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? "default" : "outline"}
              onClick={() => setSelectedCategory(category.id)}
              className="min-w-[100px] rounded-full"
            >
              {category.name}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[240px,1fr]">
        {/* Filters Sidebar */}
        <Card className="h-fit">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Filters</CardTitle>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={resetFilters}
              className="text-sm text-muted-foreground hover:text-primary"
            >
              Reset
            </Button>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Brand Filter */}
            <div className="space-y-2">
              <h3 className="font-medium">Brand</h3>
              <Select value={selectedBrand || ""} onValueChange={setSelectedBrand}>
                <SelectTrigger>
                  <SelectValue placeholder="All Brands" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Brands</SelectItem>
                  {brands.map((brand) => (
                    <SelectItem key={brand} value={brand}>
                      {brand}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Price Range */}
            <div className="space-y-2">
              <h3 className="font-medium">Price Range</h3>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Slider
                      min={0}
                      max={maxPrice}
                      step={10}
                      value={priceRange}
                      onValueChange={setPriceRange}
                      className="py-4"
                      disabled={isLoading}
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    ${priceRange[0]} - ${priceRange[1]}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <div className="flex items-center justify-between text-sm">
                <span>${priceRange[0]}</span>
                <span>${priceRange[1]}</span>
              </div>
            </div>

            {/* Sort By */}
            <div className="space-y-2">
              <h3 className="font-medium">Sort By</h3>
              <Select value={sortBy} onValueChange={(value) => setSortBy(value as typeof sortBy)}>
                <SelectTrigger>
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rank">Best Ranked</SelectItem>
                  <SelectItem value="votes">Most Voted</SelectItem>
                  <SelectItem value="price-asc">Price: Low to High</SelectItem>
                  <SelectItem value="price-desc">Price: High to Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Products Grid */}
        <div className="space-y-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              <p className="mt-4 text-sm text-muted-foreground">Loading products...</p>
            </div>
          ) : displayedProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-lg font-medium">No products found</p>
              <p className="text-sm text-muted-foreground">
                Try adjusting your search or filter criteria
              </p>
              <Button 
                variant="outline" 
                onClick={resetFilters}
                className="mt-4"
              >
                Reset Filters
              </Button>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Showing {displayedProducts.length} of {filteredProducts.length} products
                </p>
              </div>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {displayedProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              {hasMore && (
                <Button
                  variant="outline"
                  className="mt-8 w-full"
                  onClick={() => setDisplayCount(prev => prev + 12)}
                >
                  Show More
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}