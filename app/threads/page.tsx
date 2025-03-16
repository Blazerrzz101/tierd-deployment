"use client"

import { useEffect, useState } from "react"
import { Thread } from "@/types/thread"
import { ThreadCard } from "@/components/threads/thread-card"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { useRouter } from "next/navigation"
import { CreateThreadDialog } from "@/components/threads/create-thread-dialog"
import { useAuth } from "@/hooks/use-auth"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CATEGORY_IDS } from "@/lib/constants"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { threadStore } from "@/lib/local-storage/thread-store"

export default function ThreadsPage() {
  const [threads, setThreads] = useState<Thread[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    const loadThreads = () => {
      setIsLoading(true)
      try {
        let allThreads = threadStore.getThreads()
        
        // Filter by category if selected
        if (selectedCategory !== "all") {
          allThreads = allThreads.filter(thread => 
            thread.taggedProducts.some(product => 
              product.category === selectedCategory
            )
          )
        }

        // Sort by creation date
        allThreads.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )

        setThreads(allThreads)
      } catch (error) {
        console.error("Error loading threads:", error)
        setThreads([])
      } finally {
        setIsLoading(false)
      }
    }

    loadThreads()

    // Add event listener for storage changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "tierd_threads") {
        loadThreads()
      }
    }
    
    window.addEventListener("storage", handleStorageChange)
    return () => window.removeEventListener("storage", handleStorageChange)
  }, [selectedCategory])

  const handleCreateClick = () => {
    if (!user) {
      router.push('/auth/sign-in')
      return
    }
    setShowCreateDialog(true)
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-12">
      <div className="mb-10 pb-8 border-b border-yellow-500/50">
        <h1 className="text-5xl font-extrabold tracking-tight bg-gradient-to-r from-white via-yellow-300 to-green-300 bg-clip-text text-transparent mb-4">Discussions</h1>
        <p className="text-xl text-muted-foreground">
          Connect with fellow enthusiasts and directly integrate with product reviews. Share your experiences and gain insights from the community.
        </p>
      </div>

      <div className="mb-10">
        <div className="rounded-xl p-6 border border-green-500/20 bg-black/40 backdrop-blur-sm hover:border-green-500/40 transition-all">
          <h2 className="text-lg font-semibold mb-3 text-green-300">Start a new discussion</h2>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <p className="text-muted-foreground mb-2">
                Tag products in your thread to help others find valuable discussions about their favorite gear.
              </p>
            </div>
            <Button 
              onClick={handleCreateClick}
              size="lg"
              className="bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white border-none"
            >
              <Plus className="mr-2 h-5 w-5" />
              New Thread
            </Button>
          </div>
        </div>
      </div>

      <Tabs defaultValue="all" className="mb-8">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="all" onClick={() => setSelectedCategory("all")}>
            All Discussions
          </TabsTrigger>
          {Object.values(CATEGORY_IDS).map(category => (
            <TabsTrigger 
              key={category}
              value={category}
              onClick={() => setSelectedCategory(category)}
            >
              {category.replace('Gaming ', '')}
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
        ) : threads.length > 0 ? (
          threads.map(thread => (
            <ThreadCard key={thread.localId || thread.id} thread={thread} />
          ))
        ) : (
          <div className="flex min-h-[300px] flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
            <h2 className="text-xl font-semibold">No threads yet</h2>
            <p className="mt-2 text-muted-foreground">
              {selectedCategory === "all"
                ? "Be the first to start a discussion"
                : `No discussions yet in ${selectedCategory.replace('Gaming ', '')}`
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