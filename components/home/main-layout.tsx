"use client"

import { usePathname } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/layout/footer"

interface MainLayoutProps {
  children: React.ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  const pathname = usePathname()
  const showNavbar = pathname !== "/"

  return (
    <div className="flex min-h-screen flex-col bg-black text-white">
      {showNavbar && <Navbar />}
      <main className="flex-1 flex flex-col">{children}</main>
    </div>
  )
}