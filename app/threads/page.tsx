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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { categories } from "@/lib/data"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

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
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()
  const router = useRouter()
  const supabase = getSupabaseClient()

  useEffect(() => {
    let isMounted = true
    
    async function fetchThreads() {
      try {
        setIsLoading(true)
        setError(null)

        let query = supabase
          .from('threads')
          .select(`
            *,
            user:users(username, avatar_url),
            products:thread_products(products(*))
          `)
          .order('created_at', { ascending: false })

        if (selectedCategory !== "all") {
          query = query.eq('products.products.category', selectedCategory)
        }

        const { data, error } = await query

        if (error) throw error

        if (data && isMounted) {
          const transformedThreads = data.map(thread => ({
            ...thread,
            user: {
              ...thread.user[0],
              avatar_url: thread.user[0]?.avatar_url || undefined
            },
            products: thread.products?.map((p: { products: Product }) => p.products) || []
          }))
          setThreads(transformedThreads)
        }
      } catch (error) {
        console.error('Error fetching threads:', error)
        if (isMounted) {
          setError('Failed to load discussions. Please try again.')
          setThreads([])
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    fetchThreads()
    return () => { isMounted = false }
  }, [supabase, selectedCategory])

  const handleCreateClick = () => {
    if (!user) {
      router.push('/auth/sign-in')
      return
    }
    setShowCreateDialog(true)
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-12">
      <div className="mb-8 flex flex-col items-center text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Community Discussions</h1>
          <p className="mt-2 text-lg text-muted-foreground">
            Join conversations about your favorite gaming gear
          </p>
        </div>
        <Button 
          onClick={handleCreateClick}
          className="mt-4 sm:mt-0"
          size="lg"
        >
          <Plus className="mr-2 h-5 w-5" />
          New Thread
        </Button>
      </div>

      <Tabs defaultValue="all" className="mb-8">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="all" onClick={() => setSelectedCategory("all")}>
            All Discussions
          </TabsTrigger>
          {categories.map(category => (
            <TabsTrigger 
              key={category.id}
              value={category.id}
              onClick={() => setSelectedCategory(category.id)}
            >
              {category.name}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="space-y-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <LoadingSpinner size="lg" />
            <p className="mt-4 text-muted-foreground">
              Loading discussions...
            </p>
          </div>
        ) : error ? (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-8 text-center">
            <h3 className="text-lg font-semibold text-destructive mb-2">Error Loading Discussions</h3>
            <p className="text-destructive/80 mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="text-sm font-medium text-destructive hover:text-destructive/80 underline underline-offset-4"
            >
              Try Again
            </button>
          </div>
        ) : threads.length > 0 ? (
          threads.map(thread => (
            <ThreadCard key={thread.id} thread={thread} />
          ))
        ) : (
          <div className="flex min-h-[300px] flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
            <h2 className="text-xl font-semibold">No threads yet</h2>
            <p className="mt-2 text-muted-foreground">
              {selectedCategory === "all"
                ? "Be the first to start a discussion"
                : `No discussions yet in ${categories.find(c => c.id === selectedCategory)?.name}`
              }
            </p>
            <Button 
              onClick={handleCreateClick}
              variant="outline" 
              className="mt-4"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Thread
            </Button>
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