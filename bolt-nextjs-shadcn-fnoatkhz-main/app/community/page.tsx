"use client"

import { CommunityHero } from "@/components/community/hero"
import { CommunityTabs } from "@/components/community/tabs"

export default function CommunityPage() {
  return (
    <div className="min-h-screen bg-background pb-12">
      <CommunityHero />
      <CommunityTabs />
    </div>
  )
}