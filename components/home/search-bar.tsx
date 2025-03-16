"use client"

import { useState, useEffect } from "react"
import { Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { motion, useScroll, useTransform } from "framer-motion"
import { useRouter } from "next/navigation"
import { products } from "@/lib/data"
import Image from "next/image"
import Link from "next/link"
import { cn } from "@/lib/utils"

// Direct URL to a placeholder image
const PLACEHOLDER_IMAGE = "https://placehold.co/400x400/1a1a1a/ff4b26?text=No+Image"

export function SearchBar() {
  const [searchQuery, setSearchQuery] = useState("")
  const [isSticky, setIsSticky] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
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

  // Effect to handle sticky state
  useEffect(() => {
    const handleScroll = () => {
      setIsSticky(window.scrollY > 100)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Effect to handle click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest('.search-container')) {
        setShowDropdown(false)
      }
    }

    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/rankings?search=${encodeURIComponent(searchQuery.trim())}`)
      setShowDropdown(false)
    }
  }

  const handleInputClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setShowDropdown(true)
  }

  return (
    <motion.div
      className={`fixed top-0 left-0 right-0 z-50 mx-auto max-w-2xl px-4 py-4 transition-all duration-200 ${
        isSticky ? 'translate-y-0' : 'translate-y-4'
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
        <form onSubmit={handleSearch} className="relative flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 shadow-lg">
          <Search className="h-5 w-5 text-muted-foreground" />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setShowDropdown(true)
            }}
            onClick={handleInputClick}
            placeholder="Find the best gaming mouse, keyboard, etc."
            className="flex-1 bg-transparent px-2 py-1 text-sm placeholder:text-muted-foreground focus:outline-none"
          />
          <Button 
            type="submit"
            size="sm"
            className="relative h-8 bg-gradient-to-r from-blue-600 to-blue-700 px-4 text-sm font-medium text-white hover:from-blue-700 hover:to-blue-800"
          >
            Search
          </Button>
        </form>

        {/* Dropdown Results */}
        {showDropdown && searchQuery.trim() && (
          <div 
            className="absolute top-full left-0 right-0 mt-2 max-h-[400px] overflow-auto rounded-lg border border-border bg-card/95 p-2 shadow-xl backdrop-blur-sm"
          >
            {filteredProducts.length > 0 ? (
              <div className="space-y-2">
                {filteredProducts.map((product) => (
                  <Link 
                    key={product.id}
                    href={`/products/${product.url_slug || product.id}`}
                    className="flex items-center gap-2 p-2 hover:bg-accent rounded-md"
                    onClick={() => setShowDropdown(false)}
                  >
                    <div className="relative h-12 w-12 overflow-hidden rounded-md bg-muted">
                      <Image
                        src={product.image_url || PLACEHOLDER_IMAGE}
                        alt={product.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium">{product.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {product.category.replace(/-/g, ' ')} • Rank #{product.rank || 'N/A'}
                      </p>
                    </div>
                    {product.rank && product.rank <= 3 && (
                      <div className={cn(
                        "rounded-full px-2 py-1 text-xs font-medium",
                        product.rank === 1 && "bg-yellow-500/20 text-yellow-500",
                        product.rank === 2 && "bg-gray-400/20 text-gray-400",
                        product.rank === 3 && "bg-orange-700/20 text-orange-700",
                      )}>
                        #{product.rank}
                      </div>
                    )}
                  </Link>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-sm text-muted-foreground">
                No products found
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  )
} 