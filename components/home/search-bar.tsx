"use client"

import { useState, useEffect, useRef } from "react"
import { Search } from "lucide-react"
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
} from "@/components/ui/command"
import { Badge } from "@/components/ui/badge"
import { createProductUrl } from "@/utils/product-utils"

// Direct URL to a placeholder image
const PLACEHOLDER_IMAGE = "https://placehold.co/400x400/1a1a1a/ff4b26?text=No+Image"

interface Product {
  id: string
  name: string
  category: string
  url_slug?: string
}

export function SearchBar() {
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [suggestions, setSuggestions] = useState<Product[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const { scrollY } = useScroll()

  // Transform for background opacity
  const backgroundOpacity = useTransform(
    scrollY,
    [0, 100, 200],
    [0, 0.5, 0.95]
  )

  // Filter products based on search query
  const filteredProducts = searchQuery.trim()
    ? products
        .filter(product => 
          product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          product.description?.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .slice(0, 5)
    : []

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
      return
    }
    
    const fetchResults = async () => {
      try {
        // Simulating API call with mock data
        // In a real app, you would fetch from your API
        const mockResults = [
          { id: "1", name: "Gaming Keyboard XR7", category: "keyboards" },
          { id: "2", name: "Ultra Precision Mouse", category: "mice" },
          { id: "3", name: "4K Gaming Monitor 32\"", category: "monitors" },
          { id: "4", name: "RGB Keyboard PRO", category: "keyboards" },
          { id: "5", name: "Wireless Gaming Mouse", category: "mice" },
        ].filter(item => 
          item.name.toLowerCase().includes(searchQuery.toLowerCase())
        ).slice(0, 5)
        
        // Delay to simulate network request
        setTimeout(() => {
          setSuggestions(mockResults)
        }, 200)
      } catch (error) {
        console.error("Error fetching search results:", error)
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
    router.push(productUrl)
  }

  return (
    <>
      <motion.div
        className={`fixed top-0 left-0 right-0 z-50 mx-auto max-w-2xl px-4 py-4 transition-all duration-200 ${
          scrollY > 100 ? 'translate-y-0' : 'translate-y-4'
        }`}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 50,
        }}
      >
        <motion.div
          className="absolute inset-0 rounded-xl bg-black/80 backdrop-blur-lg"
          style={{ opacity: backgroundOpacity }}
        />
        
        <div className="relative search-container">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              ref={inputRef}
              type="search"
              placeholder="Search products..."
              className="w-full pl-8 rounded-full bg-background"
              onClick={() => setOpen(true)}
              onFocus={() => setOpen(true)}
            />
            <kbd className="pointer-events-none absolute right-3 top-2 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-xs text-muted-foreground opacity-100 sm:flex">
              <span className="text-xs">⌘</span>K
            </kbd>
          </div>
          
          <CommandDialog open={open} onOpenChange={setOpen}>
            <CommandInput 
              placeholder="Search products..." 
              value={searchQuery}
              onValueChange={setSearchQuery}
            />
            <CommandList>
              <CommandEmpty>No results found.</CommandEmpty>
              {suggestions.length > 0 && (
                <CommandGroup heading="Products">
                  {suggestions.map((product) => {
                    // Use createProductUrl to get a valid URL
                    const productUrl = createProductUrl(product)
                    
                    return (
                      <CommandItem
                        key={product.id}
                        value={product.name}
                        onSelect={() => handleSelect(product)}
                      >
                        <Link
                          href={productUrl}
                          className="flex items-center justify-between w-full"
                          onClick={(e) => {
                            e.stopPropagation() // Prevent the command item onSelect
                          }}
                        >
                          <span>{product.name}</span>
                          <Badge variant="outline" className="ml-2">
                            {product.category}
                          </Badge>
                        </Link>
                      </CommandItem>
                    )
                  })}
                </CommandGroup>
              )}
            </CommandList>
          </CommandDialog>
        </div>
      </motion.div>
    </>
  )
} 