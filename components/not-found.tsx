import { Button } from "@/components/ui/button"
import { Home } from "lucide-react"
import Link from "next/link"

interface NotFoundProps {
  title?: string
  description?: string
}

export function NotFound({ 
  title = "Not Found", 
  description = "The resource you're looking for doesn't exist or has been moved."
}: NotFoundProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <h1 className="text-6xl font-bold mb-4">404</h1>
      <h2 className="text-2xl font-semibold mb-6">{title}</h2>
      <p className="text-white/70 mb-8 max-w-md">
        {description}
      </p>
      <Link href="/">
        <Button className="flex items-center gap-2">
          <Home className="h-4 w-4" />
          Return Home
        </Button>
      </Link>
    </div>
  )
} 