"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ProductMentionInput } from "@/components/threads/product-mention-input"
import { useRouter } from "next/navigation"
import { getSupabaseClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { Product } from "@/types/product"

interface CreateThreadDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultProduct?: Product
}

export function CreateThreadDialog({ open, onOpenChange, defaultProduct }: CreateThreadDialogProps) {
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [selectedProducts, setSelectedProducts] = useState<Product[]>(
    defaultProduct ? [defaultProduct] : []
  )
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()
  const supabase = getSupabaseClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!title.trim() || !content.trim()) {
      toast.error("Please fill in all fields")
      return
    }

    try {
      setIsSubmitting(true)

      // Get current user
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        toast.error("You must be signed in to create a thread")
        return
      }

      // Create thread
      const { data: thread, error: threadError } = await supabase
        .from('threads')
        .insert({
          title,
          content,
          user_id: session.user.id,
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (threadError) throw threadError

      // Link products to thread
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

      toast.success("Thread created successfully")
      onOpenChange(false)
      setTitle("")
      setContent("")
      setSelectedProducts(defaultProduct ? [defaultProduct] : [])
      
      // Navigate to the thread
      router.push(`/threads/${thread.id}`)
      router.refresh()

    } catch (error: any) {
      console.error('Error creating thread:', error)
      toast.error("Error creating thread", {
        description: error.message
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create New Thread</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Input
              placeholder="Thread title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-12"
            />
          </div>
          <div className="space-y-2">
            <Textarea
              placeholder="What's on your mind?"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[200px]"
            />
          </div>
          <div className="space-y-2">
            <ProductMentionInput
              selectedProducts={selectedProducts}
              onProductsChange={setSelectedProducts}
              disabled={defaultProduct !== undefined}
            />
          </div>
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Thread"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
} 