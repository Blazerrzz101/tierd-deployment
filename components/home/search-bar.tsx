"use client"

import { useState, useEffect, useRef } from "react"
import { Search, Loader2, ArrowRight, Tag, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { motion, useScroll, useTransform } from "framer-motion"
import { useRouter } from "next/navigation"
import { products } from "@/lib/data"
import Image from "next/image"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { 
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from "@/components/ui/command"
import { Badge } from "@/components/ui/badge"
import { createProductUrl } from "@/utils/product-utils"
import { getEnhancedProductImage } from "@/utils/enhanced-images"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { categories } from "@/lib/data"

// Direct URL to a placeholder image
const PLACEHOLDER_IMAGE = "https://placehold.co/400x400/1a1a1a/ff4b26?text=No+Image"

interface Product {
  id: string
  name: string
  category: string
  url_slug?: string
  price?: number
  description?: string
}

export function SearchBar() {
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [suggestions, setSuggestions] = useState<Product[]>([])
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [categorySuggestions, setCategorySuggestions] = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const { scrollY } = useScroll()

  // Transform for background opacity
  const backgroundOpacity = useTransform(
    scrollY,
    [0, 100, 200],
    [0.6, 0.8, 0.95]
  )

  // Load recent searches from localStorage on component mount
  useEffect(() => {
    const storedSearches = localStorage.getItem('recentSearches')
    if (storedSearches) {
      try {
        setRecentSearches(JSON.parse(storedSearches).slice(0, 5))
      } catch (e) {
        console.error('Error parsing recent searches:', e)
      }
    }
  }, [])

  // Save recent searches to localStorage
  const saveRecentSearch = (query: string) => {
    if (!query.trim()) return
    
    const updatedSearches = [
      query,
      ...recentSearches.filter(item => item !== query)
    ].slice(0, 5)
    
    setRecentSearches(updatedSearches)
    localStorage.setItem('recentSearches', JSON.stringify(updatedSearches))
  }

  // Filter products based on search query
  const filteredProducts = searchQuery.trim()
    ? products
        .filter(product => 
          product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          product.description?.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .slice(0, 6)
    : []

  // Find suggested categories based on search
  useEffect(() => {
    if (searchQuery.trim()) {
      const matchedCategories = Array.from(new Set(
        products
          .filter(product => 
            product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            product.description?.toLowerCase().includes(searchQuery.toLowerCase())
          )
          .map(product => product.category)
      )).slice(0, 3)
      
      setCategorySuggestions(matchedCategories)
    } else {
      setCategorySuggestions([])
    }
  }, [searchQuery])

  // Toggle search dialog with keyboard shortcut
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }
    
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  // Fetch suggestions when query changes
  useEffect(() => {
    if (!searchQuery) {
      setSuggestions([])
      setIsLoading(false)
      return
    }
    
    const fetchResults = async () => {
      setIsLoading(true)
      try {
        // In a real app, this would be a network request to your API
        // Here we're using mock data for demonstration
        
        // Simulate API call timing
        await new Promise(resolve => setTimeout(resolve, 300))
        
        const results = products
          .filter(product => 
            product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            product.description?.toLowerCase().includes(searchQuery.toLowerCase())
          )
          .slice(0, 8)
        
        setSuggestions(results)
      } catch (error) {
        console.error("Error fetching search results:", error)
        setSuggestions([])
      } finally {
        setIsLoading(false)
      }
    }
    
    const timer = setTimeout(() => {
      fetchResults()
    }, 300)
    
    return () => clearTimeout(timer)
  }, [searchQuery])

  const handleSelect = (product: Product) => {
    setOpen(false)
    const productUrl = createProductUrl(product)
    saveRecentSearch(product.name)
    router.push(productUrl)
  }
  
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!searchQuery.trim()) return
    
    saveRecentSearch(searchQuery)
    router.push(`/products?search=${encodeURIComponent(searchQuery)}`)
    setOpen(false)
  }
  
  const handleCategorySelect = (category: string) => {
    router.push(`/products?category=${category}`)
    setOpen(false)
  }

  return (
    <>
    <motion.div
        className="fixed top-0 left-0 right-0 z-50 mx-auto max-w-2xl px-4 py-3"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
      }}
    >
      <motion.div
          className="absolute inset-0 rounded-xl bg-black backdrop-blur-md"
        style={{ opacity: backgroundOpacity }}
      />
      
      <div className="relative search-container">
          <form onSubmit={handleSearchSubmit} className="relative w-full max-w-lg mx-auto">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/50" />
              <Input
                ref={inputRef}
                type="search"
                placeholder="Search for products, brands, or categories..."
                className="w-full bg-background/20 text-white placeholder:text-white/60 pl-10 pr-12 rounded-full border-primary/20 h-12 font-medium hover:border-primary/40 focus-visible:ring-primary transition-colors"
                onClick={() => setOpen(true)}
                onFocus={() => setOpen(true)}
            value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <kbd className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 hidden h-6 select-none items-center gap-1 rounded border border-white/10 bg-white/5 px-2 font-mono text-xs text-white/60 sm:flex">
                <span className="text-xs">⌘</span>K
              </kbd>
            </div>
        </form>

          <CommandDialog open={open} onOpenChange={setOpen} className="max-w-2xl mx-auto">
            <div className="flex items-center border-b px-3">
              <Search className="mr-2 h-4 w-4 text-muted-foreground shrink-0" />
              <CommandInput 
                placeholder="Search for anything..." 
                value={searchQuery}
                onValueChange={setSearchQuery}
                className="border-0 focus:ring-0 sm:text-base"
              />
            </div>
            <CommandList className="py-2">
              {isLoading && (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="w-6 h-6 text-primary animate-spin" />
                </div>
              )}
              
              {!isLoading && !searchQuery && recentSearches.length > 0 && (
                <CommandGroup heading="Recent Searches" className="mb-2">
                  {recentSearches.map((query, index) => (
                    <CommandItem 
                      key={`recent-${index}`}
                      onSelect={() => {
                        setSearchQuery(query)
                        router.push(`/products?search=${encodeURIComponent(query)}`)
                        setOpen(false)
                      }}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center">
                        <Search className="mr-2 h-4 w-4 text-muted-foreground" />
                        <span>{query}</span>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
              
              {!isLoading && !searchQuery && (
                <CommandGroup heading="Browse Categories" className="mb-2">
                  {categories.slice(0, 5).map((category) => (
                    <CommandItem
                      key={category.id}
                      onSelect={() => handleCategorySelect(category.id)}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center">
                        <Tag className="mr-2 h-4 w-4 text-muted-foreground" />
                        <span>{category.name}</span>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
              
              {!isLoading && searchQuery && suggestions.length === 0 && (
                <CommandEmpty className="py-6 text-center text-sm">
                  <div className="mx-auto mb-2 rounded-full bg-muted/30 p-3 w-12 h-12 flex items-center justify-center">
                    <Search className="h-6 w-6 text-muted-foreground/50" />
                  </div>
                  <p className="mb-2 text-base font-medium">No results found</p>
                  <p className="text-muted-foreground">
                    Try searching for products, categories, or brands
                  </p>
                </CommandEmpty>
              )}
              
              {!isLoading && searchQuery && categorySuggestions.length > 0 && (
                <CommandGroup heading="Categories" className="mb-2">
                  {categorySuggestions.map((category) => {
                    const matchingCategory = categories.find(c => c.id === category)
                    if (!matchingCategory) return null
                    
                    return (
                      <CommandItem
                        key={`cat-${category}`}
                        onSelect={() => handleCategorySelect(category)}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center">
                          <Tag className="mr-2 h-4 w-4 text-primary" />
                          <span>{matchingCategory.name}</span>
                        </div>
                        <Badge variant="outline" className="pointer-events-none">
                          Category
                        </Badge>
                      </CommandItem>
                    )
                  })}
                </CommandGroup>
              )}
              
              {!isLoading && suggestions.length > 0 && (
                <CommandGroup heading="Products">
                  {suggestions.map((product) => (
                    <CommandItem
                    key={product.id}
                      value={product.id}
                      onSelect={() => handleSelect(product)}
                      className="py-2"
                    >
                      <div className="flex items-center w-full">
                        <div className="w-12 h-12 mr-3 flex-shrink-0 rounded-md overflow-hidden border relative">
                      <Image
                            src={getEnhancedProductImage(product.name, product.category) || PLACEHOLDER_IMAGE}
                        alt={product.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{product.name}</div>
                          
                          <div className="flex items-center mt-1">
                            <Badge variant="outline" className="text-xs mr-2 capitalize">
                              {product.category.replace(/-/g, ' ')}
                            </Badge>
                            {product.price && (
                              <span className="text-sm font-medium text-primary">
                                ${product.price}
                              </span>
                            )}
                          </div>
                    </div>
                      </div>
                    </CommandItem>
                  ))}
                  
                  {searchQuery && suggestions.length > 0 && (
                    <>
                      <CommandSeparator />
                      <CommandItem
                        onSelect={() => {
                          router.push(`/products?search=${encodeURIComponent(searchQuery)}`)
                          setOpen(false)
                          saveRecentSearch(searchQuery)
                        }}
                        className="justify-center text-primary"
                      >
                        <span>View all results</span>
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </CommandItem>
                    </>
                  )}
                </CommandGroup>
              )}
            </CommandList>
            
            <div className="border-t px-3 py-2 text-xs text-muted-foreground">
              <div className="flex gap-2">
                <kbd className="rounded border px-1.5 py-0.5 bg-muted">↑↓</kbd>
                <span>to navigate</span>
                <kbd className="rounded border px-1.5 py-0.5 bg-muted">Enter</kbd>
                <span>to select</span>
                <kbd className="rounded border px-1.5 py-0.5 bg-muted">Esc</kbd>
                <span>to close</span>
              </div>
              </div>
          </CommandDialog>
      </div>
    </motion.div>
    </>
  )
} 