"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MessageSquare, ArrowRight } from "lucide-react"
import { mockThreads } from "@/lib/mock-threads"
import { formatDistanceToNow } from "date-fns"
import Link from "next/link"

interface CommunityDiscussionsProps {
  productId: string
}

export function CommunityDiscussions({ productId }: CommunityDiscussionsProps) {
  // Get relevant threads for this product (mock data for now)
  const relevantThreads = mockThreads.slice(0, 2)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Community Discussions</h2>
          <p className="text-muted-foreground">
            Join the conversation about this product
          </p>
        </div>
        <Button asChild>
          <Link href="/community">
            View All Discussions
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        {relevantThreads.map((thread) => (
          <Card key={thread.id} className="group transition-all hover:shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
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
              </div>

              <Link href="/community" className="mt-4 block group-hover:text-primary">
                <h3 className="text-lg font-semibold transition-colors">
                  {thread.title}
                </h3>
              </Link>
              <p className="mt-2 line-clamp-2 text-muted-foreground">
                {thread.content}
              </p>

              <div className="mt-4 flex items-center gap-4">
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <MessageSquare className="h-4 w-4" />
                  {thread.commentCount} comments
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}