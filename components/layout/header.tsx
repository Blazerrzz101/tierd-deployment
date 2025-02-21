"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import { AuthNav } from "@/components/auth/auth-nav"
import { UserNav } from "@/components/auth/user-nav"
import { useAuth } from "@/hooks/use-auth"

export function Header() {
  const pathname = usePathname()
  const { user } = useAuth()

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-black/50 backdrop-blur-xl">
      <div className="container flex h-16 items-center">
        <div className="mr-8">
          <Link href="/" className="flex items-center space-x-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-6 w-6"
            >
              <path d="M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3" />
            </svg>
            <span className="text-lg font-bold">Tierd</span>
          </Link>
        </div>
        <nav className="flex flex-1 items-center space-x-6 text-sm">
          <Link
            href="/rankings"
            className={cn(
              "transition-colors hover:text-foreground/80",
              pathname === "/rankings" ? "text-foreground" : "text-foreground/60"
            )}
          >
            Rankings
          </Link>
          <Link
            href="/threads"
            className={cn(
              "transition-colors hover:text-foreground/80",
              pathname === "/threads" ? "text-foreground" : "text-foreground/60"
            )}
          >
            Discussions
          </Link>
          <Link
            href="/about"
            className={cn(
              "transition-colors hover:text-foreground/80",
              pathname === "/about" ? "text-foreground" : "text-foreground/60"
            )}
          >
            About
          </Link>
        </nav>
        <div className="ml-auto flex items-center space-x-4">
          {user ? <UserNav /> : <AuthNav />}
        </div>
      </div>
    </header>
  )
} 