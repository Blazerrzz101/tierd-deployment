"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { supabase } from "@/lib/supabase/client"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatDistanceToNow } from "date-fns"
import Link from "next/link"
import { ThumbsUp, ThumbsDown, MessageSquare, Tag, ArrowBigUp, ArrowBigDown } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface Activity {
  id: string
  type: string
  details: {
    action: 'created' | 'updated' | 'removed'
    product_id: string
    product_name: string
    vote_type: number
  }
  created_at: string
}

interface Vote {
  product_id: string
  vote_type: number
  products: {
    name: string
    category: string
  }
}

export const dynamic = 'force-dynamic'

export default async function ProfilePage() {
  const supabase = createServerComponentClient({ cookies })
  
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect('/auth/sign-in')
  }

  // Get user activity
  const { data: activities } = await supabase
    .rpc('get_user_activity', {
      p_user_id: session.user.id
    }) as { data: Activity[] | null }

  // Get user's current votes
  const { data: votes } = await supabase
    .from('votes')
    .select('product_id, vote_type, products(name, category)')
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false }) as { data: Vote[] | null }

  return (
    <div className="container mx-auto py-10 space-y-8">
      {/* Profile Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={session.user.user_metadata.avatar_url} />
              <AvatarFallback>
                {session.user.email?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold">
                {session.user.user_metadata.full_name || session.user.email}
              </h1>
              <p className="text-muted-foreground">
                Member since {formatDistanceToNow(new Date(session.user.created_at), { addSuffix: true })}
              </p>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Activity Feed */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {activities?.map((activity: Activity) => (
              <div key={activity.id} className="flex items-center gap-4 py-2 border-b last:border-0">
                <div className="flex-1">
                  <p className="font-medium">
                    {activity.details.action === 'created' && 'Voted on '}
                    {activity.details.action === 'updated' && 'Changed vote for '}
                    {activity.details.action === 'removed' && 'Removed vote from '}
                    {activity.details.product_name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                  </p>
                </div>
                {activity.type === 'vote' && (
                  <div className="flex items-center gap-2">
                    {activity.details.vote_type === 1 ? (
                      <ArrowBigUp className="h-5 w-5 text-green-500" />
                    ) : (
                      <ArrowBigDown className="h-5 w-5 text-red-500" />
                    )}
                  </div>
                )}
              </div>
            ))}
            {!activities?.length && (
              <p className="text-center text-muted-foreground py-4">
                No activity yet
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Current Votes */}
      <Card>
        <CardHeader>
          <CardTitle>My Votes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {votes?.map((vote: Vote) => (
              <div key={vote.product_id} className="flex items-center gap-4 py-2 border-b last:border-0">
                <div className="flex-1">
                  <p className="font-medium">{vote.products.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {vote.products.category}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {vote.vote_type === 1 ? (
                    <ArrowBigUp className="h-5 w-5 text-green-500" />
                  ) : (
                    <ArrowBigDown className="h-5 w-5 text-red-500" />
                  )}
                </div>
              </div>
            ))}
            {!votes?.length && (
              <p className="text-center text-muted-foreground py-4">
                No votes yet
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
