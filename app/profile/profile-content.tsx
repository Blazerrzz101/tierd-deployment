"use client"

import { User } from "@supabase/auth-helpers-nextjs"
import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { toast } from "sonner"

interface ProfileContentProps {
  user: User
  userDetails?: {
    username?: string
    avatar_url?: string
    is_public?: boolean
    is_online?: boolean
    last_seen?: string
  }
  recentVotes?: Array<{
    id: string
    vote_type: 'up' | 'down'
    created_at: string
    products: {
      name: string
      url_slug: string
      image_url: string | null
    }
  }>
}

export function ProfileContent({ user, userDetails, recentVotes = [] }: ProfileContentProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    username: userDetails?.username || '',
    avatar_url: userDetails?.avatar_url || '',
    is_public: userDetails?.is_public || false
  })

  const supabase = createClientComponentClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const { error } = await supabase
        .from('users')
        .update({
          username: formData.username,
          avatar_url: formData.avatar_url,
          is_public: formData.is_public,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (error) throw error

      toast.success('Profile updated successfully')
      setIsEditing(false)
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error('Failed to update profile')
    } finally {
      setIsLoading(false)
    }
  }

  const getInitials = (email: string) => {
    return email.substring(0, 2).toUpperCase()
  }

  return (
    <div className="container max-w-4xl py-8">
      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="activity">Recent Activity</TabsTrigger>
        </TabsList>
        
        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
              <CardDescription>
                Manage your profile settings and preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={userDetails?.avatar_url || ''} />
                    <AvatarFallback>{getInitials(user.email || '')}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-lg font-medium">{userDetails?.username || 'User'}</h3>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                </div>

                {isEditing ? (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="username">Username</Label>
                      <Input
                        id="username"
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="avatar_url">Avatar URL</Label>
                      <Input
                        id="avatar_url"
                        value={formData.avatar_url}
                        onChange={(e) => setFormData({ ...formData, avatar_url: e.target.value })}
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="public-profile"
                        checked={formData.is_public}
                        onCheckedChange={(checked) => setFormData({ ...formData, is_public: checked })}
                      />
                      <Label htmlFor="public-profile">Public Profile</Label>
                    </div>

                    <div className="flex space-x-2">
                      <Button type="submit" disabled={isLoading}>
                        {isLoading ? 'Saving...' : 'Save Changes'}
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setIsEditing(false)}
                        disabled={isLoading}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                ) : (
                  <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
                )}

                <div className="space-y-2">
                  <h4 className="font-medium">Profile Status</h4>
                  <div className="flex items-center space-x-2">
                    <div className={`h-2 w-2 rounded-full ${userDetails?.is_online ? "bg-green-500" : "bg-gray-300"}`} />
                    <span className="text-sm text-muted-foreground">
                      {userDetails?.is_online ? "Online" : "Offline"}
                    </span>
                  </div>
                  {userDetails?.last_seen && (
                    <p className="text-sm text-muted-foreground">
                      Last seen: {new Date(userDetails.last_seen).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Your recent votes and interactions</CardDescription>
            </CardHeader>
            <CardContent>
              {recentVotes.length === 0 ? (
                <p className="text-muted-foreground">No recent activity</p>
              ) : (
                <div className="space-y-4">
                  {recentVotes.map((vote) => (
                    <div key={vote.id} className="flex items-center space-x-4">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={vote.products.image_url || ''} />
                        <AvatarFallback>{vote.products.name[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {vote.products.name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          You {vote.vote_type === 'up' ? 'upvoted' : 'downvoted'} this product
                        </p>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(vote.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 