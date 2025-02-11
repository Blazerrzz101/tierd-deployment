"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { supabase, handleProductMentions } from "@/supabaseClient"
import { useDebounce } from "@/hooks/use-debounce"

interface Product {
  id: string
  name: string
  description: string | null
  category: string
}

interface ProductMentionInputProps {
  onSubmit: (content: string) => void
  placeholder?: string
  disabled?: boolean
}

export function ProductMentionInput({
  onSubmit,
  placeholder = "Write your message...",
  disabled = false,
}: ProductMentionInputProps) {
  const [content, setContent] = useState("")
  const [mentionSearch, setMentionSearch] = useState("")
  const [cursorPosition, setCursorPosition] = useState(0)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const debouncedSearch = useDebounce(mentionSearch, 300)

  // Function to get the current mention search term
  const getMentionSearchTerm = useCallback((text: string, position: number) => {
    const beforeCursor = text.slice(0, position)
    const mentionMatch = beforeCursor.match(/@(\w*)$/)
    return mentionMatch ? mentionMatch[1] : ""
  }, [])

  // Update mention search when content or cursor position changes
  useEffect(() => {
    const searchTerm = getMentionSearchTerm(content, cursorPosition)
    setMentionSearch(searchTerm)
    setShowSuggestions(searchTerm !== "")
  }, [content, cursorPosition, getMentionSearchTerm])

  // Search for products when mention search changes
  useEffect(() => {
    async function searchProducts() {
      if (!debouncedSearch) {
        setProducts([])
        return
      }

      setIsLoading(true)
      try {
        const { data, error } = await supabase
          .from("products")
          .select("id, name, description, category")
          .ilike("name", `%${debouncedSearch}%`)
          .limit(5)

        if (error) throw error
        setProducts(data || [])
      } catch (error) {
        console.error("Error searching products:", error)
      } finally {
        setIsLoading(false)
      }
    }

    searchProducts()
  }, [debouncedSearch])

  // Handle product selection
  const handleProductSelect = (product: Product) => {
    if (!textareaRef.current) return

    const beforeMention = content.slice(0, cursorPosition).replace(/@\w*$/, "")
    const afterMention = content.slice(cursorPosition)
    const newContent = `${beforeMention}@${product.name}${afterMention}`
    
    setContent(newContent)
    setShowSuggestions(false)
    
    // Move cursor after the inserted mention
    const newPosition = beforeMention.length + product.name.length + 1
    textareaRef.current.focus()
    textareaRef.current.setSelectionRange(newPosition, newPosition)
  }

  // Handle message submission
  const handleSubmit = async () => {
    if (!content.trim() || disabled) return

    try {
      // Let the parent component handle the message creation
      onSubmit(content)
      setContent("")
    } catch (error) {
      console.error("Error submitting message:", error)
    }
  }

  return (
    <div className="relative w-full space-y-2">
      <div className="relative">
        <Textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault()
              handleSubmit()
            }
          }}
          onSelect={(e) => {
            const target = e.target as HTMLTextAreaElement
            setCursorPosition(target.selectionStart)
          }}
          placeholder={placeholder}
          className="min-h-[100px] resize-none"
          disabled={disabled}
        />

        {showSuggestions && (
          <Popover open={true} onOpenChange={setShowSuggestions}>
            <PopoverTrigger asChild>
              <div className="h-0 w-0" />
            </PopoverTrigger>
            <PopoverContent
              className="w-[300px] p-0"
              align="start"
              sideOffset={5}
            >
              <Command>
                <CommandInput
                  placeholder="Search products..."
                  value={mentionSearch}
                  onValueChange={setMentionSearch}
                />
                <CommandEmpty>
                  {isLoading ? "Searching..." : "No products found"}
                </CommandEmpty>
                <CommandGroup>
                  {products.map((product) => (
                    <CommandItem
                      key={product.id}
                      value={product.name}
                      onSelect={() => handleProductSelect(product)}
                    >
                      <div className="flex flex-col">
                        <span className="font-medium">{product.name}</span>
                        <span className="text-sm text-muted-foreground">
                          {product.category}
                        </span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </Command>
            </PopoverContent>
          </Popover>
        )}
      </div>

      <div className="flex justify-end">
        <Button
          onClick={handleSubmit}
          disabled={!content.trim() || disabled}
        >
          Send Message
        </Button>
      </div>
    </div>
  )
} 