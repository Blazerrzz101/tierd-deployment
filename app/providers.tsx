"use client"

import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { BackgroundGradient } from "@/components/background-gradient"
import { BetaBanner } from "@/components/beta-banner"
import { RealtimeProvider } from "@/components/providers/realtime-provider"
import { VoteNotifications } from "@/components/notifications/vote-notifications"
import { TooltipProvider } from "@/components/ui/tooltip"
import { SupabaseErrorBoundary } from "@/components/supabase-error-boundary"
import { Header } from "@/components/layout/header"
import { AuthProvider } from "@/hooks/use-auth"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SupabaseErrorBoundary>
      <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        enableSystem={false}
        disableTransitionOnChange
        storageKey="tierd-theme"
      >
        <TooltipProvider>
          <RealtimeProvider>
            <AuthProvider>
              <div className="relative flex min-h-screen flex-col">
                <main className="relative flex-1">
                  <BetaBanner />
                  <BackgroundGradient />
                  <div className="relative z-10">
                    <Header />
                    {children}
                  </div>
                </main>
                <VoteNotifications />
              </div>
            </AuthProvider>
          </RealtimeProvider>
        </TooltipProvider>
        <Toaster />
      </ThemeProvider>
    </SupabaseErrorBoundary>
  )
} 