"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { supabase } from "@/lib/supabase/client"
import { TrendingUp, Award, ThumbsUp } from "lucide-react"

interface VoteNotification {
  id: string
  type: "vote" | "rank_change"
  productName: string
  message: string
  timestamp: number
}

export function VoteNotifications() {
  const [notifications, setNotifications] = useState<VoteNotification[]>([])

  useEffect(() => {
    // Subscribe to product vote changes
    const voteSubscription = supabase
      .channel('vote_notifications')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'products',
        filter: 'votes > 0'
      }, async (payload) => {
        const { data: product } = await supabase
          .from('products')
          .select('name')
          .eq('id', payload.new.id)
          .single()

        if (!product) return

        const voteDiff = payload.new.votes - (payload.old?.votes || 0)
        if (voteDiff <= 0) return

        const notification: VoteNotification = {
          id: `vote-${Date.now()}`,
          type: "vote",
          productName: product.name,
          message: `${voteDiff} new ${voteDiff === 1 ? 'vote' : 'votes'}`,
          timestamp: Date.now()
        }

        setNotifications(prev => [notification, ...prev].slice(0, 5))
      })
      .subscribe()

    // Subscribe to ranking changes
    const rankSubscription = supabase
      .channel('rank_notifications')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'product_rankings',
        filter: 'rank <= 3'
      }, async (payload) => {
        const { data: product } = await supabase
          .from('products')
          .select('name')
          .eq('id', payload.new.product_id)
          .single()

        if (!product) return

        const rankChange = (payload.old?.rank || 99) - payload.new.rank
        if (rankChange <= 0) return

        const notification: VoteNotification = {
          id: `rank-${Date.now()}`,
          type: "rank_change",
          productName: product.name,
          message: `moved up to rank #${payload.new.rank}!`,
          timestamp: Date.now()
        }

        setNotifications(prev => [notification, ...prev].slice(0, 5))
      })
      .subscribe()

    // Cleanup
    return () => {
      voteSubscription.unsubscribe()
      rankSubscription.unsubscribe()
    }
  }, [])

  // Remove notifications after 5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now()
      setNotifications(prev => 
        prev.filter(n => now - n.timestamp < 5000)
      )
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2">
      <AnimatePresence>
        {notifications.map(notification => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, x: 100, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.9 }}
            className="flex items-center gap-3 rounded-lg border border-white/10 bg-black/90 px-4 py-3 
                       backdrop-blur-lg shadow-lg"
          >
            <div className={`rounded-full p-2 ${
              notification.type === "vote" 
                ? "bg-[#ff4b26]/20 text-[#ff4b26]"
                : "bg-amber-500/20 text-amber-500"
            }`}>
              {notification.type === "vote" ? (
                <ThumbsUp className="h-4 w-4" />
              ) : (
                <Award className="h-4 w-4" />
              )}
            </div>
            <div className="flex flex-col">
              <span className="font-medium text-white">
                {notification.productName}
              </span>
              <span className="text-sm text-white/70">
                {notification.message}
              </span>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
} 