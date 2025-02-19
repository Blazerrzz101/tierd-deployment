import { Button } from "@/components/ui/button"
import { AlertCircle } from "lucide-react"
import Link from "next/link"

interface ProductErrorFallbackProps {
  error?: Error
  resetErrorBoundary?: () => void
}

export function ProductErrorFallback({
  error,
  resetErrorBoundary,
}: ProductErrorFallbackProps) {
  const errorMessage = error?.message || "An error occurred while loading the product"
  const isNotFound = errorMessage.includes('not found')
  const isNetworkError = errorMessage.toLowerCase().includes('network') || 
                        errorMessage.toLowerCase().includes('connection')
  const isServerError = errorMessage.toLowerCase().includes('server') ||
                       errorMessage.toLowerCase().includes('500')

  return (
    <div className="container flex min-h-[400px] flex-col items-center justify-center">
      <div className="flex flex-col items-center space-y-4 text-center">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <h2 className="text-2xl font-bold">
          {isNotFound ? "Product Not Found" : "Something went wrong!"}
        </h2>
        <p className="text-muted-foreground max-w-md">
          {isNotFound
            ? "The product you're looking for doesn't exist or has been moved."
            : isNetworkError
            ? "There seems to be a network issue. Please check your connection and try again."
            : isServerError
            ? "We're experiencing server issues. Please try again later."
            : errorMessage}
        </p>
        <div className="flex gap-4">
          {resetErrorBoundary && (
            <Button onClick={resetErrorBoundary}>Try again</Button>
          )}
          <Button variant="outline" asChild>
            <Link href="/products">Browse Products</Link>
          </Button>
        </div>
      </div>
    </div>
  )
} 