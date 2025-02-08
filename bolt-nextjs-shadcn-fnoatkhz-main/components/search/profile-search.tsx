"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Search, Users } from "lucide-react"
import Link from "next/link"
import { UserProfile } from "@/types/user"

interface ProfileSearchProps {
  onSearch?: (query: string) => void
  showAllResults?: boolean
}

export function ProfileSearch({ onSearch, showAllResults = false }: ProfileSearchProps) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<UserProfile[]>([])

  const handleSearch = async (value: string) => {
    setQuery(value)
    onSearch?.(value)

    // TODO: Implement actual search
    // For now, return mock results
    if (value.length > 0) {
      setResults([
        {
          id: "1",
          username: "ProGamer",
          email: "progamer@example.com",
          avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=ProGamer",
          isOnline: true,
          isPublic: true,
          preferredAccessories: [],
          activityLog: [],
          createdAt: Date.now(),
          lastSeen: Date.now()
        }
      ])
    } else {
      setResults([])
    }
  }

  return (
    <div className="w-full">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search profiles..."
          className="pl-9"
        />
      </div>

      {results.length > 0 && (
        <div className="mt-2 rounded-lg border bg-card p-2">
          {results.slice(0, showAllResults ? undefined : 3).map((user) => (
            <Link
              key={user.id}
              href={`/profile/${user.username}`}
              className="flex items-center gap-3 rounded-md p-2 hover:bg-muted/50"
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src={user.avatarUrl} />
                <AvatarFallback>{user.username[0]}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-medium">{user.username}</p>
                <p className="text-sm text-muted-foreground">
                  {user.isOnline ? "Online" : "Offline"}
                </p>
              </div>
            </Link>
          ))}
          
          {!showAllResults && results.length > 3 && (
            <Link
              href="/search"
              className="mt-2 flex items-center justify-center gap-2 rounded-md p-2 text-sm text-primary hover:bg-muted/50"
            >
              <Users className="h-4 w-4" />
              See all results
            </Link>
          )}
        </div>
      )}
    </div>
  )
}