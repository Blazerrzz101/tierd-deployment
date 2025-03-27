"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Product } from "@/utils/product-utils"
import { createProductUrl } from "@/utils/product-utils"
import { 
  Command, 
  CommandDialog, 
  CommandEmpty, 
  CommandGroup, 
  CommandInput, 
  CommandItem, 
  CommandList
} from "@/components/ui/command"
import { 
  Search, 
  ArrowRight, 
  Zap, 
  Keyboard, 
  MousePointer, 
  X,
  Monitor,
  Headphones,
  ChevronRight,
  Tag
} from "lucide-react"
import { useDebounce } from "@/hooks/use-debounce"
import { cn } from "@/lib/utils"
import { mockProducts } from "@/utils/product-utils"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"

type CategoryIcon = {
  [key: string]: React.ReactNode
}

const categoryIcons: CategoryIcon = {
  'keyboards': <Keyboard className="h-4 w-4" />,
  'mice': <MousePointer className="h-4 w-4" />,
  'gaming-mice': <MousePointer className="h-4 w-4" />,
  'monitors': <Monitor className="h-4 w-4" />,
  'headsets': <Headphones className="h-4 w-4" />
}

interface SearchBarProps {
  variant?: 'default' | 'hero' | 'minimal'
  placeholder?: string
  showRecentSearches?: boolean
  autoFocus?: boolean
  className?: string
}

