"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase/client"
import { formatDistanceToNow } from "date-fns"
import Link from "next/link"
import { MessageSquare } from "lucide-react"

interface Thread {
  thread_id: string
  title: string
  content: string
  author_id: string
  created_at: string
}

interface ProductMentionsProps {
  productId: string
}

export function ProductMentions({ productId }: ProductMentionsProps) {
  const [threads, setThreads] = useState<Thread[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchMentions() {
      try {
        const { data, error } = await supabase
          .rpc('get_product_threads', {
            p_product_id: productId
          })

        if (error) throw error
        setThreads(data || [])
      } catch (error) {
        console.error('Error fetching product mentions:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchMentions()
  }, [productId])

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 rounded-lg bg-white/5" />
        ))}
      </div>
    )
  }

  if (threads.length === 0) {
    return (
      <div className="rounded-lg border border-white/10 bg-white/5 p-8 text-center">
        <MessageSquare className="mx-auto h-8 w-8 text-muted-foreground" />
        <p className="mt-2 text-muted-foreground">
          No discussions mentioning this product yet
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Discussions</h3>
      <div className="divide-y divide-white/10">
        {threads.map((thread) => (
          <Link
            key={thread.thread_id}
            href={`/threads/${thread.thread_id}`}
            className="block space-y-2 py-4 transition-colors hover:bg-white/5"
          >
            <h4 className="font-medium text-white/90">{thread.title}</h4>
            <p className="line-clamp-2 text-sm text-white/70">
              {thread.content}
            </p>
            <div className="text-xs text-white/50">
              {formatDistanceToNow(new Date(thread.created_at), { addSuffix: true })}
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
} 