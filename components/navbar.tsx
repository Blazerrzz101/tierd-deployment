"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { GamepadIcon } from "lucide-react"
import { ProfileMenu } from "@/components/profile/profile-menu"
import { useAuth } from "@/hooks/use-auth"

export function Navbar() {
  const pathname = usePathname()
  const { user, signOut } = useAuth()

  const routes = [
    { href: "/", label: "Home" },
    { href: "/threads", label: "Threads" }
  ]

  return (
    <header className="fixed top-0 z-50 w-full border-b border-border/10 bg-black/80 backdrop-blur">
      <nav className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <GamepadIcon className="h-6 w-6" />
          <span className="text-lg font-bold">Tier'd</span>
        </Link>

        <div className="flex items-center space-x-8">
          {routes.map((route) => (
            <Link
              key={route.href}
              href={route.href}
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary",
                pathname === route.href
                  ? "text-primary"
                  : "text-muted-foreground"
              )}
            >
              {route.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-4">
          {user ? (
            <ProfileMenu user={user} onSignOut={signOut} />
          ) : (
            <>
              <Button variant="outline" size="sm" asChild>
                <Link href="/auth/sign-in">Sign In</Link>
              </Button>
              <Button 
                size="sm" 
                className="bg-primary text-white hover:bg-primary/90"
                asChild
              >
                <Link href="/auth/sign-up">Sign Up</Link>
              </Button>
            </>
          )}
        </div>
      </nav>
    </header>
  )
}