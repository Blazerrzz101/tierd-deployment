"use client"

import { useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'

export function useRealtimeUpdates() {
  useEffect(() => {
    const channel = supabase
      .channel('product_votes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'product_votes' },
        (payload) => {
          window.dispatchEvent(new CustomEvent('vote-update', {
            detail: payload.new
          }))
        }
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'reviews' },
        (payload) => {
          window.dispatchEvent(new CustomEvent('review-update', {
            detail: payload.new
          }))
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [])
}