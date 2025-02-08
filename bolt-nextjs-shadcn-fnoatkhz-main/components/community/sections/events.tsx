"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, Trophy, Users } from "lucide-react"

export function EventsSection() {
  const upcomingEvents = [
    {
      title: "Best Gaming Mouse 2024",
      description: "Vote for the best gaming mouse of the year",
      date: "March 15, 2024",
      type: "competition",
      participants: 234
    },
    {
      title: "Mechanical Keyboard Meetup",
      description: "Share and discuss your favorite mechanical keyboards",
      date: "March 20, 2024",
      type: "meetup",
      participants: 89
    }
  ]

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr,300px]">
      {/* Main Content */}
      <div className="space-y-6">
        <div className="flex justify-between">
          <h2 className="text-2xl font-bold">Upcoming Events</h2>
          <Button>Create Event</Button>
        </div>

        <div className="grid gap-4">
          {upcomingEvents.map((event, index) => (
            <Card key={index} className="p-6">
              <div className="flex items-start gap-4">
                <div className="rounded-lg bg-primary/10 p-3">
                  <Calendar className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">{event.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{event.description}</p>
                  <div className="mt-4 flex items-center gap-4">
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      {event.date}
                    </div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Users className="h-4 w-4" />
                      {event.participants} participants
                    </div>
                  </div>
                </div>
                <Button>Join Event</Button>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        <Card className="p-4">
          <h3 className="mb-4 font-semibold">Leaderboard</h3>
          <div className="space-y-4">
            {[1, 2, 3].map((position) => (
              <div key={position} className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                  <Trophy className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <div className="font-medium">User {position}</div>
                  <div className="text-sm text-muted-foreground">{100 - position * 10} points</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}