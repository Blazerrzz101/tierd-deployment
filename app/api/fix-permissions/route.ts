import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST() {
  try {
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      }
    )

    // Enable RLS on products table
    const { error: rlsError } = await supabase.rpc("execute_sql", {
      sql: "ALTER TABLE products ENABLE ROW LEVEL SECURITY;"
    })

    if (rlsError) {
      console.error("Failed to enable RLS:", rlsError)
      return NextResponse.json(
        { error: "Failed to enable RLS" },
        { status: 500 }
      )
    }

    // Drop existing policy if it exists
    await supabase.rpc("execute_sql", {
      sql: "DROP POLICY IF EXISTS public_read_access ON products;"
    })

    // Create policy for public read access
    const { error: policyError } = await supabase.rpc("execute_sql", {
      sql: "CREATE POLICY public_read_access ON products FOR SELECT TO public USING (true);"
    })

    if (policyError) {
      console.error("Failed to create policy:", policyError)
      return NextResponse.json(
        { error: "Failed to create policy" },
        { status: 500 }
      )
    }

    // Grant permissions to public role
    const { error: grantError } = await supabase.rpc("execute_sql", {
      sql: "GRANT SELECT ON products TO anon, authenticated;"
    })

    if (grantError) {
      console.error("Failed to grant permissions:", grantError)
      return NextResponse.json(
        { error: "Failed to grant permissions" },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error fixing permissions:", error)
    return NextResponse.json(
      { error: "Failed to fix permissions" },
      { status: 500 }
    )
  }
} 