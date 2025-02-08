import { Metadata } from "next"
import { notFound } from "next/navigation"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { Database } from "@/lib/supabase/database.types"
import { products } from "@/lib/data"
import { ProductClient } from "./product-client"

interface PageProps {
  params: {
    slug: string;
  };
}

function slugToName(url_slug: string): string {
  return url_slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  // In development, use local data
  if (process.env.NODE_ENV === 'development') {
    const product = products.find(p => p.url_slug === params.slug)
    return {
      title: product ? `${product.name} | Product Details` : 'Product Details',
    }
  }

  // In production, use Supabase
  const supabase = createServerComponentClient<Database>({ cookies })

  const { data: product } = await supabase
    .from('products')
    .select('url_slug')
    .eq('url_slug', params.slug)
    .single()

  return {
    title: product?.url_slug
      ? `${slugToName(product.url_slug)} | Product Details`
      : 'Product Details',
  }
}

export default async function Page({ params }: PageProps) {
  if (!params.slug) {
    return notFound()
  }

  return <ProductClient url_slug={params.slug} />
} 