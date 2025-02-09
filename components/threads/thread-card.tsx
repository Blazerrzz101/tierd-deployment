"use client"

import { Thread } from "@/types/thread"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { MessageSquare, ThumbsUp, ThumbsDown } from "lucide-react"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { formatTimeAgo } from "@/lib/utils"
import Link from "next/link"

interface ThreadCardProps {
  thread: Thread
}

export function ThreadCard({ thread }: ThreadCardProps) {
  const router = useRouter()

  return (
    <Card className="overflow-hidden transition-colors hover:bg-muted/50">
      <CardHeader className="flex flex-row items-start gap-4 space-y-0">
        <Avatar className="h-10 w-10">
          <AvatarImage src={thread.user?.avatar_url || ""} />
          <AvatarFallback>
            {thread.user?.username?.[0]?.toUpperCase() || "U"}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">
              {thread.user?.username || "Anonymous"}
            </span>
            <span className="text-xs text-muted-foreground">
              {formatTimeAgo(thread.created_at)}
            </span>
            {thread.is_pinned && (
              <Badge variant="secondary">Pinned</Badge>
            )}
          </div>
          <h3 
            className="text-lg font-semibold leading-none tracking-tight hover:text-primary"
            onClick={() => router.push(`/threads/${thread.id}`)}
            style={{ cursor: 'pointer' }}
          >
            {thread.title}
          </h3>
        </div>
      </CardHeader>
      <CardContent>
        <p className="line-clamp-2 text-muted-foreground">
          {thread.content}
        </p>
        {thread.products && thread.products.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {thread.products.map(product => (
              <Link 
                key={product.id} 
                href={`/products/${product.url_slug}`}
                className="inline-flex items-center"
              >
                <Badge variant="outline" className="hover:bg-primary hover:text-primary-foreground">
                  @{product.name}
                </Badge>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex items-center gap-4">
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <ThumbsUp className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground">
            {thread.upvotes - thread.downvotes}
          </span>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <ThumbsDown className="h-4 w-4" />
          </Button>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="flex items-center gap-1"
          onClick={() => router.push(`/threads/${thread.id}`)}
        >
          <MessageSquare className="h-4 w-4" />
          <span>Reply</span>
        </Button>
      </CardFooter>
    </Card>
  )
} 