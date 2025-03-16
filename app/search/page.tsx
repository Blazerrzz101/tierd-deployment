"use client"

import { MainLayout } from "@/components/home/main-layout"
import { ProfileSearch } from "@/components/search/profile-search"

export default function SearchPage() {
  return (
    <MainLayout>
      <div className="py-8">
        <div className="mx-auto max-w-2xl">
          <h1 className="mb-8 text-3xl font-bold">Search Profiles</h1>
          <ProfileSearch showAllResults />
        </div>
      </div>
    </MainLayout>
  )
}