"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MessageSquare, Users, ArrowRight } from "lucide-react"
import Link from "next/link"
import { mockThreads } from "@/lib/mock-threads"
import { formatDistanceToNow } from "date-fns"

export function CommunitiesPreview() {
  // Get top 2 most upvoted threads
  const topThreads = [...mockThreads]
    .sort((a, b) => b.upvotes - a.upvotes)
    .slice(0, 2)

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Gaming Communities</h2>
          <p className="mt-2 text-muted-foreground">
            Join discussions about your favorite games and gear
          </p>
        </div>
        <Button asChild>
          <Link href="/community">
            Join the Community
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {topThreads.map((thread, index) => (
          <motion.div
            key={thread.id}
            initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.2 }}
          >
            <Card className="group transition-all duration-300 hover:shadow-lg">
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
                    {thread.commentCount}
                  </div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    {thread.upvotes} upvotes
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  )
}