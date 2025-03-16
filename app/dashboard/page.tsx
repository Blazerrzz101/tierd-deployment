"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Activity, Star, ThumbsUp, Trophy } from "lucide-react"
import { mockReviews } from "@/lib/mock-reviews"
import { products } from "@/lib/data"
import { ReviewCard } from "@/components/reviews/review-card"
import { ProductCard } from "@/components/rankings/product-card"

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState("overview")

  // Mock user stats
  const stats = [
    {
      title: "Total Votes",
      value: "156",
      icon: ThumbsUp,
      description: "Last 30 days"
    },
    {
      title: "Reviews Written",
      value: "12",
      icon: Star,
      description: "All time"
    },
    {
      title: "Achievement Points",
      value: "450",
      icon: Trophy,
      description: "Current rank: Expert"
    },
    {
      title: "Activity Score",
      value: "89",
      icon: Activity,
      description: "Very Active"
    }
  ]

  // Filter products and reviews for the current user (mock data)
  const userReviews = mockReviews.slice(0, 2)
  const votedProducts = products.slice(0, 3)

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="mt-2 text-muted-foreground">
          Track your activity and contributions
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-8">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="reviews">My Reviews</TabsTrigger>
          <TabsTrigger value="votes">My Votes</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  "Voted on Razer DeathAdder V3 Pro",
                  "Wrote a review for Logitech G Pro X",
                  "Achieved 'Prolific Reviewer' badge",
                  "Voted on SteelSeries Apex Pro"
                ].map((activity, index) => (
                  <div
                    key={index}
                    className="flex items-center space-x-2 text-sm"
                  >
                    <div className="h-2 w-2 rounded-full bg-primary" />
                    <span>{activity}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="reviews" className="space-y-6">
          {userReviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </TabsContent>
        <TabsContent value="votes" className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {votedProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </TabsContent>
      </Tabs>
    </div>
  )
}