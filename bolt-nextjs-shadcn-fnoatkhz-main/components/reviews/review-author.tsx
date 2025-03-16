"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

interface ReviewAuthorProps {
  username: string
  avatarUrl?: string
  badge?: string
  timestamp: string
}

export function ReviewAuthor({ username, avatarUrl, badge, timestamp }: ReviewAuthorProps) {
  return (
    <div className="flex items-center gap-3">
      <Link href={`/profile/${username}`}>
        <Avatar>
          <AvatarImage 
            src={avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`} 
          />
          <AvatarFallback>{username[0]}</AvatarFallback>
        </Avatar>
      </Link>
      <div>
        <div className="flex items-center gap-2">
          <Link 
            href={`/profile/${username}`}
            className="font-semibold hover:text-primary"
          >
            {username}
          </Link>
          {badge && (
            <Badge variant="secondary" className="text-xs">
              {badge}
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground">{timestamp}</p>
      </div>
    </div>
  )
}