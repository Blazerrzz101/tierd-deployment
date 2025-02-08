"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { MessageSquare, ThumbsUp } from "lucide-react"
import { mockThreads } from "@/lib/mock-threads"
import { formatDistanceToNow } from "date-fns"
import Link from "next/link"

export function CommunityHighlights() {
  // Get the top 2 most upvoted threads
  const topThreads = [...mockThreads]
    .sort((a, b) => b.upvotes - a.upvotes)
    .slice(0, 2)

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {topThreads.map((thread) => (
        <Card key={thread.id} className="group transition-all duration-300 hover:shadow-lg">
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
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link href="/community" className="group-hover:text-primary">
              <h3 className="text-lg font-semibold transition-colors">{thread.title}</h3>
            </Link>
            <p className="line-clamp-2 text-muted-foreground">{thread.content}</p>
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm">
                <ThumbsUp className="mr-2 h-4 w-4" />
                {thread.upvotes}
              </Button>
              <Button variant="ghost" size="sm">
                <MessageSquare className="mr-2 h-4 w-4" />
                {thread.commentCount}
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}