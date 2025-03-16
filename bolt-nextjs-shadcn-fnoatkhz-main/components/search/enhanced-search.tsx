```tsx
"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Search as SearchIcon, Mic, Keyboard, Settings } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { useHotkeys } from "@/hooks/use-hotkeys"
import { useVoiceInput } from "@/hooks/use-voice-input"
import { ActivityTracker } from "@/lib/activity/ActivityTracker"

interface SearchResult {
  id: string
  type: 'product' | 'category' | 'review'
  title: string
  description?: string
  url: string
}

export function EnhancedSearch() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [isListening, setIsListening] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const { startListening, stopListening, transcript } = useVoiceInput()

  // Keyboard shortcuts
  useHotkeys([
    { key: 'ctrl+k', callback: () => setOpen(true) },
    { key: 'ctrl+/', callback: () => inputRef.current?.focus() }
  ])

  // Voice input handling
  useEffect(() => {
    if (transcript) {
      setQuery(transcript)
      performSearch(transcript)
    }
  }, [transcript])

  const performSearch = async (searchQuery: string) => {
    try {
      // Track search activity
      const activityTracker = ActivityTracker.getInstance()
      await activityTracker.trackActivity({
        userId: 'current-user', // Replace with actual user ID
        type: 'search',
        timestamp: Date.now(),
        metadata: { query: searchQuery }
      })

      // Perform search (replace with actual search logic)
      const searchResults: SearchResult[] = []
      setResults(searchResults)
    } catch (error) {
      console.error('Search error:', error)
    }
  }

  const handleSearch = (value: string) => {
    setQuery(value)
    performSearch(value)
  }

  const handleVoiceSearch = () => {
    if (isListening) {
      stopListening()
    } else {
      startListening()
    }
    setIsListening(!isListening)
  }

  return (
    <div className="relative w-full max-w-2xl">
      <div className="relative">
        <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          ref={inputRef}
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search products, categories, reviews..."
          className="pl-9 pr-12"
          aria-label="Search"
          onFocus={() => setOpen(true)}
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={handleVoiceSearch}
            aria-label={isListening ? "Stop voice search" : "Start voice search"}
          >
            <Mic className={`h-4 w-4 ${isListening ? 'text-primary' : ''}`} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={() => setOpen(true)}
            aria-label="Open search dialog"
          >
            <Keyboard className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          value={query}
          onValueChange={handleSearch}
          placeholder="Type to search..."
        />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Products">
            {results.filter(r => r.type === 'product').map((result) => (
              <CommandItem
                key={result.id}
                onSelect={() => router.push(result.url)}
              >
                {result.title}
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandGroup heading="Categories">
            {results.filter(r => r.type === 'category').map((result) => (
              <CommandItem
                key={result.id}
                onSelect={() => router.push(result.url)}
              >
                {result.title}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </div>
  )
}
```