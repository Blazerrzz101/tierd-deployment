"use client"

import './globals.css'
import { Inter } from 'next/font/google'
import { ThemeProvider } from "@/components/theme-provider"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Toaster } from "@/components/ui/sonner"
import { BackgroundGradient } from "@/components/background-gradient"
import { BetaBanner } from "@/components/beta/BetaBanner"
import { RealtimeProvider } from "@/components/providers/realtime-provider"

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <RealtimeProvider>
            <div className="relative flex min-h-screen flex-col">
              <BetaBanner />
              <BackgroundGradient />
              <div className="relative z-10">
                <Navbar />
                <main className="flex-1">{children}</main>
                <Footer />
              </div>
            </div>
          </RealtimeProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}