"use client"

import { ProfileSearch } from "@/components/search/profile-search"

export default function SearchPage() {
  return (
    <div className="container py-8">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-8 text-3xl font-bold">Search Profiles</h1>
        <ProfileSearch showAllResults />
      </div>
    </div>
  )
}