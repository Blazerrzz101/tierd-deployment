"use client"

import { MainLayout } from "@/components/home/main-layout"
import { ProductPage } from "@/components/products/product-page"
import { products } from "@/lib/data"
import { notFound } from "next/navigation"

export default function ZowieEC2Page() {
  const product = products.find(p => p.id === "zowie-ec2")
  if (!product) return notFound()

  return (
    <MainLayout>
      <ProductPage product={product} />
    </MainLayout>
  )
}