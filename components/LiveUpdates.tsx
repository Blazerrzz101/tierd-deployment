"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase/client"
import type { RealtimeChannel } from "@supabase/supabase-js"

interface LiveUpdatesProps {
  table: string
  onUpdate?: (payload: any) => void
  onDelete?: (payload: any) => void
  onInsert?: (payload: any) => void
}

export function LiveUpdates({ table, onUpdate, onDelete, onInsert }: LiveUpdatesProps) {
  const [channel, setChannel] = useState<RealtimeChannel | null>(null)

  useEffect(() => {
    if (!table) return

    // Subscribe to realtime updates
    const channel = supabase
      .channel(`public:${table}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: table
        },
        (payload) => {
          console.log('Change received!', payload)
          switch (payload.eventType) {
            case 'INSERT':
              onInsert?.(payload.new)
              break
            case 'UPDATE':
              onUpdate?.(payload.new)
              break
            case 'DELETE':
              onDelete?.(payload.old)
              break
          }
        }
      )
      .subscribe()

    setChannel(channel)

    return () => {
      channel.unsubscribe()
    }
  }, [table, onUpdate, onDelete, onInsert])

  return null
} 