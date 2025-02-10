import { Input } from "@/components/ui/input"
import { useState, ChangeEvent, useEffect } from "react"
import { supabase } from "@/lib/supabase/client"
import Link from "next/link"
import { Product } from "@/types"

export function Search() {
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const searchProducts = async () => {
      if (!searchQuery.trim()) {
        setSearchResults([])
        return
      }

      setIsLoading(true)
      setError(null)

      try {
        const { data, error } = await supabase
          .from("products")
          .select("*")
          .ilike("name", `%${searchQuery}%`)
          .limit(10)

        if (error) throw error

        setSearchResults(data || [])
      } catch (err) {
        console.error("Search error:", err)
        setError("Failed to search products")
        setSearchResults([])
      } finally {
        setIsLoading(false)
      }
    }

    const debounceTimeout = setTimeout(searchProducts, 300)
    return () => clearTimeout(debounceTimeout)
  }, [searchQuery])

  const handleSearch = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }

  return (
    <div className="sticky top-0 z-50 w-full bg-black/50 backdrop-blur-xl">
      <div className="container mx-auto flex items-center justify-between px-4 py-2">
        <div className="relative w-full max-w-2xl">
          <Input
            type="search"
            placeholder="Search products..."
            className="w-full bg-black/20 text-white placeholder-gray-400 focus:ring-primary"
            value={searchQuery}
            onChange={handleSearch}
          />
          {(searchResults.length > 0 || isLoading || error) && (
            <div className="absolute left-0 right-0 top-full mt-2 max-h-96 overflow-y-auto rounded-lg bg-black/90 p-2 shadow-lg backdrop-blur-xl">
              {isLoading && (
                <div className="p-4 text-center text-gray-400">
                  Searching...
                </div>
              )}
              {error && (
                <div className="p-4 text-center text-red-400">
                  {error}
                </div>
              )}
              {searchResults.map((product) => (
                <Link
                  key={product.id}
                  href={`/product/${product.id}`}
                  className="block p-2 hover:bg-white/10"
                >
                  <div className="flex items-center gap-3">
                    {product.imageUrl && (
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="h-10 w-10 rounded-lg object-cover"
                      />
                    )}
                    <div>
                      <div className="font-medium">{product.name}</div>
                      <div className="text-sm text-gray-400">
                        {product.category}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 