"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import { AuthNav } from "@/components/auth/auth-nav"
import { UserNav } from "@/components/auth/user-nav"
import { useEnhancedAuth } from "@/hooks/enhanced-auth"
import { Search } from "lucide-react"
import { AnimatedLogo } from "../ui/animated-logo"

export function Header() {
  const pathname = usePathname()
  const { user, isAuthenticated } = useEnhancedAuth()

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-black/50 backdrop-blur-xl">
      <div className="container flex h-16 items-center">
        <div className="mr-8">
          <Link href="/" className="flex items-center space-x-2">
            <div className="relative">
              <AnimatedLogo />
              <span className="sr-only">Tier'd</span>
            </div>
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
            href="/community"
            className={cn(
              "transition-colors hover:text-foreground/80",
              pathname === "/community" || pathname.startsWith("/community/") ? "text-foreground" : "text-foreground/60"
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
          {/* Search button */}
          <button 
            className="p-2 rounded-full hover:bg-gray-800/50"
            onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }))}
          >
            <Search className="h-5 w-5" />
          </button>
          
          {isAuthenticated ? <UserNav /> : <AuthNav />}
        </div>
      </div>
    </header>
  )
} 