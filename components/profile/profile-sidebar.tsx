"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Bell, Settings, LogOut } from "lucide-react"

export function ProfileSidebar() {
  return (
    <div className="space-y-6">
      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>Recommended for You</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            "Write 2 more reviews to earn your next badge!",
            "Vote on trending gaming mice",
            "Join the mechanical keyboard discussion"
          ].map((recommendation, i) => (
            <div
              key={i}
              className="rounded-lg border p-4 text-sm hover:bg-muted/50"
            >
              {recommendation}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-2">
            <Button
              variant="outline"
              className="w-full justify-start"
              size="lg"
            >
              <Bell className="mr-2 h-4 w-4" />
              Notification Settings
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              size="lg"
            >
              <Settings className="mr-2 h-4 w-4" />
              Account Settings
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start text-destructive hover:text-destructive"
              size="lg"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}