export function SearchBar({ 
  variant = 'default', 
  placeholder = 'Search for products...', 
  showRecentSearches = true,
  autoFocus = false,
  className
}: SearchBarProps) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [suggestions, setSuggestions] = useState<Product[]>([])
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const [isInputFocused, setIsInputFocused] = useState(false)
  const debouncedQuery = useDebounce(query, 300)

  // Load recent searches from localStorage on component mount
  useEffect(() => {
    const savedSearches = localStorage.getItem("recentSearches")
    if (savedSearches) {
      try {
        setRecentSearches(JSON.parse(savedSearches))
      } catch (e) {
        console.error("Failed to parse recent searches:", e)
      }
    }
  }, [])

  // Set autofocus if enabled
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus()
      }, 100)
    }
  }, [autoFocus])

  // Search for products matching the query
  useEffect(() => {
    if (debouncedQuery.length > 1) {
      const normalizedQuery = debouncedQuery.toLowerCase().trim();
      
      // More inclusive search that prioritizes name matches but includes category and description
      const searchResults = mockProducts.filter(product => {
        // Check if product and required properties exist
        if (!product || !product.name) return false;
        
        const nameMatch = product.name.toLowerCase().includes(normalizedQuery);
        const brandMatch = product.brand?.toLowerCase().includes(normalizedQuery) || false;
        const modelMatch = product.model?.toLowerCase().includes(normalizedQuery) || false;
        const categoryMatch = product.category?.toLowerCase().includes(normalizedQuery) || false;
        const descriptionMatch = product.description?.toLowerCase().includes(normalizedQuery) || false;
        
        // Prioritize name, brand, and model matches
        if (nameMatch || brandMatch || modelMatch) return true;
        
        // Include category and description matches as fallback
        return categoryMatch || descriptionMatch;
      }).slice(0, 8); // Show more results
      
      setSuggestions(searchResults);
    } else {
      setSuggestions([]);
    }
  }, [debouncedQuery]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        setOpen(true)
      }
    }
    
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  // Save search to recent searches
  const saveSearch = (searchTerm: string) => {
    const updatedSearches = [
      searchTerm,
      ...recentSearches.filter(s => s !== searchTerm)
    ].slice(0, 5)
    
    setRecentSearches(updatedSearches)
    localStorage.setItem("recentSearches", JSON.stringify(updatedSearches))
  }

  // Handle search submission
  const handleSearch = () => {
    if (query.trim()) {
      saveSearch(query)
      router.push(`/search?q=${encodeURIComponent(query)}`)
      setOpen(false)
    }
  }

  // Handle product selection
  const handleSelectProduct = (product: Product) => {
    if (!product) return;
    
    saveSearch(product.name);
    
    // Ensure we're creating a proper URL using our utility
    const productUrl = createProductUrl(product);
    router.push(productUrl);
    
    setOpen(false);
    setQuery("");
  };

  // Handle recent search selection
  const handleSelectRecentSearch = (search: string) => {
    setQuery(search)
    saveSearch(search)
    router.push(`/search?q=${encodeURIComponent(search)}`)
    setOpen(false)
  }

  // Clear search query
  const clearSearch = () => {
    setQuery("")
    inputRef.current?.focus()
  }

  return (
    <>
      {variant === 'default' && (
        <div className={cn(
          "relative group", 
          className
        )}>
          <div className={cn(
            "flex h-10 items-center rounded-full border bg-background px-3 py-2 text-sm ring-offset-background focus-within:ring-1 focus-within:ring-primary focus-within:ring-offset-2",
            isInputFocused && "ring-1 ring-primary ring-offset-2"
          )}>
            <Search className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
            <Input
              ref={inputRef}
              type="search"
              placeholder={placeholder}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              onFocus={() => setIsInputFocused(true)}
              onBlur={() => setIsInputFocused(false)}
              className="h-8 flex-1 bg-transparent border-0 focus-visible:outline-none focus-visible:ring-0 p-0 placeholder:text-muted-foreground"
            />
            {query && (
              <Button
                variant="ghost"
                size="icon"
                onClick={clearSearch}
                className="h-8 w-8 p-0 hover:bg-transparent"
              >
                <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                <span className="sr-only">Clear search</span>
              </Button>
            )}
            <div className="mx-1 h-4 w-px bg-muted-foreground/30"></div>
            <kbd className="bg-muted text-muted-foreground hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border px-1.5 text-[10px] font-medium opacity-100">
              <span className="text-xs">⌘</span>K
            </kbd>
          </div>
          
          <AnimatePresence>
            {(isInputFocused || query) && suggestions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.15 }}
                className="absolute left-0 right-0 top-full mt-2 rounded-lg border bg-background p-2 shadow-lg z-10"
              >
                <div className="py-1.5 px-2 text-xs font-medium text-muted-foreground">
                  Suggestions
                </div>
                <div className="max-h-72 overflow-auto">
                  {suggestions.map((product) => (
                    <div 
                      key={product.id}
                      onClick={() => handleSelectProduct(product)}
                      className="flex items-center gap-3 rounded-md p-2 text-sm cursor-pointer hover:bg-accent"
                    >
                      <div className="h-10 w-10 rounded-md overflow-hidden bg-muted relative flex-shrink-0">
                        <Image 
                          src={product.imageUrl || product.image_url || "/images/product-placeholder.png"} 
                          alt={product.name}
                          fill
                          className="object-cover"
                          sizes="40px"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{product.name}</p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {product.category?.replace('-', ' ')}
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {variant === 'hero' && (
        <div className={cn(
          "relative group w-full max-w-xl mx-auto", 
          className
        )}>
          <div className={cn(
            "flex h-14 items-center rounded-2xl border bg-background/80 backdrop-blur-lg px-4 py-3 text-base ring-offset-background focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 shadow-xl",
            isInputFocused && "ring-2 ring-primary ring-offset-2"
          )}>
            <Search className="mr-3 h-5 w-5 shrink-0 text-muted-foreground" />
            <Input
              ref={inputRef}
              type="search"
              placeholder={placeholder}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              onFocus={() => setIsInputFocused(true)}
              onBlur={() => setIsInputFocused(false)}
              className="h-9 flex-1 bg-transparent border-0 focus-visible:outline-none focus-visible:ring-0 p-0 text-base placeholder:text-muted-foreground"
            />
            {query && (
              <Button
                variant="ghost"
                size="icon"
                onClick={clearSearch}
                className="h-9 w-9 p-0 hover:bg-transparent"
              >
                <X className="h-5 w-5 text-muted-foreground hover:text-foreground" />
                <span className="sr-only">Clear search</span>
              </Button>
            )}
            <Button 
              variant="default" 
              size="icon" 
              onClick={handleSearch}
              className="ml-2 h-9 w-9 rounded-xl bg-primary text-primary-foreground"
            >
              <ArrowRight className="h-5 w-5" />
              <span className="sr-only">Search</span>
            </Button>
          </div>
          
          <AnimatePresence>
            {(isInputFocused || query) && (suggestions.length > 0 || (showRecentSearches && recentSearches.length > 0)) && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.2 }}
                className="absolute left-0 right-0 top-full mt-2 rounded-xl border bg-background/95 backdrop-blur-md p-3 shadow-2xl z-10"
              >
                {suggestions.length > 0 && (
                  <>
                    <div className="py-1.5 px-2 text-sm font-medium text-muted-foreground flex items-center">
                      <Zap className="h-3.5 w-3.5 mr-1.5 text-primary" />
                      Quick Results
                    </div>
                    <div className="max-h-80 overflow-auto">
                      {suggestions.map((product) => (
                        <div 
                          key={product.id}
                          onClick={() => handleSelectProduct(product)}
                          className="flex items-center gap-3 rounded-lg p-2.5 text-sm cursor-pointer hover:bg-accent transition-colors"
                        >
                          <div className="h-12 w-12 rounded-lg overflow-hidden bg-muted relative flex-shrink-0 border">
                            <Image 
                              src={product.imageUrl || product.image_url || "/images/product-placeholder.png"} 
                              alt={product.name}
                              fill
                              className="object-cover"
                              sizes="48px"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{product.name}</p>
                            <div className="flex items-center mt-1">
                              <div className="flex items-center text-xs text-muted-foreground capitalize mr-2">
                                {categoryIcons[product.category || ''] || <Tag className="h-3 w-3 mr-1" />}
                                <span className="ml-1">{product.category?.replace('-', ' ')}</span>
                              </div>
                              {product.rating && (
                                <div className="flex items-center text-xs">
                                  <span className="text-yellow-400">★</span>
                                  <span className="ml-0.5 text-muted-foreground">{product.rating.toFixed(1)}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        </div>
                      ))}
                    </div>
                  </>
                )}
                
                {showRecentSearches && recentSearches.length > 0 && (
                  <div className="mt-2 pt-2 border-t">
                    <div className="py-1.5 px-2 text-sm font-medium text-muted-foreground">
                      Recent Searches
                    </div>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {recentSearches.map((search, index) => (
                        <div 
                          key={index} 
                          onClick={() => handleSelectRecentSearch(search)}
                          className="px-3 py-1.5 bg-muted rounded-md text-sm cursor-pointer hover:bg-accent transition-colors flex items-center"
                        >
                          <Search className="h-3 w-3 mr-1.5 text-muted-foreground" />
                          {search}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {variant === 'minimal' && (
        <Button 
          variant="outline" 
          onClick={() => setOpen(true)} 
          className={cn(
            "justify-start text-sm text-muted-foreground w-full max-w-sm md:pr-12",
            className
          )}
        >
          <Search className="mr-2 h-4 w-4" />
          <span>{placeholder}</span>
          <kbd className="pointer-events-none ml-auto hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
            <span className="text-xs">⌘</span>K
          </kbd>
        </Button>
      )}

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput 
          placeholder={placeholder} 
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          {suggestions.length > 0 && (
            <CommandGroup heading="Suggestions">
              {suggestions.map((product) => (
                <CommandItem
                  key={product.id}
                  onSelect={() => handleSelectProduct(product)}
                  className="flex items-center gap-2"
                >
                  <div className="h-8 w-8 rounded overflow-hidden bg-muted relative flex-shrink-0">
                    <Image 
                      src={product.imageUrl || product.image_url || "/images/product-placeholder.png"} 
                      alt={product.name}
                      fill
                      className="object-cover"
                      sizes="32px"
                    />
                  </div>
                  <div>
                    {product.name}
                    <p className="text-xs text-muted-foreground capitalize">
                      {product.category?.replace('-', ' ')}
                    </p>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
          {showRecentSearches && recentSearches.length > 0 && (
            <CommandGroup heading="Recent Searches">
              {recentSearches.map((search, index) => (
                <CommandItem 
                  key={index}
                  onSelect={() => handleSelectRecentSearch(search)}
                >
                  <Search className="mr-2 h-4 w-4" />
                  {search}
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </>
  )
} 