"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Trophy, Users, Star, Activity } from "lucide-react"

export function CommunitySidebar() {
  return (
    <div className="space-y-6">
      {/* Community Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Community Stats
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="flex items-center gap-3">
            <Users className="h-4 w-4 text-muted-foreground" />
            <div>
              <div className="font-medium">5,234</div>
              <div className="text-sm text-muted-foreground">Active Members</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Star className="h-4 w-4 text-muted-foreground" />
            <div>
              <div className="font-medium">156</div>
              <div className="text-sm text-muted-foreground">Reviews Today</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Reviewers */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            Top Reviewers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { name: "Alex Chen", points: 450, badge: "Expert" },
              { name: "Sarah Kim", points: 380, badge: "Pro" },
              { name: "Mike Ross", points: 310, badge: "Veteran" }
            ].map((reviewer, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 font-medium text-primary">
                    {i + 1}
                  </div>
                  <div>
                    <div className="font-medium">{reviewer.name}</div>
                    <div className="text-sm text-muted-foreground">{reviewer.badge}</div>
                  </div>
                </div>
                <div className="text-sm font-medium">{reviewer.points} pts</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Links */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-2">
            <Button variant="outline" className="w-full justify-start">
              Community Polls
            </Button>
            <Button variant="outline" className="w-full justify-start">
              Join Discussions
            </Button>
            <Button variant="outline" className="w-full justify-start">
              Leaderboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}