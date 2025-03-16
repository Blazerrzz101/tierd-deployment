"use client"

import { MainLayout } from "@/components/home/main-layout"
import { ProductPage } from "@/components/products/product-page"
import { products } from "@/lib/data"
import { notFound } from "next/navigation"

export default function HyperXCloudAlphaPage() {
  const product = products.find(p => p.id === "hyperx-cloud-alpha")
  if (!product) return notFound()

  return (
    <MainLayout>
      <ProductPage product={product} />
    </MainLayout>
  )
}