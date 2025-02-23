"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { toast } from "sonner"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { formatDistanceToNow } from "date-fns"
import { ThumbsUp, ThumbsDown, Trash2, Tag } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"

interface ThreadCardProps {
  thread: {
    id: string
    title: string
    content: string
    user_id: string
    created_at: string
    upvotes: number
    downvotes: number
    tags: string[]
    user: {
      email: string
      user_metadata: {
        avatar_url?: string
        full_name?: string
      }
    }
  }
  userVote?: "up" | "down" | null
  onVoteChange?: () => void
}

export function ThreadCard({ thread, userVote, onVoteChange }: ThreadCardProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [localVote, setLocalVote] = useState(userVote)
  const [localUpvotes, setLocalUpvotes] = useState(thread.upvotes)
  const [localDownvotes, setLocalDownvotes] = useState(thread.downvotes)
  const router = useRouter()
  const supabase = createClientComponentClient()
  const { user } = useAuth()

  const handleVote = async (voteType: "up" | "down") => {
    if (!user) {
      toast.error("Please sign in to vote")
      router.push("/auth/sign-in")
      return
    }

    if (isLoading) return

    setIsLoading(true)
    try {
      // If voting the same way, remove the vote
      const finalVoteType = localVote === voteType ? null : voteType

      const { error } = await supabase.rpc("vote_for_thread", {
        p_thread_id: thread.id,
        p_vote_type: finalVoteType
      })

      if (error) throw error

      // Update local state
      setLocalVote(finalVoteType)
      if (finalVoteType === "up") {
        setLocalUpvotes(prev => prev + 1)
        if (localVote === "down") {
          setLocalDownvotes(prev => prev - 1)
        }
      } else if (finalVoteType === "down") {
        setLocalDownvotes(prev => prev + 1)
        if (localVote === "up") {
          setLocalUpvotes(prev => prev - 1)
        }
      } else {
        // Removing vote
        if (localVote === "up") {
          setLocalUpvotes(prev => prev - 1)
        } else if (localVote === "down") {
          setLocalDownvotes(prev => prev - 1)
        }
      }

      onVoteChange?.()
    } catch (error) {
      toast.error("Failed to vote. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!user || user.id !== thread.user_id) return

    try {
      const { error } = await supabase
        .from("threads")
        .delete()
        .eq("id", thread.id)

      if (error) throw error

      toast.success("Thread deleted successfully")
      router.refresh()
    } catch (error) {
      toast.error("Failed to delete thread")
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            <Avatar>
              <AvatarImage src={thread.user.user_metadata.avatar_url} />
              <AvatarFallback>
                {thread.user.email?.[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-lg">
                <Link href={`/thread/${thread.id}`} className="hover:underline">
                  {thread.title}
                </Link>
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Posted by {thread.user.user_metadata.full_name || thread.user.email}{" "}
                {formatDistanceToNow(new Date(thread.created_at), { addSuffix: true })}
              </p>
            </div>
          </div>
          {user?.id === thread.user_id && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDelete}
              className="text-destructive hover:text-destructive/90"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <p className="whitespace-pre-wrap">{thread.content}</p>
        {thread.tags?.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {thread.tags.map(tag => (
              <Badge key={tag} variant="secondary">
                <Tag className="mr-1 h-3 w-3" />
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
      <CardFooter>
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            className={localVote === "up" ? "text-green-500" : ""}
            onClick={() => handleVote("up")}
            disabled={isLoading}
          >
            <ThumbsUp className="mr-1 h-4 w-4" />
            {localUpvotes}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={localVote === "down" ? "text-red-500" : ""}
            onClick={() => handleVote("down")}
            disabled={isLoading}
          >
            <ThumbsDown className="mr-1 h-4 w-4" />
            {localDownvotes}
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
} 