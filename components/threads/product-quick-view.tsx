'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { supabase } from '@/lib/supabase/client'
import { Loader2, Search, Image as ImageIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

// Base64 encoded transparent placeholder
const PLACEHOLDER_IMAGE = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='

interface Product {
  id: string
  name: string
  image_url: string | null
  category: string
  price: number | null
}

interface ProductQuickViewProps {
  onSelect: (product: Product) => void
}

export function ProductQuickView({ onSelect }: ProductQuickViewProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const searchProducts = async () => {
      // Show initial products even without search query
      setIsLoading(true)
      try {
        console.log('Fetching products with query:', searchQuery)
        const { data, error } = await supabase
          .from('products')
          .select('id, name, image_url, category, price')
          .ilike('name', searchQuery ? `%${searchQuery}%` : '%')
          .limit(5)

        console.log('Supabase response:', { data, error })

        if (error) {
          console.error('Supabase error:', error)
          throw error
        }
        
        if (data) {
          console.log('Found products:', data.length)
          setProducts(data)
        } else {
          console.log('No products found')
          setProducts([])
        }
      } catch (error) {
        console.error('Error searching products:', error)
        setProducts([])
      } finally {
        setIsLoading(false)
      }
    }

    // Reduced debounce time for better responsiveness
    const debounceTimer = setTimeout(searchProducts, 150)
    return () => clearTimeout(debounceTimer)
  }, [searchQuery])

  return (
    <Card className="w-[300px] p-4 shadow-lg border border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={cn(
              "pl-8 w-full bg-transparent transition-colors",
              searchQuery && "ring-2 ring-primary/50"
            )}
            autoFocus
          />
        </div>
        <ScrollArea className="h-[200px] overflow-y-auto">
          <div className="space-y-2">
            {isLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : products.length > 0 ? (
              products.map((product) => (
                <div
                  key={product.id}
                  onClick={() => onSelect(product)}
                  className="flex items-center space-x-3 p-2 hover:bg-accent/50 rounded-md cursor-pointer transition-colors group"
                >
                  <div className="relative w-10 h-10 rounded-md overflow-hidden border border-border/50 bg-muted">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="object-cover w-full h-full group-hover:scale-110 transition-transform"
                        onError={(e) => {
                          const img = e.target as HTMLImageElement;
                          img.src = PLACEHOLDER_IMAGE;
                          img.className = 'hidden';
                          e.currentTarget.parentElement?.querySelector('.placeholder-icon')?.classList.remove('hidden');
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="w-6 h-6 text-muted-foreground" />
                      </div>
                    )}
                    <div className="placeholder-icon hidden absolute inset-0 flex items-center justify-center">
                      <ImageIcon className="w-6 h-6 text-muted-foreground" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{product.name}</p>
                    <p className="text-sm text-muted-foreground truncate">
                      {product.category}
                    </p>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {product.price ? `$${product.price}` : 'N/A'}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-4">
                {searchQuery.length >= 2 ? 'No products found' : 'Start typing to search products'}
              </p>
            )}
          </div>
        </ScrollArea>
      </div>
    </Card>
  )
} 