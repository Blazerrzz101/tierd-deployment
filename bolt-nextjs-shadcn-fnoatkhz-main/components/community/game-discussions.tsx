"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MessageSquare, ThumbsUp, ThumbsDown } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { cn } from "@/lib/utils"

interface GameDiscussionsProps {
  gameId: string
}

export function GameDiscussions({ gameId }: GameDiscussionsProps) {
  // This will be replaced with real data later
  const discussions = [
    {
      id: "1",
      title: "Mechanical Keyboard Addicts",
      content: "What's your favorite switch type for gaming? I'm currently using Cherry MX Reds but considering trying out some Gateron Yellows.",
      author: {
        name: "KeyboardEnthusiast",
        image: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=32&h=32&fit=crop"
      },
      createdAt: "2024-03-20T08:00:00Z",
      upvotes: 24,
      downvotes: 2,
      comments: 12
    },
    {
      id: "2",
      title: "Best Mouse Settings for Pro Play",
      content: "Let's discuss optimal DPI and sensitivity settings for competitive gaming. What's working for you?",
      author: {
        name: "ProGamer123",
        image: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=32&h=32&fit=crop"
      },
      createdAt: "2024-03-19T15:30:00Z",
      upvotes: 45,
      downvotes: 3,
      comments: 28
    }
  ]

  return (
    <div className="space-y-4">
      {discussions.map((discussion) => (
        <Card key={discussion.id} className="group transition-all duration-300 hover:shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="flex flex-col items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 rounded-full hover:text-green-500"
                >
                  <ThumbsUp className="h-4 w-4" />
                </Button>
                <span className="text-sm font-medium">
                  {discussion.upvotes - discussion.downvotes}
                </span>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 rounded-full hover:text-red-500"
                >
                  <ThumbsDown className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={discussion.author.image} />
                    <AvatarFallback>{discussion.author.name[0]}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm text-muted-foreground">
                    Posted by {discussion.author.name}{" "}
                    {formatDistanceToNow(new Date(discussion.createdAt), { addSuffix: true })}
                  </span>
                </div>

                <h4 className="mt-2 text-lg font-semibold">{discussion.title}</h4>
                <p className="mt-2 text-muted-foreground">{discussion.content}</p>

                <div className="mt-4 flex items-center gap-4">
                  <Button variant="ghost" size="sm">
                    <MessageSquare className="mr-2 h-4 w-4" />
                    {discussion.comments} Comments
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}