"use client"

import { useState, useEffect, useRef, KeyboardEvent } from "react"
import { Search, Filter, X, Loader2, Sparkles } from "lucide-react"
import { Input } from "@/components/ui/input"
import { motion, AnimatePresence } from "framer-motion"
import { useDebounce } from "@/app/hooks/use-debounce"
import { supabase } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { fuzzySearch, highlightMatches } from "@/lib/search/fuzzy-search"
import { CATEGORY_IDS } from "@/lib/constants"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { createProductUrl } from "@/utils/product-utils"

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
  variant?: "default" | "premium";
  placeholder?: string;
}

export function SearchBar({ 
  onSearch, 
  variant = "default", 
  placeholder = "Search for gaming gear..." 
}: SearchBarProps) {
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
          .limit(8)

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
            className={part.isMatch ? "bg-primary/20 text-primary font-medium px-1 rounded" : ""}
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
          router.push(createProductUrl({ id: selected.id, name: selected.name }))
        } else if (query.trim()) {
          // If no suggestion is selected but query exists, perform search
          if (onSearch) {
            onSearch(query);
          }
        }
        break
      case 'Escape':
        e.preventDefault()
        clearSearch()
        break
    }
  }

  const isPremium = variant === "premium";

  return (
    <div className="relative w-full">
      <motion.div 
        className={cn(
          "relative rounded-lg transition-all duration-300",
          isFocused && isPremium && "ring-2 ring-primary/30 shadow-lg shadow-primary/5",
          isFocused && !isPremium && "ring-2 ring-primary/20"
        )}
        animate={{ 
          scale: isFocused ? (isPremium ? 1.02 : 1.01) : 1,
          y: isFocused ? (isPremium ? -2 : 0) : 0
        }}
        transition={{ duration: 0.3, type: "spring", stiffness: 500, damping: 30 }}
      >
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            // Short delay to allow click on suggestions
            setTimeout(() => setIsFocused(false), 150);
          }}
          className={cn(
            "w-full pl-12 pr-12 py-6 border transition-all duration-300",
            isPremium ? 
              "bg-black/60 backdrop-blur-md border-white/20 rounded-xl text-white shadow-lg focus:border-primary/50 focus:ring-4 focus:ring-primary/20 focus-visible:ring-primary/20" : 
              "bg-black/50 backdrop-blur-sm border-white/10 rounded-lg focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
          )}
        />
        
        {isPremium ? (
          <motion.div 
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-primary/10 p-1.5 rounded-full"
            initial={{ scale: 0.8, opacity: 0.5 }}
            animate={{ 
              scale: [1, 1.05, 1],
              opacity: 1,
              rotateZ: isFocused ? [0, -10, 0, 10, 0] : 0,
            }}
            transition={{
              duration: 0.4,
              repeat: isFocused ? Infinity : 0,
              repeatDelay: 5,
            }}
          >
            <Sparkles className="h-5 w-5 text-primary" />
          </motion.div>
        ) : (
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/50" />
        )}
        
        <AnimatePresence>
          {query && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8, rotate: 90 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              exit={{ opacity: 0, scale: 0.8, rotate: 90 }}
              onClick={clearSearch}
              className={cn(
                "absolute right-4 top-1/2 -translate-y-1/2 p-1.5 rounded-full transition-colors",
                isPremium ? 
                  "hover:bg-white/15 bg-white/5" : 
                  "hover:bg-white/10"
              )}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 text-white/70 animate-spin" />
              ) : (
                <X className="h-4 w-4 text-white/70" />
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
              variant={isPremium ? "outline" : "secondary"}
              className={cn(
                "cursor-pointer transition-all duration-300",
                selectedCategories.includes(category)
                  ? isPremium 
                    ? "bg-primary/20 text-primary border-primary/50 shadow-sm shadow-primary/10" 
                    : "bg-primary/20 text-primary"
                  : isPremium 
                    ? "hover:bg-white/10 border-white/20" 
                    : "hover:bg-white/5"
              )}
              onClick={() => toggleCategory(category)}
            >
              <Filter className={cn(
                "mr-1 h-3 w-3 transition-colors duration-300",
                selectedCategories.includes(category)
                  ? "text-primary"
                  : "text-white/50"
              )} />
              {category.replace('Gaming ', '')}
            </Badge>
          </motion.div>
        ))}
      </motion.div>

      {/* Suggestions dropdown */}
      <AnimatePresence>
        {suggestions.length > 0 && isFocused && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={cn(
              "absolute top-full left-0 right-0 mt-2 overflow-hidden z-50",
              isPremium ? 
                "bg-black/95 backdrop-blur-xl rounded-xl border border-white/20 shadow-xl shadow-primary/5" : 
                "bg-black/90 backdrop-blur-lg rounded-xl border border-white/10 shadow-lg"
            )}
            style={{ maxHeight: "calc(100vh - 300px)" }}
          >
            <div className="max-h-[50vh] overflow-y-auto custom-scrollbar">
              {suggestions.map((suggestion, index) => (
                <motion.button
                  key={suggestion.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ 
                    opacity: 1, 
                    x: 0,
                    transition: { delay: index * 0.05, duration: 0.2 } 
                  }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  onClick={() => router.push(createProductUrl({ id: suggestion.id, name: suggestion.name }))}
                  className={cn(
                    "w-full text-left px-4 py-3 transition-colors duration-200 flex items-center justify-between group",
                    selectedIndex === index 
                      ? isPremium 
                        ? "bg-primary/20" 
                        : "bg-white/10" 
                      : "hover:bg-white/5"
                  )}
                >
                  <div className="flex flex-col">
                    <span className="font-medium">
                      <HighlightedText text={suggestion.name} />
                    </span>
                    <span className="text-xs text-white/50 mt-1">
                      {suggestion.category}
                    </span>
                  </div>
                  <div className={cn(
                    "bg-white/5 px-2 py-1 rounded text-xs flex items-center",
                    isPremium && "group-hover:bg-primary/10 group-hover:text-primary transition-colors duration-200"
                  )}>
                    {suggestion.votes} votes
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* No results message */}
      <AnimatePresence>
        {query && debouncedQuery && suggestions.length === 0 && !isLoading && isFocused && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={cn(
              "absolute top-full left-0 right-0 mt-2 p-4 text-center",
              isPremium ? 
                "bg-black/95 backdrop-blur-xl rounded-xl border border-white/20 shadow-xl" : 
                "bg-black/90 backdrop-blur-lg rounded-xl border border-white/10 shadow-lg"
            )}
          >
            <p className="text-white/70">No products found matching "{debouncedQuery}"</p>
            <p className="text-white/50 text-sm mt-1">Try different keywords or browsing by category</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add subtle style for custom scrollbar */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      `}</style>
    </div>
  )
}