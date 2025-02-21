import { Thread } from "@/types/thread"
import { Product } from "@/types/product"

const STORAGE_KEY = "tierd_threads"

interface LocalThread extends Thread {
  taggedProducts: Product[]
  localId: string
}

export const threadStore = {
  getThreads: (): LocalThread[] => {
    if (typeof window === "undefined") return []
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  },

  addThread: (thread: Omit<LocalThread, "localId">): LocalThread => {
    const threads = threadStore.getThreads()
    const newThread = {
      ...thread,
      localId: `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      upvotes: 0,
      downvotes: 0,
    }
    threads.push(newThread)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(threads))
    return newThread
  },

  updateThread: (threadId: string, updates: Partial<LocalThread>): LocalThread | null => {
    const threads = threadStore.getThreads()
    const index = threads.findIndex(t => t.localId === threadId)
    if (index === -1) return null

    const updatedThread = {
      ...threads[index],
      ...updates,
      updated_at: new Date().toISOString()
    }
    threads[index] = updatedThread
    localStorage.setItem(STORAGE_KEY, JSON.stringify(threads))
    return updatedThread
  },

  deleteThread: (threadId: string): boolean => {
    const threads = threadStore.getThreads()
    const filtered = threads.filter(t => t.localId !== threadId)
    if (filtered.length === threads.length) return false
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
    return true
  },

  getThreadsByProduct: (productId: string): LocalThread[] => {
    return threadStore.getThreads().filter(thread => 
      thread.taggedProducts.some(product => product.id === productId)
    )
  }
} 