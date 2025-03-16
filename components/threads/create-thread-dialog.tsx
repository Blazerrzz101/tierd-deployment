"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Loader2 } from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks/use-auth"
import { threadStore } from "@/lib/local-storage/thread-store"
import { ProductTagger } from "@/components/threads/product-tagger"
import { Product } from "@/types/product"

const formSchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title is too long"),
  content: z.string().min(1, "Content is required").max(2000, "Content is too long"),
})

interface CreateThreadDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateThreadDialog({ open, onOpenChange }: CreateThreadDialogProps) {
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = React.useState(false)
  const [taggedProducts, setTaggedProducts] = React.useState<Product[]>([])

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      content: "",
    },
  })

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsLoading(true)
      
      // Ensure the user is authenticated
      if (!user || (user as any).isAnonymous) {
        toast({
          title: "Authentication required",
          description: "You need to sign in to create a thread.",
          variant: "destructive"
        })
        onOpenChange(false) // Close the dialog
        router.push('/auth/sign-in?redirect=back&reason=create_thread')
        return
      }
      
      // Generate a unique ID for the thread
      const threadId = `thread_${Math.random().toString(36).substring(2, 15)}`
      
      const now = new Date().toISOString()
      const thread = threadStore.addThread({
        title: values.title,
        content: values.content,
        user_id: user.id,
        created_at: now,
        updated_at: now,
        upvotes: 0,
        downvotes: 0,
        user: {
          id: user.id,
          username: user.email?.split("@")[0] || "Anonymous",
          avatar_url: null,
        },
        taggedProducts,
        mentioned_products: taggedProducts.map(p => p.id),
        is_pinned: false,
        is_locked: false,
      })

      toast({
        title: "Thread created",
        description: "Your thread has been created successfully."
      })

      form.reset()
      setTaggedProducts([])
      onOpenChange(false)
      router.refresh()
    } catch (error) {
      console.error("Error creating thread:", error)
      toast({
        title: "Error",
        description: "Failed to create thread. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create New Thread</DialogTitle>
          <DialogDescription>
            Start a discussion about gaming gear. Tag relevant products to help others find your thread.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="What's on your mind?" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Content</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Share your thoughts..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="space-y-2">
              <FormLabel>Tagged Products</FormLabel>
              <ProductTagger
                onProductsTagged={setTaggedProducts}
                initialProducts={taggedProducts}
              />
            </div>
            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Create Thread
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
} 