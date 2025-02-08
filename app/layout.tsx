import './globals.css'
import '@/lib/env'  // Import environment validation
import { Inter } from 'next/font/google'
import { ThemeProvider } from "@/components/theme-provider"
import { Footer } from "@/components/footer"
import { Toaster } from "@/components/ui/toaster"
import { BackgroundGradient } from "@/components/background-gradient"
import { BetaBanner } from "@/components/beta/BetaBanner"
import { RealtimeProvider } from "@/components/providers/realtime-provider"
import type { Metadata } from "next"
import { SupabaseErrorBoundary } from "@/components/supabase-error-boundary"
import { Providers } from "./providers"
import { Header } from "@/components/layout/header"

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: "Tier'd - Gaming Gear Ranked by Streamers",
  description: "Discover and rank the best gaming gear, curated by streamers.",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          <SupabaseErrorBoundary>
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
                    <Header />
                    {children}
                    <Footer />
                  </div>
                </div>
              </RealtimeProvider>
              <Toaster />
            </ThemeProvider>
          </SupabaseErrorBoundary>
        </Providers>
      </body>
    </html>
  )
}