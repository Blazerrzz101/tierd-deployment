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
import { Loader2, User as UserIcon, ArrowRight, MessageSquare, ThumbsUp, ThumbsDown, Star, Award, Zap, Image as ImageIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { getClientId } from "@/utils/client-id"
import { createProductUrl } from "@/utils/product-utils"
import { Switch } from "@/components/ui/switch"
import { toast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabase"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { uploadUserAvatar } from "@/lib/supabase/storage-utils"
import { UserService } from "@/lib/supabase/user-service"

// Create a simple Spinner component using Loader2
const Spinner = ({ className }: { className?: string }) => {
  return <Loader2 className={cn("animate-spin", className)} />;
};

export default function ProfilePage() {
  const router = useRouter()
  const { user, isLoading, isAuthenticated, signOut } = useEnhancedAuth()
  const [activities, setActivities] = useState<any[]>([])
  const [votes, setVotes] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState("activities")
  const [profileForm, setProfileForm] = useState({
    name: "",
    bio: "",
    email: "",
    avatar_url: "",
    emailNotifications: true,
    darkMode: false,
    is_public: true
  })
  const [emailUpdateState, setEmailUpdateState] = useState({
    processing: false,
    error: null
  })
  const [isSaving, setIsSaving] = useState(false)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)

  // Set initial form values when user data loads
  useEffect(() => {
    if (user) {
      setProfileForm(prev => ({
        ...prev,
        name: user.name || user.email?.split('@')[0] || "",
        email: user.email || "",
        avatar_url: user.avatar_url || "",
        bio: "" // Initialize with empty bio
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

  // Handle avatar file change
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setAvatarFile(file)
      
      // Create a preview URL
      const reader = new FileReader()
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  };

  // Fetch user profile data once auth is resolved
  useEffect(() => {
    if (isLoading || !isAuthenticated) return;
    
    async function fetchUserProfile() {
      try {
        const response = await fetch('/api/user');
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.user) {
            // Update profile form with user data
            setProfileForm(prev => ({
              ...prev,
              name: data.user.name || data.user.username || data.user.email?.split('@')[0] || "",
              email: data.user.email || "",
              avatar_url: data.user.avatar_url || "",
              bio: data.user.bio || "",
              is_public: data.user.is_public ?? true,
              emailNotifications: data.user.preferences?.notification_settings?.emailNotifications ?? true,
              darkMode: data.user.preferences?.notification_settings?.darkMode ?? false
            }));
          }
        } else {
          console.error('Error fetching user profile');
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      }
    }
    
    fetchUserProfile();
  }, [isLoading, isAuthenticated]);

  // Add a new effect to persist and synchronize authentication state
  useEffect(() => {
    // Skip if still loading or already authenticated
    if (isLoading) return;

    // If authenticated, store auth state in localStorage
    if (isAuthenticated && user) {
      // Store last authenticated timestamp for session validation
      localStorage.setItem('lastAuthCheck', Date.now().toString());
      
      // Use a more robust auth state caching
      try {
        const cachedAuthState = {
          user,
          timestamp: Date.now(),
          expires: Date.now() + (24 * 60 * 60 * 1000) // 24 hours cache
        };
        localStorage.setItem('tierd-auth-state', JSON.stringify(cachedAuthState));
      } catch (error) {
        console.error('Error caching auth state:', error);
      }
    }
  }, [isAuthenticated, user, isLoading]);

  // Handle save profile changes
  const handleSaveChanges = async () => {
    setIsSaving(true);
    
    try {
      // Pre-save validation and auth check
      if (!user?.id) {
        throw new Error('User ID not available - authentication may have expired');
      }
      
      // Additional safeguard: Verify authentication before proceeding
      const authCheck = await fetch('/api/auth/verify-session', {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      if (!authCheck.ok) {
        // Try to refresh authentication if possible
        toast({
          title: "Session verification",
          description: "Refreshing your session..."
        });
        
        // Wait a moment for potential auth refresh
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      // If we have a new avatar file, upload it to Supabase Storage
      let avatarUrl = profileForm.avatar_url;
      
      if (avatarFile && user?.id) {
        try {
          avatarUrl = await uploadUserAvatar(user.id, avatarFile);
        } catch (error) {
          console.error("Avatar upload error:", error);
          toast({
            title: "Avatar upload failed",
            description: error instanceof Error ? error.message : "Unable to upload avatar",
            variant: "destructive"
          });
          // Continue with the rest of the profile update
        }
      }
      
      // Add timestamps and request ID for debugging
      const requestId = Math.random().toString(36).substring(2, 10);
      const requestStart = Date.now();
      
      // Update profile via API with retries
      let retryCount = 0;
      const maxRetries = 3;
      let response;
      
      while (retryCount < maxRetries) {
        try {
          response = await fetch('/api/user', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'X-Request-ID': requestId,
              'X-Request-Time': requestStart.toString()
            },
            body: JSON.stringify({
              username: profileForm.name,
              avatar_url: avatarUrl,
              is_public: profileForm.is_public,
              bio: profileForm.bio,
              notification_settings: {
                emailNotifications: profileForm.emailNotifications,
                darkMode: profileForm.darkMode,
              }
            })
          });
          
          // If successful or not an auth error, break the retry loop
          if (response.ok || response.status !== 401) {
            break;
          }
          
          // If it's an auth error, try refreshing the session before retrying
          if (response.status === 401) {
            console.log(`Authentication error on attempt ${retryCount + 1}, attempting refresh...`);
            
            // Attempt to refresh auth session
            const refreshResult = await fetch('/api/auth/refresh', { 
              method: 'POST',
              headers: { 'X-Request-ID': requestId }
            });
            
            if (refreshResult.ok) {
              toast({
                title: "Session refreshed",
                description: "Retrying save operation..."
              });
              await new Promise(resolve => setTimeout(resolve, 500));
            }
          }
        } catch (error) {
          console.error(`Error on attempt ${retryCount + 1}:`, error);
        }
        
        retryCount++;
        
        // Only retry if we haven't succeeded and haven't hit max retries
        if (retryCount < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount)); // Exponential backoff
        }
      }
      
      if (!response || !response.ok) {
        const errorData = response ? await response.json() : null;
        throw new Error(errorData?.message || 'Failed to update profile');
      }
      
      // Update local user state to reflect changes
      if (user) {
        const updatedUser = {
          ...user,
          name: profileForm.name,
          avatar_url: avatarUrl
        };
        
        // Store in localStorage to persist changes
        localStorage.setItem('authUser', JSON.stringify(updatedUser));
        
        // Also apply theme changes directly if darkMode preference changed
        if (profileForm.darkMode) {
          document.documentElement.classList.remove('light');
          document.documentElement.classList.add('dark');
          document.documentElement.style.colorScheme = 'dark';
          localStorage.setItem('tierd-theme', 'dark');
        } else {
          document.documentElement.classList.remove('dark');
          document.documentElement.classList.add('light');
          document.documentElement.style.colorScheme = 'light';
          localStorage.setItem('tierd-theme', 'light');
        }
      }
      
      toast({
        title: "Changes saved",
        description: "Your profile has been updated successfully."
      });
      
      // Refresh to show updated profile
      router.refresh();
    } catch (error) {
      console.error("Error saving profile:", error);
      toast({
        title: "Error saving profile",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      });
      
      // If we got a specific error about authentication
      if (error instanceof Error && 
          (error.message.includes('authenticate') || 
           error.message.includes('auth') || 
           error.message.includes('session'))) {
        
        toast({
          title: "Authentication issue",
          description: "You may need to sign in again. Redirecting to login...",
          variant: "destructive"
        });
        
        // Redirect to login after a short delay
        setTimeout(() => {
          router.push('/auth/sign-in?redirect=/my-profile');
        }, 2000);
      }
    } finally {
      setIsSaving(false);
    }
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

  // Handle email update
  const handleEmailUpdate = async () => {
    if (!profileForm.email || profileForm.email === user?.email) return;
    
    setEmailUpdateState({
      processing: true,
      error: null
    });
    
    try {
      // Use Supabase Auth to update the email
      const { error } = await supabase.auth.updateUser({
        email: profileForm.email
      });
      
      if (error) throw error;
      
      // Success message
      setEmailUpdateState({
        processing: false,
        error: null
      });
      
      toast({
        title: "Verification email sent",
        description: "Please check your email to verify the new address."
      });
    } catch (error) {
      console.error("Error updating email:", error);
      setEmailUpdateState({
        processing: false,
        error: error instanceof Error ? error.message : "Failed to update email"
      });
      
      toast({
        title: "Error updating email",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      });
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

  // Add individual toggle handlers for each preference
  const handleEmailNotificationsToggle = async (checked: boolean) => {
    setProfileForm(prev => ({
      ...prev,
      emailNotifications: checked
    }));
    
    // Update this preference immediately
    try {
      if (!user?.id) return;
      
      // Show subtle toast
      toast({
        title: checked ? "Email notifications enabled" : "Email notifications disabled",
        description: "Saving your preference...",
      });
      
      const result = await UserService.updateUserPreferences(user.id, {
        emailNotifications: checked
      });
      
      if (!result.success) {
        // Reset to previous state on error
        setProfileForm(prev => ({
          ...prev,
          emailNotifications: !checked
        }));
        
        toast({
          title: "Error saving preference",
          description: result.error || "Please try again",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error updating email notifications:", error);
      
      // Reset to previous state
      setProfileForm(prev => ({
        ...prev,
        emailNotifications: !checked
      }));
      
      toast({
        title: "Error saving preference",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive"
      });
    }
  };

  const handleDarkModeToggle = async (checked: boolean) => {
    setProfileForm(prev => ({
      ...prev,
      darkMode: checked
    }));
    
    // Update this preference immediately
    try {
      if (!user?.id) return;
      
      // Apply theme change immediately for better UX
      if (checked) {
        document.documentElement.classList.remove('light');
        document.documentElement.classList.add('dark');
        document.documentElement.style.colorScheme = 'dark';
        localStorage.setItem('tierd-theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        document.documentElement.classList.add('light');
        document.documentElement.style.colorScheme = 'light';
        localStorage.setItem('tierd-theme', 'light');
      }
      
      // Show subtle toast
      toast({
        title: checked ? "Dark mode enabled" : "Light mode enabled",
        description: "Saving your preference...",
      });
      
      const result = await UserService.updateUserPreferences(user.id, {
        darkMode: checked
      });
      
      if (!result.success) {
        // Reset to previous state on error - both UI and system
        setProfileForm(prev => ({
          ...prev,
          darkMode: !checked
        }));
        
        // Revert theme
        if (!checked) {
          document.documentElement.classList.remove('light');
          document.documentElement.classList.add('dark');
          document.documentElement.style.colorScheme = 'dark';
          localStorage.setItem('tierd-theme', 'dark');
        } else {
          document.documentElement.classList.remove('dark');
          document.documentElement.classList.add('light');
          document.documentElement.style.colorScheme = 'light';
          localStorage.setItem('tierd-theme', 'light');
        }
        
        toast({
          title: "Error saving preference",
          description: result.error || "Please try again",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error updating dark mode:", error);
      
      // Reset to previous state
      setProfileForm(prev => ({
        ...prev,
        darkMode: !checked
      }));
      
      toast({
        title: "Error saving preference",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive"
      });
    }
  };

  const handlePublicProfileToggle = async (checked: boolean) => {
    setProfileForm(prev => ({
      ...prev,
      is_public: checked
    }));
    
    // Update this preference immediately
    try {
      if (!user?.id) return;
      
      // Show subtle toast
      toast({
        title: checked ? "Profile set to public" : "Profile set to private",
        description: "Saving your preference...",
      });
      
      const result = await UserService.updateUserPreferences(user.id, {
        is_public: checked
      });
      
      if (!result.success) {
        // Reset to previous state on error
        setProfileForm(prev => ({
          ...prev,
          is_public: !checked
        }));
        
        toast({
          title: "Error saving preference",
          description: result.error || "Please try again",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error updating profile visibility:", error);
      
      // Reset to previous state
      setProfileForm(prev => ({
        ...prev,
        is_public: !checked
      }));
      
      toast({
        title: "Error saving preference",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive"
      });
    }
  };

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
                  <Button 
                    size="sm" 
                    onClick={handleSaveChanges}
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <>
                        <Spinner className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : "Save Changes"}
                  </Button>
                </div>
                
                {/* Personal Information Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Personal Information</h3>
                  <div className="space-y-4">
                    {/* Avatar upload section */}
                    <div className="flex flex-col items-center md:flex-row md:items-start gap-4">
                      <div className="relative">
                        <Avatar className="h-20 w-20">
                          {avatarPreview ? (
                            <AvatarImage src={avatarPreview} alt="Avatar preview" />
                          ) : profileForm.avatar_url ? (
                            <AvatarImage src={profileForm.avatar_url} alt={profileForm.name || "User"} />
                          ) : (
                            <AvatarFallback>
                              {profileForm.name ? profileForm.name.charAt(0).toUpperCase() : "U"}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <input
                          type="file"
                          id="avatar-upload"
                          accept="image/*"
                          onChange={handleAvatarChange}
                          className="hidden"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full"
                          onClick={() => document.getElementById('avatar-upload')?.click()}
                        >
                          <ImageIcon className="h-4 w-4" />
                          <span className="sr-only">Upload avatar</span>
                        </Button>
                      </div>
                      <div className="space-y-2 flex-1">
                        <div className="grid gap-2">
                          <Label htmlFor="name">Display Name</Label>
                          <Input
                            id="name"
                            value={profileForm.name}
                            onChange={(e) => setProfileForm({...profileForm, name: e.target.value})}
                            placeholder="Your display name"
                          />
                        </div>
                      </div>
                    </div>
                    
                    {/* Email input section */}
                    <div className="space-y-4">
                      <Label htmlFor="email">Email</Label>
                      <div className="flex gap-2">
                        <Input
                          id="email"
                          type="email"
                          value={profileForm.email}
                          onChange={(e) => setProfileForm({...profileForm, email: e.target.value})}
                          placeholder="Email address"
                        />
                        <Button
                          type="button"
                          onClick={handleEmailUpdate}
                          disabled={emailUpdateState.processing || profileForm.email === user?.email || !profileForm.email}
                          variant="outline"
                          size="sm"
                          className="shrink-0 h-10"
                        >
                          {emailUpdateState.processing ? (
                            <>
                              <Spinner className="mr-1 h-4 w-4" />
                              Updating...
                            </>
                          ) : (
                            "Update Email"
                          )}
                        </Button>
                      </div>
                      {emailUpdateState.error && (
                        <p className="text-sm text-red-500">{emailUpdateState.error}</p>
                      )}
                    </div>
                    
                    {/* Bio section */}
                    <div className="grid gap-2">
                      <Label htmlFor="bio">Bio</Label>
                      <Textarea
                        id="bio"
                        value={profileForm.bio}
                        onChange={(e) => setProfileForm({...profileForm, bio: e.target.value})}
                        placeholder="Tell us about yourself..."
                        className="resize-none"
                        rows={4}
                      />
                      <p className="text-xs text-muted-foreground">
                        This information will be displayed on your public profile.
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Preferences section */}
                <div className="mt-8 space-y-4">
                  <h3 className="text-lg font-medium">Preferences</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Email Notifications</p>
                        <p className="text-sm text-muted-foreground">Receive product updates via email</p>
                      </div>
                      <Switch
                        checked={profileForm.emailNotifications}
                        onCheckedChange={handleEmailNotificationsToggle}
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
                        onCheckedChange={handleDarkModeToggle}
                      />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Public Profile</p>
                        <p className="text-sm text-muted-foreground">Allow others to see your profile</p>
                      </div>
                      <Switch
                        checked={profileForm.is_public}
                        onCheckedChange={handlePublicProfileToggle}
                      />
                    </div>
                  </div>
                </div>
                
                {/* Delete Account */}
                <div className="pt-8">
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={handleDeleteAccount}
                  >
                    Delete Account
                  </Button>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
} 