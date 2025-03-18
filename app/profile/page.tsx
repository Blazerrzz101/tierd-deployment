"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { useAuth, AuthUser } from "@/hooks/use-auth"
import { EnhancedUser } from "@/components/auth/auth-provider"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatDistanceToNow, format } from "date-fns"
import Link from "next/link"
import { ThumbsUp, ThumbsDown, MessageSquare, Tag, ArrowBigUp, ArrowBigDown, Camera, Calendar, RefreshCw, User, Settings, FileImage, CalendarDays, Vote, MoreHorizontal, Filter, Clock, BellRing, ArrowRight, PenSquare, BellOff, Activity, Settings2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"
import { Particles } from "@/components/ui/particles"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import Image from "next/image"
import { User2 } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { MainLayout } from "@/components/home/main-layout"

interface Activity {
  id: string
  type: "vote" | "comment" | "review" | "profile"
  action: "upvote" | "downvote" | "comment" | "review" | "update"
  productId: string
  productName: string
  timestamp: string
  details?: string
}

export default function ProfilePage() {
  const router = useRouter()
  const { user, isLoading } = useAuth()
  const [activities, setActivities] = useState<Activity[]>([])
  const [votes, setVotes] = useState<any[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [displayName, setDisplayName] = useState("")
  const [bio, setBio] = useState("")
  const [avatarUrl, setAvatarUrl] = useState("")
  const [activeTab, setActiveTab] = useState<string>("activities")
  const [isUploadingCover, setIsUploadingCover] = useState(false)
  const [coverImage, setCoverImage] = useState<string | null>(null)
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [filterType, setFilterType] = useState<string | null>(null)
  const profileRef = useRef<HTMLDivElement>(null)
  
  // Mock state for realtime updates demo
  const [realtimeEnabled, setRealtimeEnabled] = useState(true)

  const supabase = createClientComponentClient()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function checkAuth() {
      try {
        setLoading(true)
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session?.user) {
          // User is authenticated, get their profile
          const { data: profile } = await supabase
            .from('profiles')
            .select('username')
            .eq('id', session.user.id)
            .single()
          
          // Redirect to user's profile page if they have a username
          if (profile?.username) {
            router.push(`/profile/${profile.username}`)
          } else {
            // If no username but authenticated, redirect to settings to complete profile
            router.push('/settings')
          }
        } else {
          // Not logged in, but we'll let them stay on this page
          // with a prompt to sign in
          setLoading(false)
        }
      } catch (error) {
        console.error('Error checking auth:', error)
        setLoading(false)
      }
    }

    checkAuth()
  }, [router, supabase])

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/auth/sign-in')
      return
    }

    if (user) {
      setDisplayName(user.name || '')
      setAvatarUrl(user.avatar_url || '')
      
      fetchActivities()
      fetchVotes()
      
      // Simulate real-time updates
      if (realtimeEnabled) {
        const interval = setInterval(() => {
          fetchActivities()
        }, 30000) // Refresh activities every 30 seconds
        
        return () => clearInterval(interval)
      }
    }
  }, [user, isLoading, realtimeEnabled])

  const fetchActivities = async () => {
    try {
      const response = await fetch(`/api/activities?userId=${user?.id}`);
      const data = await response.json();
      if (data.success) {
        setActivities(data.activities);
      }
    } catch (error) {
      console.error("Error fetching activities:", error);
    }
  }
  
  const fetchVotes = async () => {
    try {
      // This would be replaced with a real API call to fetch votes
      const mockVotes = [
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
          timestamp: new Date(Date.now() - 86400000).toISOString() // 1 day ago
        }
      ]
      setVotes(mockVotes)
    } catch (error) {
      console.error("Error fetching votes:", error);
    }
  }

  const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    
    setIsUploading(true)
    setUploadProgress(0)
    
    // Simulate upload progress
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 95) {
          clearInterval(interval)
          return prev
        }
        return prev + 5
      })
    }, 100)
    
    // Simulate upload completion
    setTimeout(() => {
      clearInterval(interval)
      setUploadProgress(100)
      
      // Create a URL for the uploaded image
      const reader = new FileReader()
      reader.onload = (e) => {
        const newAvatarUrl = e.target?.result as string
        setAvatarUrl(newAvatarUrl)
        
        // Update user profile
        setTimeout(() => {
          setIsUploading(false)
          toast.success("Profile picture updated successfully")
          
          // Add a new activity for profile picture update
          const newActivity: Activity = {
            id: `act-${Date.now()}`,
            type: "profile",
            action: "update",
            productId: "",
            productName: "",
            timestamp: new Date().toISOString(),
            details: "Updated profile picture"
          }
          
          setActivities(prev => [newActivity, ...prev])
        }, 500)
      }
      reader.readAsDataURL(file)
    }, 2000)
  }
  
  // Add handler for cover image upload
  const handleCoverUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    
    setIsUploadingCover(true)
    
    // Simulate upload completion
    setTimeout(() => {
      // Create a URL for the uploaded image
      const reader = new FileReader()
      reader.onload = (e) => {
        const newCoverUrl = e.target?.result as string
        setCoverImage(newCoverUrl)
        
        // Update user profile
        setTimeout(() => {
          setIsUploadingCover(false)
          toast.success("Cover image updated successfully")
        }, 500)
      }
      reader.readAsDataURL(file)
    }, 1500)
  }
  
  const handleProfileUpdate = () => {
    // In a real app, you would call an API to update the user profile
    toast.success("Profile updated successfully")
    setIsEditingProfile(false)
    
    // Add a new activity for profile update
    const newActivity: Activity = {
      id: `act-${Date.now()}`,
      type: "profile",
      action: "update",
      productId: "",
      productName: "",
      timestamp: new Date().toISOString(),
      details: "Updated profile information"
    }
    
    setActivities(prev => [newActivity, ...prev])
  }
  
  const toggleRealtime = () => {
    setRealtimeEnabled(!realtimeEnabled)
    toast.info(realtimeEnabled ? "Real-time updates paused" : "Real-time updates enabled")
  }
  
  // Add function to filter activities
  const filterActivities = (type: string | null) => {
    setFilterType(type)
  }
  
  // Group activities by date
  const groupedActivities = activities
    .filter(activity => !filterType || activity.type === filterType)
    .reduce((groups, activity) => {
      const date = new Date(activity.timestamp).toDateString()
      if (!groups[date]) {
        groups[date] = []
      }
      groups[date].push(activity)
      return groups
    }, {} as Record<string, Activity[]>)
  
  const getActivityIcon = (activity: Activity) => {
    switch (activity.action) {
      case "upvote":
        return <ArrowBigUp className="h-4 w-4 text-green-500" />;
      case "downvote":
        return <ArrowBigDown className="h-4 w-4 text-red-500" />;
      case "comment":
        return <MessageSquare className="h-4 w-4 text-blue-500" />;
      case "update":
        return <RefreshCw className="h-4 w-4 text-purple-500" />;
      default:
        return <Tag className="h-4 w-4" />;
    }
  };

  // Add or fix helper functions for date formatting
  const formatTimeAgo = (dateString: string): string => {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true });
  };

  const formatDate = (dateString: string): string => {
    return format(new Date(dateString), 'MMMM d, yyyy');
  };

  // Fix the getActivityText function if it doesn't exist
  const getActivityText = (activity: Activity): string => {
    switch (activity.action) {
      case "upvote":
        return `Upvoted ${activity.productName}`;
      case "downvote":
        return `Downvoted ${activity.productName}`;
      case "comment":
        return `Commented on ${activity.productName}`;
      case "review":
        return `Reviewed ${activity.productName}`;
      case "update":
        return `Updated profile`;
      default:
        return `Interacted with ${activity.productName}`;
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900"></div>
        </div>
      </MainLayout>
    )
  }

  if (!user) {
    return (
      <MainLayout>
        <div className="max-w-md mx-auto py-12">
          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
              <CardDescription>
                Sign in to view and manage your profile
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-sm text-gray-500">
                You need to be signed in to view your profile. Please sign in or create an account.
              </p>
              <Button onClick={() => router.push('/auth/sign-in')} className="w-full">
                Sign In
              </Button>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6 animate-in fade-in duration-500">
      {/* Profile Header with Cover Image */}
      <div 
        ref={profileRef}
        className="relative rounded-xl bg-gradient-to-b from-primary/10 to-background overflow-hidden"
      >
        {/* Cover Image */}
        <div className="h-48 relative">
          {coverImage ? (
            <div 
              className="absolute inset-0 bg-cover bg-center" 
              style={{ backgroundImage: `url(${coverImage})` }}
            />
          ) : (
            <div className="absolute inset-0 overflow-hidden">
              <Particles
                className="absolute inset-0"
                quantity={50}
                color="primary"
                speed="slow"
              />
            </div>
          )}
          
          {/* Cover Image Upload Button */}
          <div className="absolute bottom-4 right-4">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <label
                    htmlFor="cover-upload"
                    className="cursor-pointer bg-background/50 backdrop-blur-sm hover:bg-background/70 text-white p-2 rounded-full inline-block"
                  >
                    <input
                      id="cover-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleCoverUpload}
                      disabled={isUploadingCover}
                    />
                    <Camera className="h-5 w-5" />
                  </label>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Change cover image</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
        
        {/* Profile Information Bar */}
        <div className="relative px-6 pb-6 -mt-20">
          <div className="flex flex-col md:flex-row md:items-end gap-4">
            {/* Avatar with Upload Progress */}
            <div className="relative">
              <div className="h-32 w-32 rounded-full border-4 border-background overflow-hidden bg-card">
                {avatarUrl ? (
                  <Image 
                    src={avatarUrl} 
                    alt={user?.email?.split('@')[0] ?? "User"} 
                    width={128} 
                    height={128} 
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full bg-primary/10 text-primary">
                    <User2 className="h-12 w-12" />
                  </div>
                )}
              </div>
              
              {/* Avatar Upload Button */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <label
                      htmlFor="avatar-upload"
                      className="absolute bottom-0 right-0 cursor-pointer bg-primary hover:bg-primary/90 text-white p-2 rounded-full inline-block"
                    >
                      <input
                        id="avatar-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleAvatarUpload}
                        disabled={isUploading}
                      />
                      <PenSquare className="h-4 w-4" />
                    </label>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Change profile picture</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              {/* Upload Progress Indicator */}
              {isUploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/60 rounded-full">
                  <div className="text-center">
                    <Progress value={uploadProgress} className="w-16 h-2" />
                    <span className="text-xs mt-1 block text-muted-foreground">{uploadProgress}%</span>
                  </div>
                </div>
              )}
            </div>
            
            {/* User Info */}
            <div className="flex-1 space-y-1">
              <h1 className="text-2xl font-bold">{user?.email?.split('@')[0] ?? "User"}</h1>
              <p className="text-muted-foreground">{user?.email}</p>
              <div className="flex items-center gap-4 mt-2">
                <div className="flex items-center gap-1 text-sm">
                  <CalendarDays className="h-4 w-4 text-muted-foreground" />
                  <span>Joined {formatDistanceToNow(new Date(), { addSuffix: true })}</span>
                </div>
                
                <div className="flex items-center gap-1 text-sm">
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  <span>{activities.length} Activities</span>
                </div>
                
                <div className="flex items-center gap-1 text-sm">
                  <Vote className="h-4 w-4 text-muted-foreground" />
                  <span>{votes.length} Votes</span>
                </div>
              </div>
            </div>
            
            {/* Profile Actions */}
            <div className="flex gap-2 mt-4 md:mt-0">
              <Button variant="outline" size="sm" onClick={() => setIsEditingProfile(true)}>
                <PenSquare className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
              
              <HoverCard>
                <HoverCardTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </HoverCardTrigger>
                <HoverCardContent className="w-56">
                  <div className="space-y-2">
                    <h4 className="font-medium">Profile Settings</h4>
                    <div className="flex items-center justify-between">
                      <div className="text-sm">Notifications</div>
                      <Switch 
                        checked={notificationsEnabled} 
                        onCheckedChange={setNotificationsEnabled} 
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-sm">Real-time Updates</div>
                      <Switch 
                        checked={realtimeEnabled} 
                        onCheckedChange={setRealtimeEnabled} 
                      />
                    </div>
                  </div>
                </HoverCardContent>
              </HoverCard>
            </div>
          </div>
        </div>
      </div>
      
      {/* Tabs and Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="activities" className="gap-2">
              <Activity className="h-4 w-4" />
              <span className="hidden sm:inline">Activities</span>
            </TabsTrigger>
            <TabsTrigger value="votes" className="gap-2">
              <Vote className="h-4 w-4" />
              <span className="hidden sm:inline">Votes</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <Settings2 className="h-4 w-4" />
              <span className="hidden sm:inline">Settings</span>
            </TabsTrigger>
          </TabsList>
          
          {activeTab === "activities" && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                <Select
                  value={filterType || ""}
                  onValueChange={(value) => filterActivities(value || null)}
                >
                  <SelectTrigger className="w-[130px]">
                    <SelectValue placeholder="Filter" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Activities</SelectItem>
                    <SelectItem value="vote">Votes</SelectItem>
                    <SelectItem value="comment">Comments</SelectItem>
                    <SelectItem value="review">Reviews</SelectItem>
                    <SelectItem value="profile">Profile</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-1"
                onClick={toggleRealtime}
              >
                {realtimeEnabled ? (
                  <>
                    <BellRing className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Live</span>
                  </>
                ) : (
                  <>
                    <BellOff className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Paused</span>
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
        
        <TabsContent value="activities" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Your recent interactions across the platform
                {realtimeEnabled && (
                  <Badge variant="outline" className="ml-2 bg-primary/10 text-primary">
                    <span className="mr-1 h-2 w-2 rounded-full bg-primary animate-pulse inline-block"></span>
                    Live
                  </Badge>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="px-6">
              {Object.keys(groupedActivities).length > 0 ? (
                <div className="space-y-8">
                  {Object.entries(groupedActivities).map(([date, dayActivities]) => (
                    <div key={date} className="space-y-4">
                      <div className="sticky top-0 z-10 flex items-center gap-2 bg-background py-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <h3 className="text-sm font-medium">{formatDate(date)}</h3>
                      </div>
                      
                      <div className="space-y-4">
                        {dayActivities.map((activity) => (
                          <div
                            key={activity.id}
                            className="flex group px-2 -mx-2 py-2 rounded-lg hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex-shrink-0 mr-4 mt-1">
                              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                {getActivityIcon(activity)}
                              </div>
                            </div>
                            
                            <div className="flex-1 space-y-1">
                              <div className="flex items-start justify-between">
                                <div>
                                  <div className="font-medium">
                                    {getActivityText(activity)}
                                  </div>
                                  
                                  {activity.details && (
                                    <p className="text-sm text-muted-foreground">
                                      {activity.details}
                                    </p>
                                  )}
                                </div>
                                
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <span className="flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            {formatTimeAgo(activity.timestamp)}
                                          </span>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <time dateTime={activity.timestamp}>
                                            {new Date(activity.timestamp).toLocaleString()}
                                          </time>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  </span>
                                </div>
                              </div>
                              
                              {activity.productId && (
                                <Button 
                                  variant="ghost" 
                                  className="h-auto p-0 text-muted-foreground text-sm group-hover:text-primary hover:text-primary hover:bg-transparent"
                                  onClick={() => router.push(`/products/${activity.productId}`)}
                                >
                                  View Product
                                  <ArrowRight className="ml-1 h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <div className="h-10 w-10 text-muted-foreground mb-4 flex items-center justify-center">
                    <Calendar className="h-10 w-10" />
                  </div>
                  <h3 className="text-lg font-medium">No Activities Yet</h3>
                  <p className="text-muted-foreground">
                    Your recent activities will appear here
                  </p>
                  <Button 
                    variant="link" 
                    onClick={() => router.push('/products')} 
                    className="mt-4"
                  >
                    Browse Products
                  </Button>
                </div>
              )}
            </CardContent>
            <CardFooter className="border-t pt-4 flex justify-between">
              <div className="text-xs text-muted-foreground">
                Showing {Object.values(groupedActivities).flat().length} activities
              </div>
              {Object.keys(groupedActivities).length > 0 && (
                <Button variant="outline" size="sm">
                  View All Activities
                </Button>
              )}
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Votes Tab */}
        <TabsContent value="votes">
          <Card>
            <CardHeader>
              <CardTitle>My Votes</CardTitle>
              <CardDescription>
                Products you've voted on
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
                <div className="space-y-4">
                  {votes.map((vote) => (
                    <Card key={vote.productId} className="flex flex-col sm:flex-row items-center gap-4 p-4">
                      <div className="flex items-center justify-center h-12 w-12 rounded-full bg-muted">
                        {vote.voteType === 1 ? (
                          <ArrowBigUp className="h-6 w-6 text-green-500" />
                        ) : (
                          <ArrowBigDown className="h-6 w-6 text-red-500" />
                        )}
                      </div>
                      <div className="flex-1 text-center sm:text-left">
                        <p className="font-medium text-lg">
                          <Link href={`/products/${vote.productId}`} className="hover:underline text-primary">
                            {vote.productName}
                          </Link>
                        </p>
                        <p className="text-sm text-muted-foreground mt-1 capitalize">
                          {vote.category.replace(/-/g, ' ')}
                        </p>
                      </div>
                      <Button variant="ghost" size="sm">
                        View Product
                      </Button>
                    </Card>
                  ))}
                  {votes.length === 0 && (
                    <div className="text-center py-10">
                      <p className="text-muted-foreground">You haven't voted on any products yet</p>
                      <p className="text-sm mt-2">Browse products and cast your votes</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Add new settings tab */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Profile Settings</CardTitle>
              <CardDescription>Manage your profile and preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Display Preferences</h3>
                <div className="grid gap-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm" htmlFor="dark-mode">
                      Dark Mode
                    </label>
                    <Switch id="dark-mode" defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <label className="text-sm" htmlFor="notifications">
                      Email Notifications
                    </label>
                    <Switch id="notifications" checked={notificationsEnabled} onCheckedChange={setNotificationsEnabled} />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <label className="text-sm" htmlFor="realtime">
                      Real-time Updates
                    </label>
                    <Switch id="realtime" checked={realtimeEnabled} onCheckedChange={setRealtimeEnabled} />
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Account Settings</h3>
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="display-name">Display Name</Label>
                    <Input id="display-name" defaultValue={user?.email?.split('@')[0] || ""} />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" defaultValue={user?.email || ""} type="email" />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea id="bio" placeholder="Tell us about yourself" className="resize-none" rows={3} />
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t pt-4 flex justify-between">
              <Button variant="outline">Cancel</Button>
              <Button onClick={handleProfileUpdate}>Save Changes</Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Edit Profile Dialog */}
      <Dialog open={isEditingProfile} onOpenChange={setIsEditingProfile}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
            <DialogDescription>
              Update your profile information below.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Display Name</Label>
              <Input 
                id="name" 
                value={displayName} 
                onChange={(e) => setDisplayName(e.target.value)} 
                placeholder="Display Name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Input 
                id="bio" 
                value={bio} 
                onChange={(e) => setBio(e.target.value)} 
                placeholder="A short bio about yourself"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="profile-picture">Profile Picture</Label>
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={avatarUrl} />
                  <AvatarFallback>{user?.email?.charAt(0) || 'U'}</AvatarFallback>
                </Avatar>
                <Button variant="outline" size="sm" className="h-10">
                  <FileImage className="h-4 w-4 mr-2" />
                  Change Picture
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditingProfile(false)}>Cancel</Button>
            <Button onClick={handleProfileUpdate}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
