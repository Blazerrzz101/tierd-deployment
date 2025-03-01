"use client"

import Link from "next/link"
import { formatTimeAgo } from "@/lib/utils"
import { Thread } from "@/types/thread"
import { Button } from "@/components/ui/button"
import { Tag, MessageSquare, ThumbsUp, ThumbsDown, Trash2 } from "lucide-react"
import { ProductImage } from "@/components/ui/product-image"
import { useAuth } from "@/hooks/use-auth"
import { threadStore } from "@/lib/local-storage/thread-store"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface ThreadCardProps {
  thread: Thread
}

export function ThreadCard({ thread }: ThreadCardProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const isOwner = user?.id === thread.user_id

  const handleDelete = () => {
    const threadId = thread.localId || thread.id
    if (!threadId) {
      toast({
        title: "Error",
        children: "Invalid thread ID",
        variant: "destructive"
      })
      return
    }

    try {
      threadStore.deleteThread(threadId)
      toast({
        title: "Thread deleted",
        children: "Your thread has been deleted successfully."
      })
      router.refresh()
    } catch (error) {
      toast({
        title: "Error",
        children: "Failed to delete thread. Please try again.",
        variant: "destructive"
      })
    }
  }

  return (
    <div className="modern-card hover:shadow-md transition-all duration-300 hover:translate-y-[-2px]">
      <div className="flex items-start justify-between">
        <div className="space-y-4 w-full">
          <div className="flex items-center justify-between">
            <Link
              href={`/threads/${thread.localId || thread.id}`}
              className="text-xl font-semibold hover:gradient-text"
            >
              {thread.title}
            </Link>
            {isOwner && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Thread</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete this thread? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600">
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
          <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
            <span className="font-medium text-secondary">{thread.user.username}</span>
            <span>•</span>
            <span>{formatTimeAgo(thread.created_at)}</span>
          </div>
          <p className="text-sm text-muted-foreground line-clamp-3">
            {thread.content}
          </p>
          {thread.taggedProducts && thread.taggedProducts.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-secondary">
                <Tag className="h-4 w-4" />
                <span>Tagged Products:</span>
              </div>
              <div className="flex flex-wrap gap-4">
                {thread.taggedProducts.map(product => (
                  <Link
                    key={product.id}
                    href={`/products/${product.url_slug || product.id}`}
                    className="group flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 p-2 transition-all hover:bg-white/10 hover:border-secondary/30 hover:shadow-sm"
                  >
                    <div className="relative h-12 w-12 overflow-hidden rounded-md">
                      <ProductImage
                        src={product.imageUrl}
                        alt={product.name}
                        category={product.category}
                        fill
                        sizes="48px"
                        className="object-cover transition-transform group-hover:scale-110"
                      />
                    </div>
                    <div>
                      <div className="font-medium group-hover:text-secondary">
                        {product.name}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {product.category}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="mt-6 flex items-center gap-4">
        <Button variant="ghost" size="sm" className="gap-2 hover:bg-primary/10 hover:text-primary">
          <MessageSquare className="h-4 w-4" />
          Discuss
        </Button>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" className="gap-1 hover:bg-secondary/10 hover:text-secondary">
            <ThumbsUp className="h-4 w-4" />
            {thread.upvotes}
          </Button>
          <Button variant="ghost" size="sm" className="gap-1 hover:bg-accent/10 hover:text-accent">
            <ThumbsDown className="h-4 w-4" />
            {thread.downvotes}
          </Button>
        </div>
      </div>
    </div>
  )
} 