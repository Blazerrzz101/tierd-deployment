"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Icons } from "@/components/icons"
import { useAuth } from "@/hooks/use-auth"
import { UserNav } from "@/components/layout/user-nav"

export function Navbar() {
  const { user } = useAuth()

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-xl items-center justify-between mx-auto px-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center space-x-2">
            <Icons.logo className="h-6 w-6" />
            <span className="font-bold">Tier'd</span>
          </Link>
          
          <nav className="hidden md:flex items-center space-x-6">
            <Link href="/" className="text-sm font-medium transition-colors hover:text-primary">
              Home
            </Link>
            <Link href="/threads" className="text-sm font-medium transition-colors hover:text-primary">
              Threads
            </Link>
          </nav>
        </div>

        <div className="flex items-center space-x-4">
          {user ? (
            <div className="flex items-center space-x-4">
              <Link href="/profile" className="text-sm font-medium hover:text-primary">
                Profile
              </Link>
              <UserNav user={user} />
            </div>
          ) : (
            <div className="flex items-center space-x-4">
              <Link href="/auth/sign-in" className="text-sm font-medium hover:text-primary">
                Sign in
              </Link>
              <Link
                href="/auth/sign-up"
                className="text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md"
              >
                Sign up
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  )
} 