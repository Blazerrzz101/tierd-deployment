"use client"

import { useState, useEffect, useRef, KeyboardEvent } from "react"
import { Search, Filter, X, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { motion, AnimatePresence } from "framer-motion"
import { useDebounce } from "@/app/hooks/use-debounce"
import { supabase } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { fuzzySearch, highlightMatches } from "@/lib/search/fuzzy-search"
import { CATEGORY_IDS } from "@/lib/constants"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

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

interface SearchBarProps {
  onSearch?: (query: string) => void;
}

export function SearchBar({ onSearch }: SearchBarProps) {
  const [query, setQuery] = useState("")
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([])
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [isLoading, setIsLoading] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const debouncedQuery = useDebounce(query, 300)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  // Notify parent component of search changes
  useEffect(() => {
    if (onSearch) {
      onSearch(debouncedQuery);
    }
  }, [debouncedQuery, onSearch]);

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
          .textSearch('name', debouncedQuery)
          .order('votes', { ascending: false })
          .limit(5)

        if (error) throw error

        const filteredData = selectedCategories.length > 0
          ? data.filter(item => selectedCategories.includes(item.category))
          : data

        setSuggestions(filteredData.map(item => ({
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
  }, [debouncedQuery, selectedCategories])

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

  // Clear search
  const clearSearch = () => {
    setQuery("")
    setSuggestions([])
    setSelectedIndex(-1)
    inputRef.current?.focus()
  }

  // Enhanced text highlighting
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
        clearSearch()
        break
    }
  }

  return (
    <div className="relative w-full">
      <motion.div 
        className={cn(
          "relative rounded-lg transition-all duration-200",
          isFocused && "ring-2 ring-[#ff4b26]/20"
        )}
        animate={{ scale: isFocused ? 1.01 : 1 }}
        transition={{ duration: 0.2 }}
      >
        <Input
          ref={inputRef}
          type="text"
          placeholder="Search for gaming gear..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className="w-full pl-10 pr-12 py-3 bg-black/50 backdrop-blur-sm border border-white/10 
                     rounded-lg focus:border-[#ff4b26]/50 focus:ring-2 focus:ring-[#ff4b26]/20
                     transition-all duration-300"
        />
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-white/50" />
        
        <AnimatePresence>
          {query && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={clearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full 
                       hover:bg-white/10 transition-colors"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 text-white/50 animate-spin" />
              ) : (
                <X className="h-4 w-4 text-white/50" />
              )}
            </motion.button>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Category filters */}
      <motion.div 
        className="mt-3 flex flex-wrap gap-2"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        {Object.values(CATEGORY_IDS).map(category => (
          <motion.div
            key={category}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Badge
              variant="outline"
              className={cn(
                "cursor-pointer transition-all duration-300",
                selectedCategories.includes(category)
                  ? "bg-[#ff4b26]/20 text-[#ff4b26] border-[#ff4b26]"
                  : "hover:bg-white/5"
              )}
              onClick={() => toggleCategory(category)}
            >
              <Filter className={cn(
                "mr-1 h-3 w-3 transition-colors duration-300",
                selectedCategories.includes(category)
                  ? "text-[#ff4b26]"
                  : "text-white/50"
              )} />
              {category.replace('Gaming ', '')}
            </Badge>
          </motion.div>
        ))}
      </motion.div>

      {/* Suggestions dropdown */}
      <AnimatePresence>
        {suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-2 bg-black/90 backdrop-blur-lg 
                     rounded-xl border border-white/10 overflow-hidden shadow-xl z-50"
          >
            {suggestions.map((suggestion, index) => (
              <motion.button
                key={suggestion.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => router.push(`/products/${suggestion.id}`)}
                className={cn(
                  "w-full px-4 py-3 flex items-center gap-4 transition-colors",
                  index === selectedIndex ? 'bg-white/10' : 'hover:bg-white/5'
                )}
              >
                <div className="flex-1 text-left">
                  <div className="font-medium text-white">
                    <HighlightedText text={suggestion.name} />
                  </div>
                  <div className="text-sm text-white/50">
                    {suggestion.category.replace('Gaming ', '')} · {suggestion.votes} votes
                  </div>
                </div>
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Search className={cn(
                    "h-4 w-4",
                    index === selectedIndex ? 'text-[#ff4b26]' : 'text-white/50'
                  )} />
                </motion.div>
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}