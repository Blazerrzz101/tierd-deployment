"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useEnhancedAuth } from "@/hooks/enhanced-auth"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"

export default function ProfilePage() {
  const router = useRouter()
  const { isLoading, isAuthenticated } = useEnhancedAuth()
  
  // Log the auth state for debugging
  useEffect(() => {
    console.log("Profile page auth state:", {
      isLoading,
      isAuthenticated,
      timestamp: new Date().toISOString()
    })
    
    // Add a short delay before redirecting to ensure auth state is settled
    const redirectTimer = setTimeout(() => {
      router.push("/my-profile")
    }, 1500)
    
    return () => clearTimeout(redirectTimer)
  }, [isLoading, isAuthenticated, router])
  
  return (
    <div className="container max-w-4xl py-8 mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Profile Page Moved</CardTitle>
          <CardDescription>
            We've improved the profile page and moved it to a new location
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
          <Loader2 className="w-8 h-8 mb-4 text-primary animate-spin" />
          <p className="text-center">
            Redirecting you to the new and improved profile page...
          </p>
          <Button 
            onClick={() => router.push("/my-profile")}
            className="mt-4"
          >
            Go to new profile page
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
