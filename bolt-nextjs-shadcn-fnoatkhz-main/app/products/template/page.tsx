"use client"

import { MainLayout } from "@/components/home/main-layout"
import { ProductTemplate } from "@/components/products/product-template"
import { products } from "@/lib/data"
import { notFound } from "next/navigation"

interface ProductPageProps {
  params: { id: string }
}

export default function ProductPage({ params }: ProductPageProps) {
  const product = products.find(p => p.id === params.id)
  if (!product) return notFound()

  return (
    <MainLayout>
      <ProductTemplate product={product} />
    </MainLayout>
  )
}