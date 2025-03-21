"use client"

import { useState, useEffect } from "react"
import { Tag as TagIcon, Search, Loader2 } from "lucide-react"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { getLocalizedString } from "@/utils/language-utils"
import { Product } from "@/types"

interface ThreadProductSearchProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onProductSelected: (product: Product) => void
  selectedProducts: Product[]
  onRemoveProduct: (productId: string) => void
}

export function ThreadProductSearch({
  open,
  onOpenChange,
  onProductSelected,
  selectedProducts,
  onRemoveProduct
}: ThreadProductSearchProps) {
  const [query, setQuery] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const [error, setError] = useState<string | null>(null)
  
  // Fetch products when the query changes
  useEffect(() => {
    // Skip empty queries
    if (!query.trim() || query.length < 2) {
      setProducts([])
      return
    }
    
    const fetchProducts = async () => {
      setIsLoading(true)
      setError(null)
      
      try {
        // In a real application, this would be an API call
        // For demo purposes, we'll simulate a delay and filter the mock data
        await new Promise(resolve => setTimeout(resolve, 500))
        
        // Fetch from API
        const response = await fetch(`/api/products/search?q=${encodeURIComponent(query)}`)
        
        if (!response.ok) {
          throw new Error("Failed to fetch products")
        }
        
        const data = await response.json()
        setProducts(data.products || [])
      } catch (err) {
        console.error("Error fetching products:", err)
        setError("Failed to fetch products. Please try again.")
      } finally {
        setIsLoading(false)
      }
    }
    
    // Debounce the search
    const timer = setTimeout(() => {
      fetchProducts()
    }, 300)
    
    return () => clearTimeout(timer)
  }, [query])
  
  const handleProductSelect = (product: Product) => {
    onProductSelected(product)
    setQuery("")
  }
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{getLocalizedString("discussions.tagProducts")}</DialogTitle>
          <DialogDescription>
            Tag products related to your discussion to make it more discoverable.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search for products..."
              className="pl-9"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {isLoading && (
              <Loader2 className="absolute right-2.5 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />
            )}
          </div>
          
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
          
          {/* Selected products */}
          {selectedProducts.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Selected Products</h4>
              <div className="flex flex-wrap gap-2">
                {selectedProducts.map((product) => (
                  <Badge key={product.id} variant="secondary" className="flex items-center gap-1">
                    <span>{product.name}</span>
                    <button 
                      type="button"
                      className="ml-1 rounded-full hover:bg-muted p-0.5"
                      onClick={() => onRemoveProduct(product.id)}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 6 6 18"/>
                        <path d="m6 6 12 12"/>
                      </svg>
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          )}
          
          {/* Search results */}
          {query.trim().length >= 2 && !isLoading && products.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Search Results</h4>
              <ScrollArea className="h-[200px] rounded-md border p-2">
                <div className="space-y-2">
                  {products.map((product) => (
                    <button
                      key={product.id}
                      onClick={() => handleProductSelect(product)}
                      className="flex w-full items-center gap-2 rounded-md p-2 text-left hover:bg-muted"
                      disabled={selectedProducts.some(p => p.id === product.id)}
                    >
                      <TagIcon className="h-4 w-4" />
                      <div className="flex-1 truncate">
                        <p className="font-medium truncate">{product.name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {product.category}
                        </p>
                      </div>
                      {selectedProducts.some(p => p.id === product.id) && (
                        <Badge variant="outline" className="ml-auto">Selected</Badge>
                      )}
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
          
          {query.trim().length >= 2 && !isLoading && products.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No products found. Try a different search term.
            </p>
          )}
        </div>
        
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>
            {getLocalizedString("common.close")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 