"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

export function AuthNav() {
  const pathname = usePathname()

  return (
    <nav className="flex items-center space-x-2">
      <Link
        href="/auth/sign-in"
        className={cn(
          buttonVariants({ variant: pathname === "/auth/sign-in" ? "default" : "ghost" }),
          "flex-1 sm:flex-none"
        )}
      >
        Sign In
      </Link>
      <Link
        href="/auth/sign-up"
        className={cn(
          buttonVariants({ variant: pathname === "/auth/sign-up" ? "default" : "ghost" }),
          "flex-1 sm:flex-none"
        )}
      >
        Sign Up
      </Link>
    </nav>
  )
} 