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
      if (!debouncedQuery.trim() && selectedCategories.length === 0) {
        setSuggestions([])
        return
      }

      setIsLoading(true)
      try {
        // Fetch all products for the selected categories
        const categoryFilter = selectedCategories.length > 0
          ? selectedCategories
          : categories.map(c => c.id)

        const { data, error } = await supabase
          .from('products')
          .select('id, name, category, votes')
          .in('category', categoryFilter)
          .order('votes', { ascending: false })

        if (error) throw error

        // Apply fuzzy search if there's a query
        let processedData = data
        if (debouncedQuery.trim()) {
          processedData = fuzzySearch(data, debouncedQuery, {
            keys: ['name', 'category'],
            weights: {
              name: 2,    // Name matches are more important
              category: 1  // Category matches are less important
            },
            threshold: 0.2 // Lower threshold for more forgiving matching
          })
        }

        // Add highlighting information
        const suggestionsWithHighlights = processedData.slice(0, 5).map(item => ({
          ...item,
          highlight: {
            start: item.name.toLowerCase().indexOf(debouncedQuery.toLowerCase()),
            end: item.name.toLowerCase().indexOf(debouncedQuery.toLowerCase()) + debouncedQuery.length
          }
        }))

        setSuggestions(suggestionsWithHighlights)
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
          className="w-full h-12 pl-12 pr-4 bg-white/5 border-white/10 rounded-xl
                     text-white placeholder:text-white/50
                     focus:ring-2 focus:ring-[#ff4b26]/20 focus:border-[#ff4b26]
                     transition-all duration-300"
        />
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/50" />
        
        {isLoading && (
          <motion.div
            className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 border-2 border-[#ff4b26] border-t-transparent rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
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

      <AnimatePresence>
        {suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-2 bg-black/90 backdrop-blur-lg rounded-xl border border-white/10 overflow-hidden"
          >
            {suggestions.map((suggestion, index) => (
              <motion.button
                key={suggestion.id}
                onClick={() => router.push(`/products/${suggestion.id}`)}
                className={`w-full px-4 py-3 flex items-center gap-4 transition-colors
                          ${index === selectedIndex ? 'bg-white/10' : 'hover:bg-white/5'}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <div className="flex-1 text-left">
                  <div className="font-medium text-white">
                    <HighlightedText text={suggestion.name} />
                  </div>
                  <div className="text-sm text-white/50 flex items-center gap-2">
                    <span className="capitalize">{suggestion.category.replace('-', ' ')}</span>
                    <span className="h-1 w-1 rounded-full bg-white/20" />
                    <motion.span
                      key={suggestion.votes}
                      initial={{ scale: 1.2, color: '#ff4b26' }}
                      animate={{ scale: 1, color: 'rgb(255 255 255 / 0.5)' }}
                      transition={{ duration: 0.3 }}
                    >
                      {suggestion.votes} votes
                    </motion.span>
                  </div>
                </div>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center
                               transition-colors duration-300
                               ${index === selectedIndex ? 'bg-[#ff4b26]/20' : 'bg-white/5'}`}>
                  <Search className={`h-4 w-4 transition-colors duration-300
                                   ${index === selectedIndex ? 'text-[#ff4b26]' : 'text-white/50'}`} />
                </div>
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}