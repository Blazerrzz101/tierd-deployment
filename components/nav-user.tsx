"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/hooks/use-auth"
import { User } from "lucide-react"
import Link from "next/link"
import { User as SupabaseUser } from "@supabase/supabase-js"

interface UserMetadata {
  avatar_url?: string
  full_name?: string
}

interface AuthUser extends SupabaseUser {
  user_metadata: UserMetadata
}

export function UserNav() {
  const { user, signOut } = useAuth()

  if (!user) {
    return (
      <Button variant="ghost" size="sm" asChild>
        <Link href="/auth/sign-in">
          Sign In
        </Link>
      </Button>
    )
  }

  const authUser = user as AuthUser

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src={authUser.user_metadata.avatar_url} alt={authUser.email} />
            <AvatarFallback>
              <User className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {authUser.user_metadata.full_name || authUser.email}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {authUser.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/profile">
            Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem
          className="cursor-pointer"
          onSelect={(event) => {
            event.preventDefault()
            signOut()
          }}
        >
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 