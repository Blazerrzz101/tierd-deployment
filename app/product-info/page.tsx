import { Suspense } from "react"
import { MainLayout } from "@/components/home/main-layout"
import { ProductInfoContent } from "./product-info-content"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { Database } from "@/lib/supabase/database.types"

export const dynamic = 'force-dynamic'

export default async function ProductInfoPage() {
  const supabase = createServerComponentClient<Database>({ cookies })
  
  const { data: products } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <MainLayout>
      <Suspense fallback={<div>Loading...</div>}>
        <ProductInfoContent initialProducts={products || []} />
      </Suspense>
    </MainLayout>
  )
}