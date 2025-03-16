"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ForumSection } from "./sections/forum"
import { ReviewsSection } from "./sections/reviews"
import { EventsSection } from "./sections/events"
import { TutorialsSection } from "./sections/tutorials"

export function CommunityTabs() {
  const [activeTab, setActiveTab] = useState("forum")

  return (
    <div className="container py-8">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full justify-start">
          <TabsTrigger value="forum">Forums</TabsTrigger>
          <TabsTrigger value="reviews">Reviews</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
          <TabsTrigger value="tutorials">Tutorials</TabsTrigger>
        </TabsList>

        <TabsContent value="forum" className="mt-6">
          <ForumSection />
        </TabsContent>

        <TabsContent value="reviews" className="mt-6">
          <ReviewsSection />
        </TabsContent>

        <TabsContent value="events" className="mt-6">
          <EventsSection />
        </TabsContent>

        <TabsContent value="tutorials" className="mt-6">
          <TutorialsSection />
        </TabsContent>
      </Tabs>
    </div>
  )
}