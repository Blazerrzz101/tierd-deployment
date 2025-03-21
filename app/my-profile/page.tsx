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
import { Loader2, User as UserIcon, ArrowRight, MessageSquare, ThumbsUp, ThumbsDown, Star, Award, Zap } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { getClientId } from "@/utils/client-id"
import { createProductUrl } from "@/utils/product-utils"
import { Switch } from "@/components/ui/switch"
import { toast } from "@/components/ui/use-toast"

export default function ProfilePage() {
  const router = useRouter()
  const { user, isLoading, isAuthenticated, signOut } = useEnhancedAuth()
  const [activities, setActivities] = useState<any[]>([])
  const [votes, setVotes] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState("activities")
  const [profileForm, setProfileForm] = useState({
    name: "",
    bio: "",
    emailNotifications: true,
    darkMode: false
  })

  // Set initial form values when user data loads
  useEffect(() => {
    if (user) {
      setProfileForm(prev => ({
        ...prev,
        name: user.name || user.email?.split('@')[0] || ""
      }));
    }
  }, [user]);

  // Handle profile form changes
  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfileForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle toggle changes
  const handleToggleChange = (name: string, checked: boolean) => {
    setProfileForm(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  // Handle save profile changes
  const handleSaveChanges = () => {
    // In a real app, you would save changes to the backend here
    toast({
      title: "Changes saved",
      description: "Your profile has been updated successfully."
    });
  };

  // Handle delete account
  const handleDeleteAccount = () => {
    // Show a confirmation dialog
    if (confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
      // In a real app, you would call an API to delete the account
      toast({
        title: "Account deleted",
        description: "Your account has been deleted successfully.",
        variant: "destructive"
      });
      
      // Sign out after account deletion
      signOut();
    }
  };

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

  // Not authenticated state
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
      </div>
    )
  }

  // Authenticated user view
  return (
    <div className="container max-w-5xl py-8 mx-auto space-y-6">
      {/* Profile hero section */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-primary/10 via-secondary/10 to-primary/5 border">
        {/* Cover photo */}
        <div className="h-48 bg-gradient-to-r from-primary/20 via-muted to-secondary/20 relative">
          <div className="absolute inset-0 bg-pattern opacity-5"></div>
        </div>
        
        {/* Profile info */}
        <div className="relative px-6 pb-6 -mt-16">
          <Avatar className="w-24 h-24 border-4 border-background shadow-md">
            <AvatarImage src={user?.avatar_url} />
            <AvatarFallback className="text-2xl">{user?.name?.charAt(0) || user?.email?.charAt(0) || "U"}</AvatarFallback>
          </Avatar>
          
          <div className="mt-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">{user?.name || user?.email?.split('@')[0] || "User"}</h1>
              <p className="text-muted-foreground">{user?.email}</p>
              <div className="flex items-center mt-1 text-sm text-muted-foreground">
                <UserIcon className="mr-1 h-3 w-3" />
                <span>Joined {formatDistanceToNow(new Date(), { addSuffix: true })}</span>
              </div>
            </div>
            
            <div className="flex gap-4">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setActiveTab("settings")}
              >
                Edit Profile
              </Button>
              <Button size="sm">
                Share Profile
              </Button>
            </div>
          </div>
          
          {/* User stats */}
          <div className="grid grid-cols-3 gap-4 mt-6 text-center">
            <div className="bg-background rounded-lg p-3 shadow-sm">
              <p className="text-2xl font-bold">{activities.length}</p>
              <p className="text-xs text-muted-foreground">Activities</p>
            </div>
            <div className="bg-background rounded-lg p-3 shadow-sm">
              <p className="text-2xl font-bold">{votes.length}</p>
              <p className="text-xs text-muted-foreground">Votes</p>
            </div>
            <div className="bg-background rounded-lg p-3 shadow-sm">
              <p className="text-2xl font-bold">0</p>
              <p className="text-xs text-muted-foreground">Reviews</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Tabs Content */}
      <Card>
        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="border-b px-4">
              <TabsList className="flex justify-start h-14 bg-transparent">
                <TabsTrigger value="activities" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
                  Activities
                </TabsTrigger>
                <TabsTrigger value="votes" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
                  Votes
                </TabsTrigger>
                <TabsTrigger value="achievements" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
                  Achievements
                </TabsTrigger>
                <TabsTrigger value="settings" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
                  Settings
                </TabsTrigger>
              </TabsList>
            </div>
            
            <div className="p-6">
              <TabsContent value="activities" className="mt-0 space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Recent Activities</h3>
                  <Button variant="ghost" size="sm">View All</Button>
                </div>
                
                {activities.length > 0 ? (
                  <div className="space-y-3">
                    {activities.map((activity: any) => (
                      <Card key={activity.id} className="overflow-hidden bg-card hover:bg-muted/50 transition-colors">
                        <div className="flex p-4 space-x-4">
                          <div className="flex-shrink-0 mt-1">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                              {activity.action === 'upvote' && <ThumbsUp className="w-4 h-4 text-green-500" />}
                              {activity.action === 'downvote' && <ThumbsDown className="w-4 h-4 text-red-500" />}
                              {activity.action === 'comment' && <MessageSquare className="w-4 h-4 text-blue-500" />}
                            </div>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <p className="font-medium">
                                {activity.action === 'upvote' && `Upvoted ${activity.productName}`}
                                {activity.action === 'downvote' && `Downvoted ${activity.productName}`}
                                {activity.action === 'comment' && `Commented on ${activity.productName}`}
                              </p>
                              <Badge variant={activity.action === 'upvote' ? 'success' : activity.action === 'downvote' ? 'destructive' : 'outline'}>
                                {activity.action}
                              </Badge>
                            </div>
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
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center border rounded-md bg-muted/20">
                    <div className="w-16 h-16 mb-4 rounded-full bg-muted flex items-center justify-center">
                      <MessageSquare className="w-8 h-8 text-muted-foreground/40" />
                    </div>
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
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-medium">Your Votes</h3>
                  <Button variant="ghost" size="sm">Filter</Button>
                </div>
                
                {votes.length > 0 ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    {votes.map((vote) => (
                      <Card key={vote.productId} className="overflow-hidden hover:shadow-md transition-shadow">
                        <div className="flex items-center p-4 space-x-4">
                          <div className="flex items-center justify-center h-12 w-12 rounded-full bg-card border">
                            {vote.voteType === 1 ? (
                              <ThumbsUp className="w-5 h-5 text-green-500" />
                            ) : (
                              <ThumbsDown className="w-5 h-5 text-red-500" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <Link 
                              href={createProductUrl({ id: vote.productId, name: vote.productName })}
                              className="font-medium text-lg hover:underline truncate block"
                            >
                              {vote.productName}
                            </Link>
                            <div className="flex items-center mt-1">
                              <Badge variant="outline" className="capitalize">
                                {vote.category}
                              </Badge>
                              <span className="mx-2 text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(vote.timestamp), { addSuffix: true })}
                              </span>
                            </div>
                          </div>
                          <Badge variant={vote.voteType === 1 ? "success" : "destructive"} className="ml-auto">
                            {vote.voteType === 1 ? "Upvoted" : "Downvoted"}
                          </Badge>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center border rounded-md bg-muted/20">
                    <div className="w-16 h-16 mb-4 rounded-full bg-muted flex items-center justify-center">
                      <ThumbsUp className="w-8 h-8 text-muted-foreground/40" />
                    </div>
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
              
              <TabsContent value="achievements">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-medium">Achievements</h3>
                  <Badge variant="outline">{3} Unlocked</Badge>
                </div>
                
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {/* Active achievements */}
                  <Card className="overflow-hidden border-green-200 bg-green-50/50 dark:bg-green-950/20">
                    <CardContent className="p-0">
                      <div className="p-6 text-center">
                        <div className="mx-auto w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4">
                          <ThumbsUp className="w-8 h-8 text-green-600 dark:text-green-400" />
                        </div>
                        <h4 className="font-semibold text-lg">First Vote</h4>
                        <p className="text-sm text-muted-foreground mt-2">Cast your first vote on a product</p>
                        <Badge variant="success" className="mt-4">Unlocked</Badge>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="overflow-hidden border-blue-200 bg-blue-50/50 dark:bg-blue-950/20">
                    <CardContent className="p-0">
                      <div className="p-6 text-center">
                        <div className="mx-auto w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-4">
                          <MessageSquare className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                        </div>
                        <h4 className="font-semibold text-lg">Commenter</h4>
                        <p className="text-sm text-muted-foreground mt-2">Leave your first comment</p>
                        <Badge variant="success" className="mt-4">Unlocked</Badge>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="overflow-hidden border-purple-200 bg-purple-50/50 dark:bg-purple-950/20">
                    <CardContent className="p-0">
                      <div className="p-6 text-center">
                        <div className="mx-auto w-16 h-16 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mb-4">
                          <Star className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                        </div>
                        <h4 className="font-semibold text-lg">Influencer</h4>
                        <p className="text-sm text-muted-foreground mt-2">Cast 10+ votes on products</p>
                        <Badge variant="success" className="mt-4">Unlocked</Badge>
                      </div>
                    </CardContent>
                  </Card>
                  
                  {/* Locked achievements */}
                  <Card className="overflow-hidden opacity-70">
                    <CardContent className="p-0">
                      <div className="p-6 text-center">
                        <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                          <Award className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <h4 className="font-semibold text-lg">Expert Reviewer</h4>
                        <p className="text-sm text-muted-foreground mt-2">Write a detailed product review</p>
                        <Badge variant="outline" className="mt-4">Locked</Badge>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="overflow-hidden opacity-70">
                    <CardContent className="p-0">
                      <div className="p-6 text-center">
                        <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                          <Zap className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <h4 className="font-semibold text-lg">Power User</h4>
                        <p className="text-sm text-muted-foreground mt-2">Visit the site for 30 consecutive days</p>
                        <Badge variant="outline" className="mt-4">Locked</Badge>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
              
              <TabsContent value="settings">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-medium">Profile Settings</h3>
                  <Button size="sm" onClick={handleSaveChanges}>Save Changes</Button>
                </div>
                <div className="grid gap-6 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Personal Information</CardTitle>
                      <CardDescription>Update your personal details</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <label htmlFor="name" className="block text-sm font-medium">Display Name</label>
                        <input 
                          id="name"
                          name="name"
                          type="text" 
                          className="w-full px-3 py-2 border rounded-md" 
                          value={profileForm.name}
                          onChange={handleProfileChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="email" className="block text-sm font-medium">Email</label>
                        <input 
                          id="email"
                          type="email" 
                          className="w-full px-3 py-2 border rounded-md bg-muted" 
                          value={user?.email || ""}
                          disabled
                        />
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="bio" className="block text-sm font-medium">Bio</label>
                        <textarea 
                          id="bio"
                          name="bio"
                          className="w-full px-3 py-2 border rounded-md min-h-[80px]" 
                          placeholder="Tell us about yourself..."
                          value={profileForm.bio}
                          onChange={handleProfileChange}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Preferences</CardTitle>
                      <CardDescription>Customize your experience</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Email Notifications</p>
                          <p className="text-sm text-muted-foreground">Receive product updates via email</p>
                        </div>
                        <Switch
                          checked={profileForm.emailNotifications}
                          onCheckedChange={(checked) => handleToggleChange('emailNotifications', checked)}
                        />
                      </div>
                      <Separator />
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Dark Mode</p>
                          <p className="text-sm text-muted-foreground">Switch between light and dark themes</p>
                        </div>
                        <Switch
                          checked={profileForm.darkMode}
                          onCheckedChange={(checked) => handleToggleChange('darkMode', checked)}
                        />
                      </div>
                      <Separator />
                      <div className="pt-2">
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={handleDeleteAccount}
                        >
                          Delete Account
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
} 