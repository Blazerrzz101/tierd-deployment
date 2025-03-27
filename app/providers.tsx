"use client"

import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { BackgroundGradient } from "@/components/background-gradient"
import { RealtimeProvider } from "@/components/providers/realtime-provider"
import { VoteNotifications } from "@/components/notifications/vote-notifications"
import { TooltipProvider } from "@/components/ui/tooltip"
import { SupabaseErrorBoundary } from "@/components/supabase-error-boundary"
import { Header } from "@/components/layout/header"
// Import the AuthProvider from enhanced-auth hook, not the components/auth/auth-provider
import { EnhancedAuthProvider } from "@/hooks/enhanced-auth"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useEffect } from "react"

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

// Add client ID initialization for voting
const initializeClientId = () => {
  if (typeof window === 'undefined') return

  try {
    // Check if client ID exists in localStorage
    let clientId = localStorage.getItem('clientId')
    
    // If not in localStorage, check cookies
    if (!clientId || clientId === 'undefined' || clientId === 'null') {
      const cookies = document.cookie.split(';')
      for (const cookie of cookies) {
        const [name, value] = cookie.trim().split('=')
        if (name === 'clientId' && value) {
          clientId = value
          console.log('Found client ID in cookie:', clientId)
          localStorage.setItem('clientId', clientId)
          break
        }
      }
    }
    
    // If still no client ID, generate a new one
    if (!clientId || clientId === 'undefined' || clientId === 'null') {
      // Generate a unique client ID
      const timestamp = Date.now().toString(36)
      const randomString = Math.random().toString(36).substring(2, 10)
      clientId = `${timestamp}-${randomString}`
      
      // Store in localStorage
      localStorage.setItem('clientId', clientId)
      console.log('Generated new client ID:', clientId)
      
      // Also set as cookie for fallback
      const oneYearFromNow = new Date()
      oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1)
      document.cookie = `clientId=${clientId}; expires=${oneYearFromNow.toUTCString()}; path=/; SameSite=Lax`
    }
    
    // Output the client ID for debugging
    console.log('Client ID ready:', clientId)
  } catch (error) {
    console.error('Error initializing client ID:', error)
  }
}

export function Providers({ children }: { children: React.ReactNode }) {
  console.log("Providers component rendering - v3")
  
  useEffect(() => {
    console.log("Providers component mounted - v3")
    
    // Initialize client ID
    initializeClientId()
  }, [])
  
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