"use client"

export interface Breadcrumb {
  label: string
  href: string
  current: boolean
}

export class BreadcrumbManager {
  static generateBreadcrumbs(path: string): Breadcrumb[] {
    // TODO: Implement breadcrumb generation
    return []
  }

  static getProductBreadcrumbs(productId: string): Promise<Breadcrumb[]> {
    // TODO: Implement product-specific breadcrumbs
    return Promise.resolve([])
  }
}