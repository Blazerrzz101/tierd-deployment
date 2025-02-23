"use client"

import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase/client"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Button } from "@/components/ui/button"
import { MessageSquarePlus } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { useRouter } from "next/navigation"
import { formatTimeAgo } from "@/lib/utils"
import { ThreadCard } from "@/components/threads/thread-card"
import { Thread } from "@/types/thread"

interface ProductThreadsProps {
  productId: string
  threads?: Array<{
    id: string
    title: string
    content: string
    created_at: string
    user: {
      id: string
      username: string
      avatar_url: string | null
    }
  }>
}

interface ThreadWithCounts extends Omit<Thread, 'taggedProducts'> {
  _count: {
    replies: number
    votes: number
  }
}

export function ProductThreads({ productId, threads: initialThreads }: ProductThreadsProps) {
  const { user } = useAuth()
  const router = useRouter()

  const { data: product } = useQuery({
    queryKey: ["product", productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", productId)
        .single()

      if (error) throw error
      return data
    },
  })

  const { data: threads, isLoading } = useQuery({
    queryKey: ["product-threads", productId],
    queryFn: async () => {
      if (initialThreads) return initialThreads

      const { data, error } = await supabase
        .from("threads")
        .select(`
          *,
          user:users (
            id,
            username,
            avatar_url
          ),
          _count (
            replies,
            votes
          )
        `)
        .eq("product_id", productId)
        .order("created_at", { ascending: false })

      if (error) throw error
      return data
    },
    initialData: initialThreads
  })

  const handleCreateThread = () => {
    if (!user) {
      router.push("/auth/sign-in")
      return
    }
    // TODO: Implement thread creation dialog
  }

  if (isLoading) {
    return (
      <div className="flex h-[200px] items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold">
          Discussions ({threads?.length || 0})
        </h3>
        <Button onClick={handleCreateThread}>
          <MessageSquarePlus className="mr-2 h-4 w-4" />
          Start Discussion
        </Button>
      </div>

      {threads?.length === 0 ? (
        <div className="rounded-lg border border-white/10 bg-white/5 p-6 text-center">
          <p className="text-muted-foreground">
            No discussions yet. Start a new discussion about this product!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {threads?.map((thread) => (
            <ThreadCard
              key={thread.id}
              thread={{
                ...thread,
                taggedProducts: [{
                  id: productId,
                  name: product?.name || "",
                  description: product?.description || "",
                  category: product?.category || "",
                  url_slug: product?.url_slug || "",
                  image_url: product?.image_url || "",
                  price: product?.price || 0,
                  specifications: product?.specifications || {},
                  is_active: product?.is_active || false,
                  upvotes: product?.upvotes || 0,
                  downvotes: product?.downvotes || 0,
                  score: product?.score || 0,
                  rank: product?.rank || 0
                }]
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
} 