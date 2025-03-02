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
// import { AuthProvider } from "@/hooks/use-auth" // Comment out the old auth provider
import { EnhancedAuthProvider } from "@/components/auth/auth-provider" // Import our new auth provider
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
              <EnhancedAuthProvider>
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
              </EnhancedAuthProvider>
            </RealtimeProvider>
          </TooltipProvider>
          <Toaster />
        </ThemeProvider>
      </QueryClientProvider>
    </SupabaseErrorBoundary>
  )
} 