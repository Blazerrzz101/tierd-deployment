"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/hooks/use-auth"
import { Card } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Activity, ThumbsUp, ThumbsDown, MessageSquare } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface UserActivity {
  id: string
  type: "vote" | "comment" | "review"
  action: "upvote" | "downvote" | "comment" | "review"
  productId: string
  productName: string
  timestamp: string
  details?: string
}

export default function ActivitiesPage() {
  const { user } = useAuth()
  const [activities, setActivities] = useState<UserActivity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const response = await fetch(`/api/activities?userId=${user?.id}`);
        const data = await response.json();
        if (data.success) {
          setActivities(data.activities);
        }
      } catch (error) {
        console.error("Error fetching activities:", error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchActivities();
    }
  }, [user]);

  const getActivityIcon = (activity: UserActivity) => {
    switch (activity.action) {
      case "upvote":
        return <ThumbsUp className="h-4 w-4 text-green-500" />;
      case "downvote":
        return <ThumbsDown className="h-4 w-4 text-red-500" />;
      case "comment":
        return <MessageSquare className="h-4 w-4 text-blue-500" />;
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

  if (!user) {
    return (
      <div className="container mx-auto py-8">
        <h1 className="text-2xl font-bold mb-4">Please sign in to view your activities</h1>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center gap-2 mb-6">
        <Activity className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Your Activities</h1>
      </div>

      {loading ? (
        <div>Loading activities...</div>
      ) : activities.length === 0 ? (
        <Card className="p-4">
          <p className="text-center text-muted-foreground">No activities yet</p>
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