import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { AtSign, MessageSquare } from "lucide-react"

interface WelcomeThreadsProps {
  onGetStarted: () => void
}

export function WelcomeThreads({ onGetStarted }: WelcomeThreadsProps) {
  return (
    <div className="flex min-h-[80vh] items-center justify-center">
      <Card className="max-w-2xl">
        <CardContent className="p-8 text-center">
          <MessageSquare className="mx-auto h-12 w-12 text-primary" />
          <h1 className="mt-6 text-3xl font-bold">Welcome to Discussions</h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Join the conversation about gaming gear. Share your experiences, ask questions, and connect with other enthusiasts.
          </p>
          
          <div className="mt-8 space-y-4">
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <AtSign className="h-5 w-5" />
              <span>Use @ to mention products in your discussions</span>
            </div>
          </div>

          <Button onClick={onGetStarted} size="lg" className="mt-8">
            Start a Discussion
          </Button>
        </CardContent>
      </Card>
    </div>
  )
} 