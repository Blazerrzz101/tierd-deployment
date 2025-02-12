"use client"

import { useState, useEffect, useRef, KeyboardEvent } from "react"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { motion, AnimatePresence } from "framer-motion"
import { useDebounce } from "@/app/hooks/use-debounce"
import { supabase } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { fuzzySearch, highlightMatches } from "@/lib/search/fuzzy-search"
import { categories } from "@/lib/data"
import { Badge } from "@/components/ui/badge"
import { Filter } from "lucide-react"

interface SearchSuggestion {
  id: string
  name: string
  category: string
  votes: number
  highlight?: {
    start: number
    end: number
  }
}

export function SearchBar() {
  const [query, setQuery] = useState("")
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([])
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [isLoading, setIsLoading] = useState(false)
  const debouncedQuery = useDebounce(query, 300)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  // Fetch and process suggestions
  useEffect(() => {
    async function fetchSuggestions() {
      if (!debouncedQuery.trim()) {
        setSuggestions([])
        return
      }

      setIsLoading(true)
      try {
        const { data, error } = await supabase
          .from('products')
          .select('id, name, category, votes')
          .order('votes', { ascending: false })
          .limit(5)

        if (error) throw error

        setSuggestions(data.map(item => ({
          ...item,
          highlight: {
            start: item.name.toLowerCase().indexOf(debouncedQuery.toLowerCase()),
            end: item.name.toLowerCase().indexOf(debouncedQuery.toLowerCase()) + debouncedQuery.length
          }
        })))
      } catch (error) {
        console.error('Error fetching suggestions:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchSuggestions()
  }, [debouncedQuery])

  // Toggle category filter
  const toggleCategory = (categoryId: string) => {
    setSelectedCategories(prev => {
      const isSelected = prev.includes(categoryId)
      if (isSelected) {
        return prev.filter(id => id !== categoryId)
      } else {
        return [...prev, categoryId]
      }
    })
  }

  // Enhanced text highlighting using fuzzy match
  const HighlightedText = ({ text }: { text: string }) => {
    const parts = highlightMatches(text, debouncedQuery)
    
    return (
      <>
        {parts.map((part, i) => (
          <span
            key={i}
            className={part.isMatch ? "bg-[#ff4b26]/20 text-[#ff4b26] px-1 rounded" : ""}
          >
            {part.text}
          </span>
        ))}
      </>
    )
  }

  // Keyboard navigation
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!suggestions.length) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1)
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0) {
          const selected = suggestions[selectedIndex]
          router.push(`/products/${selected.id}`)
        }
        break
      case 'Escape':
        e.preventDefault()
        setSelectedIndex(-1)
        inputRef.current?.blur()
        break
    }
  }

  return (
    <div className="relative w-full">
      <div className="relative">
        <Input
          ref={inputRef}
          type="text"
          placeholder="Search for gaming gear..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-full pl-10 pr-4 py-3 bg-black/50 backdrop-blur-sm border border-white/10 
                     rounded-lg focus:border-[#ff4b26]/50 focus:ring-2 focus:ring-[#ff4b26]/20
                     transition-colors duration-300"
        />
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-white/50" />
        
        {isLoading && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 border-2 border-[#ff4b26] border-t-transparent rounded-full animate-spin" />
        )}
      </div>

      {/* Category filters */}
      <div className="mt-2 flex flex-wrap gap-2">
        {categories.map(category => (
          <Badge
            key={category.id}
            variant="outline"
            className={`cursor-pointer transition-all duration-300 ${
              selectedCategories.includes(category.id)
                ? "bg-[#ff4b26]/20 text-[#ff4b26] border-[#ff4b26]"
                : "hover:bg-white/5"
            }`}
            onClick={() => toggleCategory(category.id)}
          >
            <Filter className={`mr-1 h-3 w-3 transition-colors duration-300 ${
              selectedCategories.includes(category.id)
                ? "text-[#ff4b26]"
                : "text-white/50"
            }`} />
            {category.name}
          </Badge>
        ))}
      </div>

      {suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-black/90 backdrop-blur-lg rounded-xl border border-white/10 overflow-hidden shadow-xl">
          {suggestions.map((suggestion, index) => (
            <button
              key={suggestion.id}
              onClick={() => router.push(`/products/${suggestion.id}`)}
              className={`w-full px-4 py-3 flex items-center gap-4 transition-colors
                        ${index === selectedIndex ? 'bg-white/10' : 'hover:bg-white/5'}`}
            >
              <div className="flex-1 text-left">
                <div className="font-medium text-white">
                  {suggestion.name}
                </div>
                <div className="text-sm text-white/50">
                  {suggestion.category} · {suggestion.votes} votes
                </div>
              </div>
              <Search className={`h-4 w-4 ${index === selectedIndex ? 'text-[#ff4b26]' : 'text-white/50'}`} />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}