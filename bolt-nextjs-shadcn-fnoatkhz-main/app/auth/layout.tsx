"use client"

import { GamepadIcon } from "lucide-react"
import Link from "next/link"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="container relative flex min-h-screen flex-col items-center justify-center">
      <Link
        href="/"
        className="absolute left-4 top-4 flex items-center text-lg font-bold md:left-8 md:top-8"
      >
        <GamepadIcon className="mr-2 h-6 w-6" />
        <span>Tier'd</span>
      </Link>
      {children}
    </div>
  )
}