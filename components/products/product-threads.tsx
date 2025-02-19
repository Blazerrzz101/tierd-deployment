import { useQuery } from '@tanstack/react-query'
import { ThreadCard } from '@/components/threads/thread-card'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { ThreadManager } from '@/lib/supabase/thread-manager'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface ProductThreadsProps {
  productId: string
}

export function ProductThreads({ productId }: ProductThreadsProps) {
  const { data: threads, isLoading, error, refetch } = useQuery({
    queryKey: ['product-threads', productId],
    queryFn: () => ThreadManager.getThreadsForProduct(productId),
    staleTime: 1000 * 60 * 5, // Consider data fresh for 5 minutes
    retry: 2
  })

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner />
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive" className="my-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          <div className="space-y-2">
            <p>Failed to load discussions. {error.message}</p>
            <Button onClick={() => refetch()} variant="outline" size="sm">
              Try again
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    )
  }

  if (!threads?.length) {
    return (
      <div className="rounded-lg border border-white/10 bg-white/5 p-8 text-center">
        <MessageSquare className="mx-auto h-8 w-8 text-muted-foreground" />
        <p className="mt-2 text-muted-foreground">
          No discussions mentioning this product yet
        </p>
        <Button asChild className="mt-4">
          <Link href="/threads/new">Start a Discussion</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Discussions</h3>
        <Button asChild variant="outline" size="sm">
          <Link href="/threads/new">New Discussion</Link>
        </Button>
      </div>
      <div className="divide-y divide-white/10">
        {threads.map((thread) => (
          <ThreadCard key={thread.id} thread={thread} />
        ))}
      </div>
    </div>
  )
} 