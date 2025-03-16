"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, MessageSquare, Users, TrendingUp } from "lucide-react"
import { categories } from "@/lib/data"
import { mockThreads } from "@/lib/mock-threads"

export function ForumSection() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr,300px]">
      {/* Main Content */}
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input 
              placeholder="Search discussions..." 
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button>New Discussion</Button>
        </div>

        <div className="space-y-4">
          {mockThreads.map((thread) => (
            <Card key={thread.id} className="p-6 transition-all hover:shadow-md">
              <div className="flex items-start gap-4">
                <div className="flex-1 space-y-1">
                  <h3 className="font-semibold hover:text-primary">{thread.title}</h3>
                  <p className="line-clamp-2 text-sm text-muted-foreground">{thread.content}</p>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MessageSquare className="h-4 w-4" />
                  {thread.commentCount}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        {/* Categories */}
        <Card className="p-4">
          <h3 className="mb-4 font-semibold">Categories</h3>
          <div className="space-y-1">
            {categories.map((category) => (
              <Button
                key={category.id}
                variant="ghost"
                className="w-full justify-start"
                onClick={() => setSelectedCategory(category.id)}
              >
                {category.name}
              </Button>
            ))}
          </div>
        </Card>

        {/* Trending Topics */}
        <Card className="p-4">
          <h3 className="mb-4 font-semibold">Trending Topics</h3>
          <div className="space-y-4">
            {mockThreads.slice(0, 3).map((thread) => (
              <div key={thread.id} className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                <span className="text-sm">{thread.title}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}