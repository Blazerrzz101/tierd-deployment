"use client"

import { useState } from "react"
import { formatDistanceToNow } from "date-fns"
import { Thread } from "@/types"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MessageSquare, ThumbsUp } from "lucide-react"

interface ThreadCardProps {
  thread: Thread
}

export function ThreadCard({ thread }: ThreadCardProps) {
  const [upvotes, setUpvotes] = useState(thread.upvotes)
  const [hasUpvoted, setHasUpvoted] = useState(false)

  const handleUpvote = () => {
    if (hasUpvoted) {
      setUpvotes(prev => prev - 1)
      setHasUpvoted(false)
    } else {
      setUpvotes(prev => prev + 1)
      setHasUpvoted(true)
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-4">
        <Avatar>
          <AvatarImage src={thread.author.image} />
          <AvatarFallback>{thread.author.name[0]}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold">{thread.author.name}</span>
            <span className="text-sm text-muted-foreground">
              {formatDistanceToNow(new Date(thread.createdAt), { addSuffix: true })}
            </span>
          </div>
          <div className="mt-1 flex items-center gap-2">
            <Badge variant="secondary">{thread.category}</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <h3 className="text-lg font-semibold">{thread.title}</h3>
        <p className="text-muted-foreground">{thread.content}</p>
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleUpvote}
            className={hasUpvoted ? "text-primary" : ""}
          >
            <ThumbsUp className="mr-2 h-4 w-4" />
            {upvotes}
          </Button>
          <Button variant="ghost" size="sm">
            <MessageSquare className="mr-2 h-4 w-4" />
            {thread.commentCount}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}