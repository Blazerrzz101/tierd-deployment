"use client"

import { useState, useEffect } from "react"
import { Command } from "cmdk"
import { Product } from "@/types/product"
import { supabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Tag, X } from "lucide-react"

interface ProductTaggerProps {
  onProductsTagged: (products: Product[]) => void
  initialProducts?: Product[]
}

export function ProductTagger({ onProductsTagged, initialProducts = [] }: ProductTaggerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [products, setProducts] = useState<Product[]>([])
  const [selectedProducts, setSelectedProducts] = useState<Product[]>(initialProducts)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    async function searchProducts() {
      if (!search.trim()) {
        setProducts([])
        return
      }

      setLoading(true)
      try {
        const { data, error } = await supabase
          .from("products")
          .select("*")
          .textSearch("name", search)
          .limit(5)

        if (error) throw error
        setProducts(data || [])
      } catch (error) {
        console.error("Error searching products:", error)
        setProducts([])
      } finally {
        setLoading(false)
      }
    }

    const timer = setTimeout(searchProducts, 300)
    return () => clearTimeout(timer)
  }, [search])

  const handleSelect = (product: Product) => {
    if (!selectedProducts.some(p => p.id === product.id)) {
      const newSelection = [...selectedProducts, product]
      setSelectedProducts(newSelection)
      onProductsTagged(newSelection)
    }
    setIsOpen(false)
    setSearch("")
  }

  const handleRemove = (productId: string) => {
    const newSelection = selectedProducts.filter(p => p.id !== productId)
    setSelectedProducts(newSelection)
    onProductsTagged(newSelection)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {selectedProducts.map(product => (
          <div
            key={product.id}
            className="flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-sm"
          >
            <Tag className="h-3 w-3" />
            <span>{product.name}</span>
            <button
              onClick={() => handleRemove(product.id)}
              className="ml-1 rounded-full p-1 hover:bg-white/20"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
        <Button
          variant="outline"
          size="sm"
          className="h-8"
          onClick={() => setIsOpen(true)}
        >
          <Tag className="mr-2 h-4 w-4" />
          Tag Products
        </Button>
      </div>

      <Command.Dialog open={isOpen} onOpenChange={setIsOpen}>
        <Command.Input
          value={search}
          onValueChange={setSearch}
          placeholder="Search for products to tag..."
        />

        <Command.List>
          {loading && (
            <Command.Loading>Searching products...</Command.Loading>
          )}

          {!loading && products.length === 0 && search && (
            <Command.Empty>No products found</Command.Empty>
          )}

          {products.map(product => (
            <Command.Item
              key={product.id}
              value={product.name}
              onSelect={() => handleSelect(product)}
              className="flex items-center justify-between"
            >
              <div className="flex items-center">
                <Tag className="mr-2 h-4 w-4" />
                <span>{product.name}</span>
              </div>
              <span className="text-sm text-muted-foreground">
                {product.category}
              </span>
            </Command.Item>
          ))}
        </Command.List>
      </Command.Dialog>
    </div>
  )
} 