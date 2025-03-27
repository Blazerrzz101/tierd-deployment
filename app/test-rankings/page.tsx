"use client"

import { useEffect, useState } from 'react'
import { categories } from '@/lib/data'
import { getEnhancedProductImage } from '@/utils/enhanced-images'
import { getProductAffiliateLinkAndImage } from '@/utils/affiliate-utils'
import { RankingList } from '@/components/rankings/ranking-list'
import { CategoryFilter } from '@/components/rankings/category-filter'
import { Button } from '@/components/ui/button'
import { LayoutGrid, Rows } from 'lucide-react'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'

export default function TestRankingsPage() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [sortOption, setSortOption] = useState("votes")
  const [selectedCategory, setSelectedCategory] = useState("all")
  
  // Test enhanced images functionality
  const testProducts = [
    'Logitech G502 X Plus',
    'Razer Viper V2 Pro',
    'Samsung Odyssey G7',
    'Nonexistent Product'
  ];
  
  // Track test results
  const [enhancedImageResults, setEnhancedImageResults] = useState<Record<string, string | undefined>>({})
  const [affiliateLinkResults, setAffiliateLinkResults] = useState<Record<string, any>>({})
  
  useEffect(() => {
    // Test enhanced images
    const imageResults: Record<string, string | undefined> = {}
    testProducts.forEach(product => {
      imageResults[product] = getEnhancedProductImage(product)
    })
    setEnhancedImageResults(imageResults)
    
    // Test affiliate links
    const linkResults: Record<string, any> = {}
    testProducts.forEach(product => {
      linkResults[product] = getProductAffiliateLinkAndImage(product)
    })
    setAffiliateLinkResults(linkResults)
  }, [])
  
  return (
    <div className="container py-8 space-y-12">
      <div>
        <h1 className="text-3xl font-bold mb-6">Rankings Components Test</h1>
        <p className="text-muted-foreground">
          This page tests the functionality of the rankings components, including
          the RankingList and CategoryFilter components, as well as the affiliate
          link and enhanced image utilities.
        </p>
      </div>
      
      {/* Test Section for Enhanced Images */}
      <div className="border p-6 rounded-lg bg-card">
        <h2 className="text-xl font-bold mb-4">Enhanced Images Test</h2>
        <div className="space-y-3">
          {testProducts.map(product => (
            <div key={product} className="flex items-center gap-3">
              <span className="font-medium min-w-40">{product}:</span>
              {enhancedImageResults[product] ? (
                <div className="flex items-center gap-2">
                  <span className="text-green-500">✓ Found</span>
                  <img 
                    src={enhancedImageResults[product]} 
                    alt={product} 
                    className="h-12 w-12 object-contain bg-black/10 rounded-md"
                  />
                  <code className="text-xs bg-muted px-2 py-1 rounded">
                    {enhancedImageResults[product]}
                  </code>
                </div>
              ) : (
                <span className="text-red-500">✗ Not found</span>
              )}
            </div>
          ))}
        </div>
      </div>
      
      {/* Test Section for Affiliate Links */}
      <div className="border p-6 rounded-lg bg-card">
        <h2 className="text-xl font-bold mb-4">Affiliate Links Test</h2>
        <div className="space-y-3">
          {testProducts.map(product => (
            <div key={product} className="flex items-start gap-3">
              <span className="font-medium min-w-40">{product}:</span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">Affiliate link:</span>
                  {affiliateLinkResults[product]?.affiliateLink ? (
                    <div className="flex items-center gap-2">
                      <span className="text-green-500">✓ Found</span>
                      <a 
                        href={affiliateLinkResults[product]?.affiliateLink} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:underline text-sm"
                      >
                        Open link
                      </a>
                    </div>
                  ) : (
                    <span className="text-red-500">✗ Not found</span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="font-medium">Best Buy image:</span>
                  {affiliateLinkResults[product]?.bestBuyImage ? (
                    <div className="flex items-center gap-2">
                      <span className="text-green-500">✓ Found</span>
                      <img 
                        src={affiliateLinkResults[product]?.bestBuyImage} 
                        alt={product} 
                        className="h-12 w-12 object-contain bg-black/10 rounded-md"
                      />
                    </div>
                  ) : (
                    <span className="text-red-500">✗ Not found</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Test for CategoryFilter Component */}
      <div className="border p-6 rounded-lg bg-card">
        <h2 className="text-xl font-bold mb-4">CategoryFilter Component Test</h2>
        <p className="mb-4 text-muted-foreground">Selected category: <strong>{selectedCategory}</strong></p>
        <CategoryFilter 
          selectedCategory={selectedCategory}
          onCategoryChange={(category) => setSelectedCategory(category)}
        />
      </div>
      
      {/* Test for View Mode Controls */}
      <div className="border p-6 rounded-lg bg-card">
        <h2 className="text-xl font-bold mb-4">View Mode & Sort Test</h2>
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-2">
            <Label htmlFor="view-mode" className="whitespace-nowrap">View Mode:</Label>
            <div className="flex border rounded-md">
              <Button 
                variant={viewMode === "grid" ? "default" : "ghost"} 
                size="icon" 
                className="h-8 w-8 rounded-none rounded-l-md"
                onClick={() => setViewMode("grid")}
              >
                <LayoutGrid className="h-4 w-4" />
                <span className="sr-only">Grid view</span>
              </Button>
              <Button 
                variant={viewMode === "list" ? "default" : "ghost"} 
                size="icon" 
                className="h-8 w-8 rounded-none rounded-r-md"
                onClick={() => setViewMode("list")}
              >
                <Rows className="h-4 w-4" />
                <span className="sr-only">List view</span>
              </Button>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Label htmlFor="sort-by" className="whitespace-nowrap">Sort by:</Label>
            <Select value={sortOption} onValueChange={setSortOption}>
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
        </div>
        
        <div className="mt-6">
          <p className="text-muted-foreground mb-4">
            The RankingList below should change based on the view mode and sort option.
          </p>
          
          <div className="p-2 border rounded-lg">
            <RankingList 
              category={selectedCategory} 
              viewMode={viewMode}
              sortOption={sortOption}
            />
          </div>
        </div>
      </div>
    </div>
  )
} 