import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { SettingsContent } from "./settings-content"

export const metadata = {
  title: "Settings | Bolt",
  description: "Manage your account settings and preferences",
}

export default async function SettingsPage() {
  const supabase = createServerComponentClient({ cookies })
  
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/sign-in")
  }

  // Fetch user preferences
  const { data: preferences } = await supabase
    .from('user_preferences')
    .select('*')
    .eq('user_id', session.user.id)
    .single()

  return (
    <SettingsContent
      user={session.user}
      preferences={preferences || undefined}
    />
  )
}