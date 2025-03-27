"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Metadata } from "next"
import { SearchBar } from "@/components/search-bar"
import { RankingList } from "@/components/rankings/ranking-list"
import { CategoryTabs } from "@/components/rankings/category-tabs"
import { categories } from "@/lib/data"
import { PageHeader } from "@/components/page-header"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { ArrowUpDown, Filter, Grid3X3, ListFilter, LayoutGrid, Rows, SlidersHorizontal } from "lucide-react"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { Toaster } from "@/components/ui/toaster"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { CategoryFilter } from "@/components/rankings/category-filter"
import Image from "next/image"
import Link from "next/link"

export default function RankingsPage() {
  const searchParams = useSearchParams()
  const categoryParam = searchParams.get("category")
  const [selectedCategory, setSelectedCategory] = useState(categoryParam || "all")
  const [isLoading, setIsLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)
  const [sortOption, setSortOption] = useState("rank")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")

  useEffect(() => {
    // Simulate loading state for better UX
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 800)
    
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (categoryParam) {
      setSelectedCategory(categoryParam)
    }
  }, [categoryParam])

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category)
    setIsLoading(true)
    setTimeout(() => setIsLoading(false), 500) // Add a small loading delay for better UX
  }

  const handleSortChange = (value: string) => {
    setSortOption(value)
  }

  const handleViewModeChange = (mode: "grid" | "list") => {
    setViewMode(mode)
  }

  const toggleFilters = () => {
    setShowFilters(!showFilters)
  }

  return (
    <div className="container max-w-7xl pb-16">
      {/* Hero section with search */}
      <div className="relative w-full mb-12 -mt-8 bg-gradient-to-b from-primary/10 to-transparent pt-16 pb-12 rounded-b-3xl overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/30 to-secondary/30"></div>
        <div className="absolute -top-[400px] -left-[300px] w-[800px] h-[800px] rounded-full bg-primary/5 blur-3xl"></div>
        <div className="absolute -top-[350px] -right-[200px] w-[700px] h-[700px] rounded-full bg-secondary/5 blur-3xl"></div>
        
        <div className="container relative z-10">
          <div className="max-w-2xl mx-auto text-center mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold mb-4">
              Product Rankings
            </h1>
            <p className="text-muted-foreground text-lg">
              Discover the best gaming peripherals ranked by the community
            </p>
          </div>
          
          <SearchBar 
            variant="hero" 
            placeholder="Search for keyboards, mice, monitors..." 
            autoFocus={false}
          />
          
          <div className="mt-8">
            <ScrollArea className="w-full max-w-5xl mx-auto">
              <div className="flex items-center space-x-2 pb-4">
                {[{id: "all", name: "All Products"}, ...categories].map((category) => (
                  <Button
                    key={category.id}
                    variant={selectedCategory === category.id ? "default" : "outline"}
                    className="flex items-center gap-2 rounded-full px-4 py-2"
                    onClick={() => handleCategoryChange(category.id)}
                  >
                    {category.id !== "all" && (
                      <span className="relative flex h-2 w-2">
                        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${selectedCategory === category.id ? 'bg-primary-foreground/80' : 'bg-primary/30'} opacity-75`}></span>
                        <span className={`relative inline-flex rounded-full h-2 w-2 ${selectedCategory === category.id ? 'bg-primary-foreground' : 'bg-primary/50'}`}></span>
                      </span>
                    )}
                    {category.name}
                  </Button>
                ))}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </div>
        </div>
      </div>
      
      {/* Main content */}
      <div className="grid grid-cols-1 gap-6">
        {/* Filters and Sort Controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sticky top-0 bg-background/80 backdrop-blur-lg z-10 py-3 px-1 border-b">
          <div className="flex flex-wrap items-center gap-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <SlidersHorizontal className="h-4 w-4" />
                  Filters
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Filter Products</DialogTitle>
                  <DialogDescription>
                    Narrow down the product list by using filters
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <CategoryFilter 
                    selectedCategory={selectedCategory} 
                    onCategoryChange={handleCategoryChange}
                  />
                  
                  <div className="grid gap-2">
                    <Label htmlFor="price-range">Price Range</Label>
                    <div className="flex items-center gap-4">
                      <div className="grid flex-1 gap-2">
                        <Label htmlFor="min-price" className="text-xs">Min</Label>
                        <Select>
                          <SelectTrigger id="min-price">
                            <SelectValue placeholder="No minimum" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0">$0</SelectItem>
                            <SelectItem value="50">$50</SelectItem>
                            <SelectItem value="100">$100</SelectItem>
                            <SelectItem value="200">$200</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid flex-1 gap-2">
                        <Label htmlFor="max-price" className="text-xs">Max</Label>
                        <Select>
                          <SelectTrigger id="max-price">
                            <SelectValue placeholder="No maximum" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="100">$100</SelectItem>
                            <SelectItem value="200">$200</SelectItem>
                            <SelectItem value="500">$500</SelectItem>
                            <SelectItem value="1000">$1000+</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="rating">Minimum Rating</Label>
                    <Select>
                      <SelectTrigger id="rating">
                        <SelectValue placeholder="Any rating" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="3">3+ stars</SelectItem>
                        <SelectItem value="4">4+ stars</SelectItem>
                        <SelectItem value="4.5">4.5+ stars</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex justify-between">
                  <Button variant="outline">Reset Filters</Button>
                  <Button>Apply Filters</Button>
                </div>
              </DialogContent>
            </Dialog>
            
            <div className="hidden sm:flex border-l h-8 mx-2"></div>
            
            <p className="text-sm text-muted-foreground">
              Showing:
              <span className="font-medium text-foreground ml-1 capitalize">
                {selectedCategory === "all" 
                  ? "All Products" 
                  : categories.find(cat => cat.id === selectedCategory)?.name || selectedCategory}
              </span>
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Label htmlFor="sort-by" className="text-sm whitespace-nowrap">Sort by:</Label>
              <Select value={sortOption} onValueChange={handleSortChange}>
                <SelectTrigger id="sort-by" className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rank">Rank</SelectItem>
                  <SelectItem value="rating">Highest Rated</SelectItem>
                  <SelectItem value="votes">Most Votes</SelectItem>
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="hidden sm:flex items-center gap-1 border rounded-md">
              <Button 
                variant={viewMode === "grid" ? "default" : "ghost"} 
                size="icon" 
                className="h-8 w-8 rounded-none rounded-l-md"
                onClick={() => handleViewModeChange("grid")}
              >
                <LayoutGrid className="h-4 w-4" />
                <span className="sr-only">Grid view</span>
              </Button>
              <Button 
                variant={viewMode === "list" ? "default" : "ghost"} 
                size="icon" 
                className="h-8 w-8 rounded-none rounded-r-md"
                onClick={() => handleViewModeChange("list")}
              >
                <Rows className="h-4 w-4" />
                <span className="sr-only">List view</span>
              </Button>
            </div>
          </div>
        </div>
        
        {/* Rankings list */}
        <RankingList 
          category={selectedCategory} 
          isLoading={isLoading} 
          viewMode={viewMode}
          sortOption={sortOption}
        />
      </div>
      <Toaster />
    </div>
  )
}