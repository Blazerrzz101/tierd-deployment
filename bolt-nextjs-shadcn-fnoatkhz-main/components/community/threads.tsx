"use client"

import { useState } from "react"
import { ThreadCard } from "./thread-card"
import { Search } from "@/components/search"
import { mockThreads } from "@/lib/mock-threads"

export function CommunityThreads() {
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState<"recent" | "popular">("recent")

  const filteredThreads = mockThreads.filter(thread =>
    thread.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    thread.content.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const sortedThreads = [...filteredThreads].sort((a, b) => {
    if (sortBy === "recent") {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    }
    return b.upvotes - a.upvotes
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Search
          onSearch={setSearchQuery}
          className="flex-1"
          placeholder="Search discussions..."
        />
      </div>

      <div className="space-y-4">
        {sortedThreads.map((thread) => (
          <ThreadCard key={thread.id} thread={thread} />
        ))}
      </div>
    </div>
  )
}