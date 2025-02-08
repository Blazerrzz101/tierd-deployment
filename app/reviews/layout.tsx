import { MainLayout } from "@/components/home/main-layout"

export default function ReviewsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <MainLayout>{children}</MainLayout>
}