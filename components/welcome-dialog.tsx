"use client"

import { useEffect, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { GamepadIcon } from "lucide-react"

export function WelcomeDialog() {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const hasSeenWelcome = localStorage.getItem("hasSeenWelcome")
    if (!hasSeenWelcome) {
      setIsOpen(true)
      localStorage.setItem("hasSeenWelcome", "true")
    }
  }, [])

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <GamepadIcon className="h-6 w-6 text-primary" />
          </div>
          <DialogTitle className="text-center text-2xl">Welcome to Tier'd Beta!</DialogTitle>
          <DialogDescription className="text-center">
            Join our community of gamers to discover, rank, and discuss the best gaming gear.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <h4 className="font-medium">What&apos;s New in Beta:</h4>
            <ul className="list-inside list-disc space-y-2 text-sm text-muted-foreground">
              <li>Community-driven rankings for gaming accessories</li>
              <li>Detailed product reviews and discussions</li>
              <li>Personalized profiles and recommendations</li>
              <li>Real-time voting and activity tracking</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button 
            className="w-full" 
            onClick={() => setIsOpen(false)}
          >
            Get Started
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}