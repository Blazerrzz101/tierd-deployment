"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/hooks/use-auth"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { getSupabaseClient } from "@/lib/supabase/client"
import { Activity, Settings, Star, MessageSquare, ThumbsUp } from "lucide-react"
import Link from "next/link"

interface ActivityItem {
  id: string
  type: 'vote' | 'thread' | 'comment'
  target: string
  created_at: string
  details: any
}

export default function ProfilePage() {
  const { user } = useAuth()
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const supabase = getSupabaseClient()

  useEffect(() => {
    let isMounted = true
    
    async function fetchUserActivity() {
      if (!user) {
        setIsLoading(false)
        return
      }

      try {
        // Fetch votes
        const { data: votes, error: votesError } = await supabase
          .from('product_votes')
          .select('*, products(*)')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(10)

        if (votesError) throw votesError

        // Fetch threads
        const { data: threads, error: threadsError } = await supabase
          .from('threads')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(10)

        if (threadsError) throw threadsError

        // Combine and sort activities
        if (isMounted) {
          const allActivities = [
            ...(votes?.map(vote => ({
              id: vote.id,
              type: 'vote' as const,
              target: vote.products?.name || 'Unknown Product',
              created_at: vote.created_at,
              details: vote
            })) || []),
            ...(threads?.map(thread => ({
              id: thread.id,
              type: 'thread' as const,
              target: thread.title || 'Untitled Thread',
              created_at: thread.created_at,
              details: thread
            })) || [])
          ].sort((a, b) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          )

          setActivities(allActivities)
        }
      } catch (error) {
        console.error('Error fetching user activity:', error)
        if (isMounted) {
          setActivities([]) // Set empty array on error
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    fetchUserActivity()
    return () => { isMounted = false }
  }, [user, supabase])

  if (!user) {
    return (
      <div className="container py-8">
        <Card>
          <CardHeader>
            <CardTitle>Please Sign In</CardTitle>
            <CardDescription>
              You need to be signed in to view your profile.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/auth/sign-in">
              <Button>Sign In</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container py-8">
      <div className="grid gap-8 md:grid-cols-[300px_1fr]">
        {/* Profile Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={user.avatar_url || undefined} />
                  <AvatarFallback>{user.email[0].toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle>{user.display_name}</CardTitle>
                  <CardDescription>{user.email}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <Activity className="h-4 w-4 text-muted-foreground" />
                  <span>Member since {new Date(user.created_at).toLocaleDateString()}</span>
                </div>
                <Link href="/settings">
                  <Button variant="outline" className="w-full">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <ThumbsUp className="h-4 w-4 text-muted-foreground" />
                    <span>Total Votes</span>
                  </div>
                  <span className="font-bold">
                    {activities.filter(a => a.type === 'vote').length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    <span>Discussions</span>
                  </div>
                  <span className="font-bold">
                    {activities.filter(a => a.type === 'thread').length}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          <Tabs defaultValue="activity">
            <TabsList>
              <TabsTrigger value="activity">Activity</TabsTrigger>
              <TabsTrigger value="votes">Votes</TabsTrigger>
              <TabsTrigger value="threads">Threads</TabsTrigger>
            </TabsList>

            <TabsContent value="activity" className="space-y-4">
              {isLoading ? (
                <Card>
                  <CardContent className="p-6">
                    <div className="space-y-2">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="h-12 animate-pulse rounded-lg bg-muted" />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ) : activities.length > 0 ? (
                <Card>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {activities.map(activity => (
                        <div
                          key={activity.id}
                          className="flex items-center justify-between border-b border-border pb-4 last:border-0 last:pb-0"
                        >
                          <div className="flex items-center space-x-4">
                            {activity.type === 'vote' ? (
                              <ThumbsUp className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <MessageSquare className="h-4 w-4 text-muted-foreground" />
                            )}
                            <div>
                              <p className="text-sm">
                                {activity.type === 'vote'
                                  ? `Voted on ${activity.target}`
                                  : `Created thread: ${activity.target}`}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(activity.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <Link
                            href={
                              activity.type === 'vote'
                                ? `/products/${activity.details.products.url_slug}`
                                : `/threads/${activity.id}`
                            }
                          >
                            <Button variant="ghost" size="sm">
                              View
                            </Button>
                          </Link>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="p-6 text-center">
                    <Star className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-4 text-lg font-semibold">No Activity Yet</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Start voting on products or join discussions to see your activity here.
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="votes">
              {/* Similar structure for votes tab */}
            </TabsContent>

            <TabsContent value="threads">
              {/* Similar structure for threads tab */}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
