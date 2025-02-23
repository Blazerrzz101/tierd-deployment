"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function SettingsError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error)
  }, [error])

  return (
    <div className="container max-w-4xl space-y-8 py-10">
      <Card>
        <CardHeader>
          <CardTitle>Something went wrong!</CardTitle>
          <CardDescription>
            There was a problem loading your settings. Please try again.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-start space-y-2">
          <p className="text-sm text-muted-foreground">
            Error: {error.message}
          </p>
          <Button
            onClick={() => reset()}
            variant="default"
          >
            Try again
          </Button>
        </CardContent>
      </Card>
    </div>
  )
} 