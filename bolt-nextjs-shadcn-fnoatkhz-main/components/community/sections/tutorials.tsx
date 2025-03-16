"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Search, BookOpen, HelpCircle } from "lucide-react"

export function TutorialsSection() {
  const tutorials = [
    {
      title: "Getting Started with Tier'd",
      description: "Learn how to make the most of our community features",
      category: "Basics",
      readTime: "5 min"
    },
    {
      title: "How Rankings Work",
      description: "Understanding our community-driven ranking system",
      category: "Rankings",
      readTime: "3 min"
    },
    {
      title: "Writing Helpful Reviews",
      description: "Tips for creating valuable product reviews",
      category: "Reviews",
      readTime: "4 min"
    }
  ]

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr,300px]">
      {/* Main Content */}
      <div className="space-y-6">
        <div className="grid gap-4">
          {tutorials.map((tutorial, index) => (
            <Card key={index} className="p-6">
              <div className="flex items-start gap-4">
                <div className="rounded-lg bg-primary/10 p-3">
                  <BookOpen className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">{tutorial.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{tutorial.description}</p>
                  <div className="mt-4 flex items-center gap-4">
                    <span className="text-sm text-muted-foreground">{tutorial.category}</span>
                    <span className="text-sm text-muted-foreground">{tutorial.readTime} read</span>
                  </div>
                </div>
                <Button variant="outline">Read More</Button>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        <Card className="p-4">
          <h3 className="mb-4 font-semibold">Quick Help</h3>
          <div className="space-y-4">
            {["How to vote?", "Ranking system", "Writing reviews"].map((topic, index) => (
              <Button
                key={index}
                variant="ghost"
                className="w-full justify-start"
              >
                <HelpCircle className="mr-2 h-4 w-4" />
                {topic}
              </Button>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}