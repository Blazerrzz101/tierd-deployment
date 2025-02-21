"use client"

import { useEffect, useState } from "react"
import { notFound } from "next/navigation"
import { Thread } from "@/types/thread"
import { threadStore } from "@/lib/local-storage/thread-store"
import { ThreadCard } from "@/components/threads/thread-card"

interface ThreadPageProps {
  params: {
    id: string
  }
}

export default function ThreadPage({ params }: ThreadPageProps) {
  const [thread, setThread] = useState<Thread | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadThread = () => {
      const threads = threadStore.getThreads()
      const found = threads.find(t => t.localId === params.id || t.id === params.id)
      if (found) {
        setThread(found)
      }
      setLoading(false)
    }

    loadThread()

    // Listen for storage changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "threads") {
        loadThread()
      }
    }

    window.addEventListener("storage", handleStorageChange)
    return () => window.removeEventListener("storage", handleStorageChange)
  }, [params.id])

  if (loading) {
    return (
      <div className="container py-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-2/3 rounded bg-white/5" />
          <div className="h-32 rounded bg-white/5" />
        </div>
      </div>
    )
  }

  if (!thread) {
    notFound()
  }

  return (
    <div className="container py-6">
      <ThreadCard thread={thread} />
    </div>
  )
} 