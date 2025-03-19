"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useEnhancedAuth } from "@/hooks/enhanced-auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatDistanceToNow } from "date-fns"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Loader2, User as UserIcon, ArrowRight, MessageSquare, ThumbsUp, ThumbsDown } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { getClientId } from "@/utils/client-id"
import { createProductUrl } from "@/utils/product-utils"

export default function AlternativeProfilePage() {
  const router = useRouter()
  const { user, isLoading, isAuthenticated } = useEnhancedAuth()
  const [activities, setActivities] = useState<any[]>([])
  const [votes, setVotes] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState("activities")
  const [authState, setAuthState] = useState({
    user: null as any,
    isLoading: true,
    isAuthenticated: false,
    localStorage: {} as Record<string, string>,
    timings: {
      mount: new Date().toISOString(),
      authResolved: '',
      activitiesLoaded: ''
    }
  })

  // Debugging enhanced auth - log state transitions
  useEffect(() => {
    console.log("Auth state changed:", { 
      user: user?.email, 
      isLoading, 
      isAuthenticated, 
      timestamp: new Date().toISOString() 
    })
    
    setAuthState(prev => ({
      ...prev,
      user,
      isLoading,
      isAuthenticated,
      timings: {
        ...prev.timings,
        authResolved: isLoading ? prev.timings.authResolved : new Date().toISOString()
      }
    }))
    
    // Collect localStorage info for debugging
    if (typeof window !== 'undefined') {
      const storage: Record<string, string> = {}
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key) {
          try {
            const value = localStorage.getItem(key) || ''
            // Only include auth-related keys for security
            if (key.includes('auth') || key.includes('user') || key === 'clientId') {
              // Redact actual values for privacy
              storage[key] = value.length > 0 ? `[${value.length} chars]` : '[empty]'
            }
          } catch (e) {
            // Ignore storage access errors
          }
        }
      }
      setAuthState(prev => ({...prev, localStorage: storage}))
    }
  }, [user, isLoading, isAuthenticated])

  // Fetch activities once auth is resolved
  useEffect(() => {
    if (isLoading) return
    
    async function fetchUserData() {
      try {
        // Get clientId for anonymous activities
        const clientId = getClientId()
        
        // Build query with both userId and clientId if available
        const queryParams = new URLSearchParams()
        
        if (user?.id) {
          queryParams.append('userId', user.id)
        }
        
        queryParams.append('clientId', clientId)
        
        // Fetch activities
        const activitiesRes = await fetch(`/api/activities?${queryParams.toString()}`)
        if (activitiesRes.ok) {
          const data = await activitiesRes.json()
          if (data.success) {
            setActivities(data.activities)
            setAuthState(prev => ({
              ...prev,
              timings: {
                ...prev.timings,
                activitiesLoaded: new Date().toISOString()
              }
            }))
          }
        }
        
        // Mock votes data for simplicity
        setVotes([
          {
            productId: "j1k2l3m4-n5o6-p7q8-r9s0-t1u2v3w4x5y6",
            productName: "ASUS ROG Swift PG279QM",
            voteType: 1,
            category: "monitors",
            timestamp: new Date().toISOString()
          },
          {
            productId: "a1b2c3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p6",
            productName: "Logitech G Pro X Superlight",
            voteType: 1,
            category: "mice", 
            timestamp: new Date(Date.now() - 86400000).toISOString()
          }
        ])
      } catch (error) {
        console.error("Error fetching user data:", error)
      }
    }
    
    fetchUserData()
  }, [isLoading, user])

  // Show debug info in development
  const showDebugInfo = process.env.NODE_ENV !== 'production'

  // Loading state
  if (isLoading) {
    return (
      <div className="container max-w-4xl py-8 mx-auto">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-8 h-8 mb-4 text-primary animate-spin" />
            <p className="text-muted-foreground">
              Loading profile information...
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Not authenticated state with debug
  if (!isAuthenticated) {
    return (
      <div className="container max-w-4xl py-8 mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Sign in to view your profile</CardTitle>
            <CardDescription>
              Create an account or sign in to view your profile and activities
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              You need to be signed in to view your profile information, activities, and votes.
            </p>
            <div className="flex gap-4">
              <Button onClick={() => router.push('/auth/sign-in')}>
                Sign In
              </Button>
              <Button variant="outline" onClick={() => router.push('/auth/sign-up')}>
                Create Account
              </Button>
            </div>
          </CardContent>
        </Card>
        
        {showDebugInfo && (
          <Card className="border-dashed border-yellow-300">
            <CardHeader>
              <CardTitle className="text-sm">Debug Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="text-xs font-semibold">Auth State:</p>
                <pre className="p-2 overflow-auto text-xs bg-black/10 rounded-md">
                  {JSON.stringify(authState, null, 2)}
                </pre>
              </div>
              <div>
                <p className="text-xs font-semibold">Client ID:</p>
                <code className="p-1 text-xs rounded bg-black/10">{getClientId()}</code>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    )
  }

  // Authenticated user view
  return (
    <div className="container max-w-4xl py-8 mx-auto space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Avatar className="w-16 h-16 border-2 border-muted">
              <AvatarImage src={user?.avatar_url} />
              <AvatarFallback>{user?.name?.charAt(0) || user?.email?.charAt(0) || "U"}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle>{user?.name || user?.email?.split('@')[0] || "User"}</CardTitle>
              <CardDescription>{user?.email}</CardDescription>
              <p className="mt-1 text-sm text-muted-foreground">
                Joined {formatDistanceToNow(new Date(), { addSuffix: true })}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList>
              <TabsTrigger value="activities">Activities</TabsTrigger>
              <TabsTrigger value="votes">Votes</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>
            
            <TabsContent value="activities" className="space-y-4">
              <h3 className="text-lg font-medium">Recent Activities</h3>
              {activities.length > 0 ? (
                <ScrollArea className="h-[400px] rounded-md border">
                  <div className="p-4 space-y-4">
                    {activities.map((activity: any) => (
                      <Card key={activity.id} className="overflow-hidden">
                        <div className="flex p-4 space-x-4">
                          <div className="flex-shrink-0 mt-1">
                            {activity.action === 'upvote' && <ThumbsUp className="w-4 h-4 text-green-500" />}
                            {activity.action === 'downvote' && <ThumbsDown className="w-4 h-4 text-red-500" />}
                            {activity.action === 'comment' && <MessageSquare className="w-4 h-4 text-blue-500" />}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium">
                              {activity.action === 'upvote' && `Upvoted ${activity.productName}`}
                              {activity.action === 'downvote' && `Downvoted ${activity.productName}`}
                              {activity.action === 'comment' && `Commented on ${activity.productName}`}
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                            </p>
                            {activity.productId && (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="mt-2 p-0 h-auto text-primary"
                                onClick={() => router.push(createProductUrl({ 
                                  id: activity.productId, 
                                  name: activity.productName,
                                  url_slug: activity.productSlug
                                }))}
                              >
                                View Product
                                <ArrowRight className="w-3 h-3 ml-1" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="p-8 text-center border rounded-md">
                  <p className="text-muted-foreground">You have no activities yet</p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => router.push('/products')}
                  >
                    Browse Products
                  </Button>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="votes">
              <h3 className="mb-4 text-lg font-medium">Your Votes</h3>
              {votes.length > 0 ? (
                <div className="space-y-4">
                  {votes.map((vote) => (
                    <Card key={vote.productId} className="overflow-hidden">
                      <div className="flex items-center p-4 space-x-4">
                        <div className="flex items-center justify-center h-10 w-10 rounded-full bg-muted">
                          {vote.voteType === 1 ? (
                            <ThumbsUp className="w-5 h-5 text-green-500" />
                          ) : (
                            <ThumbsDown className="w-5 h-5 text-red-500" />
                          )}
                        </div>
                        <div className="flex-1">
                          <Link 
                            href={createProductUrl({ id: vote.productId, name: vote.productName })}
                            className="font-medium hover:underline"
                          >
                            {vote.productName}
                          </Link>
                          <p className="text-sm text-muted-foreground">
                            {vote.category}
                          </p>
                        </div>
                        <Badge variant={vote.voteType === 1 ? "success" : "destructive"}>
                          {vote.voteType === 1 ? "Upvoted" : "Downvoted"}
                        </Badge>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center border rounded-md">
                  <p className="text-muted-foreground">You haven't voted on any products yet</p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => router.push('/products')}
                  >
                    Browse Products
                  </Button>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="settings">
              <h3 className="mb-4 text-lg font-medium">Profile Settings</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium">Display Name</label>
                  <input 
                    type="text" 
                    className="w-full px-3 py-2 border rounded-md" 
                    defaultValue={user?.name || user?.email?.split('@')[0] || ""}
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium">Email</label>
                  <input 
                    type="email" 
                    className="w-full px-3 py-2 border rounded-md bg-muted" 
                    value={user?.email || ""}
                    disabled
                  />
                </div>
                <Button>Save Changes</Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      {showDebugInfo && (
        <Card className="border-dashed border-yellow-300">
          <CardHeader>
            <CardTitle className="text-sm">Debug Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <p className="text-xs font-semibold">Auth State:</p>
              <pre className="p-2 overflow-auto text-xs bg-black/10 rounded-md">
                {JSON.stringify(authState, null, 2)}
              </pre>
            </div>
            <Separator />
            <div className="pt-2">
              <Button variant="outline" size="sm" onClick={() => router.push('/profile')}>
                Try Original Profile Page
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 