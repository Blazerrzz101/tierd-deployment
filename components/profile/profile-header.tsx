"use client"

import { useState } from "react"
import { UserProfile } from "@/types/user"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Globe, Lock, Edit2 } from "lucide-react"
import { formatDate } from "@/lib/utils"
import { ProfileEditDialog } from "./profile-edit-dialog"

interface ProfileHeaderProps {
  user?: UserProfile
  isOwnProfile?: boolean
}

export function ProfileHeader({ user, isOwnProfile }: ProfileHeaderProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [currentUser, setCurrentUser] = useState(user)

  // Early return with loading state if no user
  if (!currentUser) {
    return (
      <div className="flex animate-pulse flex-col gap-6 sm:flex-row sm:items-start">
        <div className="h-24 w-24 rounded-full bg-muted" />
        <div className="flex-1 space-y-4">
          <div className="h-8 w-48 rounded bg-muted" />
          <div className="h-4 w-64 rounded bg-muted" />
        </div>
      </div>
    )
  }

  const handleProfileUpdate = (data: { username: string; avatarUrl?: string }) => {
    setCurrentUser({
      ...currentUser,
      username: data.username,
      avatarUrl: data.avatarUrl || currentUser.avatarUrl,
    })
  }

  return (
    <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
      <div className="relative">
        <Avatar className="h-24 w-24 border-2 border-background">
          <AvatarImage 
            src={currentUser.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.username}`} 
            className="object-cover" 
          />
          <AvatarFallback>{currentUser.username[0]}</AvatarFallback>
        </Avatar>
        
        <div 
          className="absolute -right-1 -top-1 h-4 w-4 rounded-full border-2 border-background"
          title={currentUser.isOnline ? "Online" : "Offline"}
        >
          <div className={`h-full w-full rounded-full ${currentUser.isOnline ? 'bg-green-500' : 'bg-gray-500'}`} />
        </div>
      </div>
      
      <div className="flex-1">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold">{currentUser.username}</h1>
          <Badge variant={currentUser.isPublic ? "default" : "secondary"}>
            {currentUser.isPublic ? <Globe className="mr-1 h-3 w-3" /> : <Lock className="mr-1 h-3 w-3" />}
            {currentUser.isPublic ? "Public" : "Private"}
          </Badge>
          {isOwnProfile && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditDialogOpen(true)}
            >
              <Edit2 className="mr-2 h-4 w-4" />
              Edit Profile
            </Button>
          )}
        </div>
        
        <p className="mt-1 text-muted-foreground">
          Member since {formatDate(currentUser.createdAt)}
        </p>
        
        <div className="mt-4 flex gap-2">
          <Button variant="outline" size="sm">
            {currentUser.activityLog.length} Activities
          </Button>
          <Button variant="outline" size="sm">
            {currentUser.preferredAccessories.length} Accessories
          </Button>
        </div>
      </div>

      <ProfileEditDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        currentUsername={currentUser.username}
        currentAvatarUrl={currentUser.avatarUrl}
        onUpdate={handleProfileUpdate}
      />
    </div>
  )
}