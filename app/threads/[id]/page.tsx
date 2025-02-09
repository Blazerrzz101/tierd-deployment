"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Thread, ThreadComment } from "@/types/thread"
import { getSupabaseClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ThumbsUp, ThumbsDown, MessageSquare } from "lucide-react"
import { formatTimeAgo } from "@/lib/utils"
import { useAuth } from "@/hooks/use-auth"
import { toast } from "sonner"
import Link from "next/link"

interface ThreadPageProps {
  params: {
    id: string
  }
}

export default function ThreadPage({ params }: ThreadPageProps) {
  const [thread, setThread] = useState<Thread | null>(null)
  const [comments, setComments] = useState<ThreadComment[]>([])
  const [newComment, setNewComment] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { user } = useAuth()
  const router = useRouter()
  const supabase = getSupabaseClient()

  useEffect(() => {
    async function loadThread() {
      try {
        // Fetch thread
        const { data: threadData, error: threadError } = await supabase
          .from('threads')
          .select(`
            *,
            user:users(username, avatar_url),
            products:thread_products(products(*))
          `)
          .eq('id', params.id)
          .single()

        if (threadError) throw threadError

        // Fetch comments
        const { data: commentsData, error: commentsError } = await supabase
          .from('thread_comments')
          .select(`
            *,
            user:users(username, avatar_url)
          `)
          .eq('thread_id', params.id)
          .order('created_at', { ascending: true })

        if (commentsError) throw commentsError

        // Transform data
        const transformedThread = {
          ...threadData,
          user: threadData.user?.[0],
          products: threadData.products?.map(p => p.products)
        }

        setThread(transformedThread)
        setComments(commentsData)
      } catch (error) {
        console.error('Error loading thread:', error)
        toast.error('Failed to load thread')
      } finally {
        setIsLoading(false)
      }
    }

    loadThread()
  }, [params.id, supabase])

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !thread) return

    setIsSubmitting(true)
    try {
      const { error } = await supabase
        .from('thread_comments')
        .insert({
          thread_id: thread.id,
          user_id: user.id,
          content: newComment
        })

      if (error) throw error

      toast.success('Comment added successfully')
      setNewComment("")
      router.refresh()
    } catch (error) {
      console.error('Error adding comment:', error)
      toast.error('Failed to add comment')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="space-y-4">
          <div className="h-40 animate-pulse rounded-lg bg-muted" />
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!thread) {
    return (
      <div className="container py-8">
        <Card>
          <CardContent className="py-8 text-center">
            <h2 className="text-lg font-semibold">Thread not found</h2>
            <p className="text-muted-foreground">
              The thread you're looking for doesn't exist or has been removed.
            </p>
            <Button
              onClick={() => router.push('/threads')}
              className="mt-4"
            >
              Back to Threads
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container py-8">
      <Card>
        <CardHeader className="flex flex-row items-start gap-4 space-y-0">
          <Avatar className="h-10 w-10">
            <AvatarImage src={thread.user?.avatar_url || ""} />
            <AvatarFallback>
              {thread.user?.username?.[0]?.toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold">
                {thread.user?.username || "Anonymous"}
              </span>
              <span className="text-xs text-muted-foreground">
                {formatTimeAgo(thread.created_at)}
              </span>
              {thread.is_pinned && (
                <Badge variant="secondary">Pinned</Badge>
              )}
            </div>
            <h1 className="text-2xl font-bold">{thread.title}</h1>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">{thread.content}</p>
          {thread.products && thread.products.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {thread.products.map(product => (
                <Link 
                  key={product.id} 
                  href={`/products/${product.url_slug}`}
                  className="inline-flex items-center"
                >
                  <Badge variant="outline" className="hover:bg-primary hover:text-primary-foreground">
                    @{product.name}
                  </Badge>
                </Link>
              ))}
            </div>
          )}
          <div className="flex items-center gap-4 border-t pt-4">
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <ThumbsUp className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground">
                {thread.upvotes - thread.downvotes}
              </span>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <ThumbsDown className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center gap-1">
              <MessageSquare className="h-4 w-4" />
              <span className="text-sm text-muted-foreground">
                {comments.length} comments
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="mt-8 space-y-4">
        {user ? (
          <form onSubmit={handleSubmitComment} className="space-y-4">
            <Textarea
              placeholder="Write a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              required
            />
            <div className="flex justify-end">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Posting..." : "Post Comment"}
              </Button>
            </div>
          </form>
        ) : (
          <Card>
            <CardContent className="py-4 text-center">
              <p className="text-muted-foreground">
                Please{" "}
                <Link href="/auth/sign-in" className="text-primary hover:underline">
                  sign in
                </Link>{" "}
                to join the discussion.
              </p>
            </CardContent>
          </Card>
        )}

        <div className="space-y-4">
          {comments.map(comment => (
            <Card key={comment.id}>
              <CardHeader className="flex flex-row items-start gap-4 space-y-0">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={comment.user?.avatar_url || ""} />
                  <AvatarFallback>
                    {comment.user?.username?.[0]?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">
                      {comment.user?.username || "Anonymous"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatTimeAgo(comment.created_at)}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {comment.content}
                  </p>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
} 