import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase/client"
import { Thread } from "@/types/thread"
import { ThreadCard } from "@/components/threads/thread-card"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

interface ProductThreadsProps {
  productId: string
}

export function ProductThreads({ productId }: ProductThreadsProps) {
  const { data: threads, isLoading } = useQuery<Thread[]>({
    queryKey: ['product-threads', productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('threads')
        .select(`
          *,
          user:user_profiles (
            id,
            display_name,
            avatar_url
          ),
          votes:thread_votes (
            id,
            type
          ),
          mentions:thread_mentions (
            product_id
          )
        `)
        .eq('mentions.product_id', productId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data
    },
    staleTime: 1000 * 60 * 5 // Consider data fresh for 5 minutes
  })

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner />
      </div>
    )
  }

  if (!threads?.length) {
    return (
      <div className="text-center py-8 text-white/50">
        <p>No discussions yet. Start a new thread!</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {threads.map((thread) => (
        <ThreadCard key={thread.id} thread={thread} />
      ))}
    </div>
  )
} 