"use client"

import { useState, useEffect } from "react"
import { Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { motion, useScroll, useTransform } from "framer-motion"
import { useRouter } from "next/navigation"

export function SearchBar() {
  const [searchQuery, setSearchQuery] = useState("")
  const [isSticky, setIsSticky] = useState(false)
  const router = useRouter()
  const { scrollY } = useScroll()

  // Transform for background opacity
  const backgroundOpacity = useTransform(
    scrollY,
    [0, 100, 200],
    [0, 0.5, 0.95]
  )

  // Effect to handle sticky state
  useEffect(() => {
    const handleScroll = () => {
      setIsSticky(window.scrollY > 100)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/rankings?search=${encodeURIComponent(searchQuery.trim())}`)
    }
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
      
      <form onSubmit={handleSearch} className="relative flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 shadow-lg">
        <Search className="h-5 w-5 text-muted-foreground" />
        <input 
          type="text" 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
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
    </motion.div>
  )
} 