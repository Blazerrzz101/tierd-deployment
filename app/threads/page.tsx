"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

export default function ThreadsRedirectPage() {
  const router = useRouter()
  
  // Redirect to /community
  useEffect(() => {
    console.log("Redirecting from /threads to /community")
    // Small delay to ensure the router is ready
    const redirectTimer = setTimeout(() => {
      router.push("/community")
    }, 100)
    
    return () => clearTimeout(redirectTimer)
  }, [router])
  
  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Discussions are now at /community</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin mb-4" />
          <p className="text-center mb-2">
            Redirecting you to our improved Discussions page...
          </p>
          <p className="text-sm text-muted-foreground">
            If you are not redirected automatically, 
            <a href="/community" className="text-primary ml-1 hover:underline">
              click here
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  )
} 