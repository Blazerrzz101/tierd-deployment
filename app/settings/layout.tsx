import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Settings - Tier'd",
  description: "Manage your account settings and preferences.",
}

interface SettingsLayoutProps {
  children: React.ReactNode
}

export default function SettingsLayout({ children }: SettingsLayoutProps) {
  return (
    <div className="relative min-h-screen">
      <main className="flex-1">{children}</main>
    </div>
  )
} 