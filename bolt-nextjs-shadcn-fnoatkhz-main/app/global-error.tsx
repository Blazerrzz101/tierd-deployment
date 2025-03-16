"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { AlertCircle } from "lucide-react"

interface GlobalErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    console.error("Global error:", error)
  }, [error])

  return (
    <html>
      <body>
        <div className="container flex min-h-screen flex-col items-center justify-center">
          <div className="flex flex-col items-center space-y-4 text-center">
            <AlertCircle className="h-12 w-12 text-destructive" />
            <h2 className="text-2xl font-bold">Application Error</h2>
            <p className="text-muted-foreground">
              {error.message || "A critical error occurred. Please try again."}
            </p>
            <Button onClick={() => reset()}>Reload Application</Button>
          </div>
        </div>
      </body>
    </html>
  )
}