"use client"

import { useEffect, useState } from "react"
import { Thread } from "@/types/thread"
import { getSupabaseClient } from "@/lib/supabase/client"
import { ThreadCard } from "@/components/threads/thread-card"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { useRouter } from "next/navigation"
import { CreateThreadDialog } from "@/components/threads/create-thread-dialog"
import { useAuth } from "@/hooks/use-auth"
import { Product } from "@/types/product"

interface ThreadResponse {
  id: string
  title: string
  content: string
  user_id: string
  created_at: string
  updated_at: string
  upvotes: number
  downvotes: number
  mentioned_products: string[]
  is_pinned: boolean
  is_locked: boolean
  user: Array<{
    username: string
    avatar_url?: string | null
  }>
  products: Array<{
    products: Product
  }>
}

export default function ThreadsPage() {
  const [threads, setThreads] = useState<Thread[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const { user } = useAuth()
  const router = useRouter()
  const supabase = getSupabaseClient()

  useEffect(() => {
    async function fetchThreads() {
      try {
        const { data, error } = await supabase
          .from('threads')
          .select(`
            *,
            user:users(username, avatar_url),
            products:thread_products(products(*))
          `)
          .order('created_at', { ascending: false })

        if (error) throw error

        if (data) {
          const transformedThreads = (data as ThreadResponse[]).map(thread => ({
            ...thread,
            user: {
              ...thread.user[0],
              avatar_url: thread.user[0]?.avatar_url || undefined
            },
            products: thread.products.map(p => p.products)
          }))
          setThreads(transformedThreads)
        }
      } catch (error) {
        console.error('Error fetching threads:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchThreads()
  }, [supabase])

  const handleCreateClick = () => {
    if (!user) {
      router.push('/auth/sign-in')
      return
    }
    setShowCreateDialog(true)
  }

  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-40 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="container max-w-4xl py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Discussions</h1>
          <p className="text-muted-foreground">
            Join the conversation about gaming gear
          </p>
        </div>
        <Button onClick={handleCreateClick}>
          <Plus className="mr-2 h-4 w-4" />
          New Thread
        </Button>
      </div>

      <div className="space-y-4">
        {threads.map(thread => (
          <ThreadCard key={thread.id} thread={thread} />
        ))}
        {threads.length === 0 && (
          <div className="rounded-lg border p-8 text-center">
            <h2 className="text-lg font-semibold">No threads yet</h2>
            <p className="text-muted-foreground">
              Be the first to start a discussion
            </p>
          </div>
        )}
      </div>

      <CreateThreadDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
      />
    </div>
  )
} 