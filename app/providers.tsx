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
// Import the AuthProvider from enhanced-auth hook, not the components/auth/auth-provider
import { AuthProvider } from "@/hooks/enhanced-auth"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SupabaseErrorBoundary>
      <QueryClientProvider client={queryClient}>
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
      </QueryClientProvider>
    </SupabaseErrorBoundary>
  )
} 