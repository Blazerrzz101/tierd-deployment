"use client"

export interface NavigationState {
  currentProduct: string
  previousProduct?: string
  nextProduct?: string
  category: string
}

export class NavigationManager {
  static getAdjacentProducts(currentId: string, category: string): Promise<{
    previous?: string
    next?: string
  }> {
    // TODO: Implement product navigation
    return Promise.resolve({})
  }

  static getNavigationPath(productId: string): string[] {
    // TODO: Implement navigation path
    return []
  }
}