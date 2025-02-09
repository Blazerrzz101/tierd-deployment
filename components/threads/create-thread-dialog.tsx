"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@/hooks/use-auth"
import { getSupabaseClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { Product } from "@/types/product"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Check, ChevronsUpDown } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface CreateThreadDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateThreadDialog({ open, onOpenChange }: CreateThreadDialogProps) {
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([])
  const [showProductSelect, setShowProductSelect] = useState(false)
  const { user } = useAuth()
  const router = useRouter()
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setIsLoading(true)
    try {
      // Create thread
      const { data: thread, error: threadError } = await supabase
        .from('threads')
        .insert({
          title,
          content,
          user_id: user.id,
          mentioned_products: selectedProducts.map(p => p.id)
        })
        .select()
        .single()

      if (threadError) throw threadError

      // Create product mentions
      if (selectedProducts.length > 0) {
        const { error: productError } = await supabase
          .from('thread_products')
          .insert(
            selectedProducts.map(product => ({
              thread_id: thread.id,
              product_id: product.id
            }))
          )

        if (productError) throw productError
      }

      toast.success('Thread created successfully')
      router.refresh()
      onOpenChange(false)
      setTitle("")
      setContent("")
      setSelectedProducts([])
    } catch (error) {
      console.error('Error creating thread:', error)
      toast.error('Failed to create thread')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create New Thread</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Input
              placeholder="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Textarea
              placeholder="What's on your mind?"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              className="min-h-[100px]"
            />
          </div>
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
                  <button
                    type="button"
                    onClick={() => setSelectedProducts(prev => 
                      prev.filter(p => p.id !== product.id)
                    )}
                    className="ml-1 rounded-full hover:bg-muted"
                  >
                    ×
                  </button>
                </Badge>
              ))}
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
                            setSelectedProducts(prev => {
                              if (prev.some(p => p.id === product.id)) {
                                return prev.filter(p => p.id !== product.id)
                              }
                              return [...prev, product]
                            })
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
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Creating..." : "Create Thread"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
} 