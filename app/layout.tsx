import './globals.css'
import '@/styles/animations.css'
import '@/lib/env'
import { Inter } from 'next/font/google'
import type { Metadata } from "next"
import { Providers } from "@/app/providers"
import { cn } from "@/lib/utils"

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: "Tier'd - Gaming Gear Rankings",
  description: "Community-driven gaming gear rankings and reviews",
  icons: {
    icon: "/favicon.ico",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn(
        "min-h-screen bg-background font-sans antialiased",
        inter.className
      )}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}