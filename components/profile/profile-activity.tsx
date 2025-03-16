"use client"

import { useQuery } from "@tanstack/react-query"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { supabase } from "@/lib/supabase/client"
import { formatDistanceToNow } from "date-fns"
import { ThumbsUp, ThumbsDown, MessageSquare } from "lucide-react"

interface ProfileActivityProps {
  userId: string
}

export function ProfileActivity({ userId }: ProfileActivityProps) {
  const { data: votes } = useQuery({
    queryKey: ['user-votes', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('votes')
        .select(`
          id,
          vote_type,
          created_at,
          products (
            id,
            name,
            url_slug
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data
    }
  })

  const { data: threads } = useQuery({
    queryKey: ['user-threads', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('threads')
        .select(`
          id,
          title,
          created_at,
          products (
            id,
            name,
            url_slug
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data
    }
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity</CardTitle>
        <CardDescription>Your recent activity across the platform</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="votes">
          <TabsList>
            <TabsTrigger value="votes">Votes</TabsTrigger>
            <TabsTrigger value="threads">Threads</TabsTrigger>
          </TabsList>

          <TabsContent value="votes" className="mt-4 space-y-4">
            {votes?.map((vote) => (
              <div key={vote.id} className="flex items-center gap-3 text-sm">
                {vote.vote_type === 'up' ? (
                  <ThumbsUp className="h-4 w-4 text-green-500" />
                ) : (
                  <ThumbsDown className="h-4 w-4 text-red-500" />
                )}
                <span>
                  You {vote.vote_type}voted{' '}
                  <a 
                    href={`/products/${vote.products.url_slug}`}
                    className="font-medium hover:underline"
                  >
                    {vote.products.name}
                  </a>
                </span>
                <span className="text-muted-foreground">
                  {formatDistanceToNow(new Date(vote.created_at), { addSuffix: true })}
                </span>
              </div>
            ))}
            {votes?.length === 0 && (
              <p className="text-muted-foreground">No votes yet</p>
            )}
          </TabsContent>

          <TabsContent value="threads" className="mt-4 space-y-4">
            {threads?.map((thread) => (
              <div key={thread.id} className="flex items-center gap-3 text-sm">
                <MessageSquare className="h-4 w-4" />
                <span>
                  You started a discussion about{' '}
                  <a 
                    href={`/products/${thread.products.url_slug}`}
                    className="font-medium hover:underline"
                  >
                    {thread.products.name}
                  </a>
                </span>
                <span className="text-muted-foreground">
                  {formatDistanceToNow(new Date(thread.created_at), { addSuffix: true })}
                </span>
              </div>
            ))}
            {threads?.length === 0 && (
              <p className="text-muted-foreground">No threads yet</p>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
} 