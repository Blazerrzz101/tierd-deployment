import { getKnownUsernames, getServerUser } from "@/lib/server/user"
import { MainLayout } from "@/components/home/main-layout"
import { ProfilePage } from "@/components/profile/profile-page"
import { notFound } from "next/navigation"

export async function generateStaticParams() {
  const usernames = await getKnownUsernames()
  return usernames.map((username) => ({
    username,
  }))
}

export default async function Page({
  params
}: {
  params: { username: string }
}) {
  const user = await getServerUser(params.username)
  
  if (!user) {
    return notFound()
  }

  return (
    <MainLayout>
      <ProfilePage user={user} />
    </MainLayout>
  )
}