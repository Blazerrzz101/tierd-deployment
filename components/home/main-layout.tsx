"use client"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/layout/footer"
import { CategoryBar } from "@/components/layout/category-bar"
import { motion } from "framer-motion"

interface MainLayoutProps {
  children: React.ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  const pathname = usePathname()
  const showNavbar = pathname !== "/"
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  // Track mouse position for dynamic background
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth) * 100
      const y = (e.clientY / window.innerHeight) * 100
      setMousePosition({ x, y })
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  return (
    <div className="flex min-h-screen flex-col bg-black text-white relative overflow-hidden">
      {/* Dynamic background gradient */}
      <motion.div 
        className="fixed inset-0 pointer-events-none"
        animate={{
          background: [
            `radial-gradient(circle at ${mousePosition.x}% ${mousePosition.y}%, rgba(255,75,38,0.15), transparent 25%)`,
            `radial-gradient(circle at ${mousePosition.x}% ${mousePosition.y}%, rgba(255,75,38,0.1), transparent 20%)`,
            `radial-gradient(circle at ${mousePosition.x}% ${mousePosition.y}%, rgba(255,75,38,0.15), transparent 25%)`
          ]
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      {/* Content */}
      <div className="relative z-10">
        {showNavbar && <Navbar />}
        <CategoryBar />
        <main className="flex-1 flex flex-col items-center min-h-screen">
          <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
        <Footer />
      </div>
    </div>
  )
}