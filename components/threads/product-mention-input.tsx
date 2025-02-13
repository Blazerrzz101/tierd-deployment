"use client"

import { useState, useEffect } from "react"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { getSupabaseClient } from "@/lib/supabase/client"
import { Product } from "@/types/product"

interface ProductMentionInputProps {
  selectedProducts: Product[]
  onProductsChange: (products: Product[]) => void
  disabled?: boolean
}

export function ProductMentionInput({ 
  selectedProducts, 
  onProductsChange,
  disabled = false 
}: ProductMentionInputProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [showProductSelect, setShowProductSelect] = useState(false)
  const supabase = getSupabaseClient()

  // Load products for mentions
  const loadProducts = async (search: string = "") => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .ilike('name', `%${search}%`)
        .limit(5)

      if (error) throw error
      setProducts(data || [])
    } catch (error) {
      console.error('Error loading products:', error)
    }
  }

  // Load initial products
  useEffect(() => {
    loadProducts()
  }, [])

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Mention Products</label>
      <div className="flex flex-wrap gap-2">
        {selectedProducts.map(product => (
          <Badge
            key={product.id}
            variant="secondary"
            className="flex items-center gap-1"
          >
            @{product.name}
            {!disabled && (
              <button
                type="button"
                onClick={() => onProductsChange(
                  selectedProducts.filter(p => p.id !== product.id)
                )}
                className="ml-1 rounded-full hover:bg-muted"
              >
                ×
              </button>
            )}
          </Badge>
        ))}
        {!disabled && (
          <Popover open={showProductSelect} onOpenChange={setShowProductSelect}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={showProductSelect}
                className="h-8 w-[200px] justify-between"
                onClick={() => loadProducts()}
              >
                <span>Select products...</span>
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0">
              <Command>
                <CommandInput 
                  placeholder="Search products..." 
                  onValueChange={loadProducts}
                />
                <CommandEmpty>No products found.</CommandEmpty>
                <CommandGroup>
                  {products.map(product => (
                    <CommandItem
                      key={product.id}
                      value={product.name}
                      onSelect={() => {
                        onProductsChange(
                          selectedProducts.some(p => p.id === product.id)
                            ? selectedProducts.filter(p => p.id !== product.id)
                            : [...selectedProducts, product]
                        )
                        setShowProductSelect(false)
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          selectedProducts.some(p => p.id === product.id)
                            ? "opacity-100"
                            : "opacity-0"
                        )}
                      />
                      {product.name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </Command>
            </PopoverContent>
          </Popover>
        )}
      </div>
    </div>
  )
} 