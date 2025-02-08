"use client"

import { MainLayout } from "@/components/home/main-layout"

export default function CommunityLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <MainLayout>
      {children}
    </MainLayout>
  )
}