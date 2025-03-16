import { ReactNode } from "react"
import { Metadata } from "next"
import { AuthLayoutClient } from "./layout.client"

export const metadata: Metadata = {
  title: {
    default: "Authentication",
    template: "%s | Tierd"
  },
  description: "Authentication pages for Tierd - your gaming gear community."
}

interface AuthLayoutProps {
  children: ReactNode
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return <AuthLayoutClient>{children}</AuthLayoutClient>
}