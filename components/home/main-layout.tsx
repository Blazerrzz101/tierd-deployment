"use client"

import { usePathname } from "next/navigation"
import { Navbar } from "@/components/navbar"

interface MainLayoutProps {
  children: React.ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  const pathname = usePathname()
  const showNavbar = pathname !== "/"

  return (
    <>
      {showNavbar && <Navbar />}
      {children}
    </>
  )
}