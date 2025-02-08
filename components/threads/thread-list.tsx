'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ThumbsUp, ThumbsDown, MessageSquare, Share2 } from 'lucide-react'

interface Thread {
  id: string
  title: string
  content: string
  author: {
    name: string
    avatar: string
  }
  createdAt: string
  upvotes: number
  downvotes: number
  comments: number
  mentionedProducts: Array<{
    id: string
    name: string
  }>
}

export function ThreadList() {
  const [threads, setThreads] = useState<Thread[]>([]) // This will be populated from your database

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  return (
    <div className="space-y-4">
      {threads.map((thread) => (
        <Card key={thread.id} className="p-4">
          <div className="flex items-start space-x-4">
            <img
              src={thread.author.avatar}
              alt={thread.author.name}
              className="w-10 h-10 rounded-full"
            />
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <h3 className="font-medium">{thread.author.name}</h3>
                <span className="text-sm text-muted-foreground">
                  • {formatDate(thread.createdAt)}
                </span>
              </div>
              <p className="mt-2">{thread.content}</p>
              {thread.mentionedProducts.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {thread.mentionedProducts.map((product) => (
                    <span
                      key={product.id}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary"
                    >
                      @{product.name}
                    </span>
                  ))}
                </div>
              )}
              <div className="mt-4 flex items-center space-x-4">
                <Button variant="ghost" size="sm" className="space-x-1">
                  <ThumbsUp className="w-4 h-4" />
                  <span>{thread.upvotes}</span>
                </Button>
                <Button variant="ghost" size="sm" className="space-x-1">
                  <ThumbsDown className="w-4 h-4" />
                  <span>{thread.downvotes}</span>
                </Button>
                <Button variant="ghost" size="sm" className="space-x-1">
                  <MessageSquare className="w-4 h-4" />
                  <span>{thread.comments}</span>
                </Button>
                <Button variant="ghost" size="sm">
                  <Share2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </Card>
      ))}
      {threads.length === 0 && (
        <Card className="p-8">
          <p className="text-center text-muted-foreground">
            No threads yet. Be the first to start a discussion!
          </p>
        </Card>
      )}
    </div>
  )
} 