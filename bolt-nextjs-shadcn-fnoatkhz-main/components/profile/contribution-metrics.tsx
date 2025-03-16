"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { ThumbsUp, Star, Trophy, Activity } from "lucide-react"

export function ContributionMetrics() {
  const metrics = [
    {
      title: "Total Votes",
      value: "156",
      icon: ThumbsUp,
      description: "Last 30 days",
      progress: 78
    },
    {
      title: "Reviews Written",
      value: "12",
      icon: Star,
      description: "All time",
      progress: 60
    },
    {
      title: "Achievement Points",
      value: "450",
      icon: Trophy,
      description: "Current rank: Expert",
      progress: 90
    },
    {
      title: "Activity Score",
      value: "89",
      icon: Activity,
      description: "Very Active",
      progress: 89
    }
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {metrics.map((metric, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {metric.title}
            </CardTitle>
            <metric.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metric.value}</div>
            <Progress value={metric.progress} className="mt-2" />
            <p className="mt-2 text-xs text-muted-foreground">
              {metric.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}