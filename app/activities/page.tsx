"use client"

import { useEffect, useState } from "react"
import { useEnhancedAuth } from "@/hooks/enhanced-auth"
import { Card } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Activity, ThumbsUp, ThumbsDown, MessageSquare, Star } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { getClientId } from "@/utils/client-id"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { Skeleton } from "@/components/ui/skeleton"
import { createProductUrl } from "@/utils/product-utils"

interface UserActivity {
  id: string
  type: "vote" | "comment" | "review"
  action: "upvote" | "downvote" | "comment" | "review"
  productId: string
  productName: string
  timestamp: string
  details?: string
  productSlug?: string
}

export default function ActivitiesPage() {
  const { user, isAuthenticated, loading: authLoading } = useEnhancedAuth()
  const [activities, setActivities] = useState<UserActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const fetchActivities = async () => {
      if (authLoading) return; // Wait for auth to initialize
      
      try {
        setLoading(true)
        setError(null)
        
        const clientId = getClientId()
        
        // Build query params - always include clientId for anonymous users
        // and userId for logged in users
        const queryParams = new URLSearchParams();
        
        // Always add clientId for anonymous activities
        queryParams.append('clientId', clientId);
        
        // If authenticated, also add userId
        if (user?.id) {
          queryParams.append('userId', user.id);
        }
        
        const response = await fetch(`/api/activities?${queryParams.toString()}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch activities: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
          console.log("Activities loaded:", data.activities.length);
          setActivities(data.activities);
        } else {
          throw new Error(data.error || "Unknown error loading activities");
        }
      } catch (error) {
        console.error("Error fetching activities:", error);
        setError(error instanceof Error ? error.message : "Failed to load activities");
        setActivities([]);
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, [user, authLoading]);

  const getActivityIcon = (activity: UserActivity) => {
    switch (activity.action) {
      case "upvote":
        return <ThumbsUp className="h-4 w-4 text-green-500" />;
      case "downvote":
        return <ThumbsDown className="h-4 w-4 text-red-500" />;
      case "comment":
        return <MessageSquare className="h-4 w-4 text-blue-500" />;
      case "review":
        return <Star className="h-4 w-4 text-yellow-500" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getActivityText = (activity: UserActivity) => {
    switch (activity.action) {
      case "upvote":
        return `Upvoted ${activity.productName}`;
      case "downvote":
        return `Downvoted ${activity.productName}`;
      case "comment":
        return `Commented on ${activity.productName}`;
      case "review":
        return `Reviewed ${activity.productName}`;
      default:
        return `Interacted with ${activity.productName}`;
    }
  };

  // If still loading auth, show a skeleton loader
  if (authLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center gap-2 mb-6">
          <Skeleton className="h-6 w-6 rounded-full" />
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="space-y-4">
          {Array(3).fill(0).map((_, i) => (
            <Card className="p-4" key={i}>
              <div className="flex items-start gap-4">
                <Skeleton className="h-4 w-4 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Show sign in CTA only if user is not authenticated AND we've finished loading 
  // auth status AND there are no anonymous activities
  const showSignInPrompt = !isAuthenticated && !authLoading && activities.length === 0;

  if (showSignInPrompt) {
    return (
      <div className="container mx-auto py-8">
        <h1 className="text-2xl font-bold mb-4">Your Activities</h1>
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-2">Sign in to track your activities</h2>
          <p className="mb-4 text-muted-foreground">
            Create an account or sign in to keep track of all your votes, comments, and reviews.
          </p>
          <div className="flex gap-2">
            <Button 
              onClick={() => router.push('/auth/sign-in')}
              className="mr-2"
            >
              Sign In
            </Button>
            <Button 
              variant="outline" 
              onClick={() => router.push('/products')}
            >
              Browse Products
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center gap-2 mb-6">
        <Activity className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Your Activities</h1>
        {!isAuthenticated && activities.length > 0 && (
          <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded">
            Anonymous
          </span>
        )}
      </div>

      {loading ? (
        <div className="space-y-4">
          {Array(3).fill(0).map((_, i) => (
            <Card className="p-4" key={i}>
              <div className="flex items-start gap-4">
                <Skeleton className="h-4 w-4 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : error ? (
        <Card className="p-4">
          <p className="text-center text-red-500">{error}</p>
          <div className="flex justify-center mt-4">
            <Button 
              variant="outline" 
              onClick={() => window.location.reload()}
              className="mr-2"
            >
              Try Again
            </Button>
            <Button 
              variant="default" 
              onClick={() => router.push('/products')}
            >
              Browse Products
            </Button>
          </div>
        </Card>
      ) : activities.length === 0 ? (
        <Card className="p-4">
          <p className="text-center text-muted-foreground">No activities yet</p>
          <div className="flex justify-center mt-4">
            <Button 
              variant="outline" 
              onClick={() => router.push('/products')}
            >
              Browse Products
            </Button>
          </div>
        </Card>
      ) : (
        <ScrollArea className="h-[600px] rounded-md border">
          <div className="p-4 space-y-4">
            {activities.map((activity) => (
              <Card key={activity.id} className="p-4">
                <div className="flex items-start gap-4">
                  <div className="mt-1">{getActivityIcon(activity)}</div>
                  <div className="flex-1">
                    <p className="font-medium">{getActivityText(activity)}</p>
                    {activity.details && (
                      <p className="text-sm text-muted-foreground mt-1">{activity.details}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">
                      {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                    </p>
                    {activity.productId && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-2 h-auto p-0 text-primary hover:text-primary hover:bg-transparent"
                        onClick={() => router.push(createProductUrl({ id: activity.productId, name: activity.productName, url_slug: activity.productSlug }))}
                      >
                        View Product
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  )
} 