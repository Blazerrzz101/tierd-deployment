"use client"

import Link from "next/link"
import { formatTimeAgo } from "@/lib/utils"
import { Thread } from "@/types/thread"
import { Button } from "@/components/ui/button"
import { Tag, MessageSquare, ThumbsUp, ThumbsDown } from "lucide-react"
import { ProductImage } from "@/components/ui/product-image"

interface ThreadCardProps {
  thread: Thread
}

export function ThreadCard({ thread }: ThreadCardProps) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/5 p-6 transition-colors hover:bg-white/10">
      <div className="flex items-start justify-between">
        <div className="space-y-4">
          <div>
            <Link
              href={`/threads/${thread.localId || thread.id}`}
              className="text-xl font-semibold hover:underline"
            >
              {thread.title}
            </Link>
            <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
              <span>{thread.user.username}</span>
              <span>•</span>
              <span>{formatTimeAgo(thread.created_at)}</span>
            </div>
          </div>
          <p className="text-sm text-muted-foreground line-clamp-3">
            {thread.content}
          </p>
          {thread.taggedProducts && thread.taggedProducts.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Tag className="h-4 w-4" />
                <span>Tagged Products:</span>
              </div>
              <div className="flex flex-wrap gap-4">
                {thread.taggedProducts.map(product => (
                  <Link
                    key={product.id}
                    href={`/products/${product.url_slug || product.id}`}
                    className="group flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 p-2 transition-colors hover:bg-white/10"
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
                      <div className="font-medium group-hover:underline">
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
        <Button variant="ghost" size="sm" className="gap-2">
          <MessageSquare className="h-4 w-4" />
          Discuss
        </Button>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" className="gap-1">
            <ThumbsUp className="h-4 w-4" />
            {thread.upvotes}
          </Button>
          <Button variant="ghost" size="sm" className="gap-1">
            <ThumbsDown className="h-4 w-4" />
            {thread.downvotes}
          </Button>
        </div>
      </div>
    </div>
  )
} 