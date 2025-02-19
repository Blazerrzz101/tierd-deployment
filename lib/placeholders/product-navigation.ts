"use client"

import { supabase } from '@/lib/supabase/client'
import { Database } from '@/lib/supabase/database.types'

interface ProductRanking {
  id: string
  name: string
  url_slug: string
  rank: number
}

export interface NavigationState {
  currentProduct: string
  previousProduct?: string
  nextProduct?: string
  category: string
}

export class NavigationManager {
  static async getAdjacentProducts(currentId: string, category: string): Promise<{
    previous?: string
    next?: string
  }> {
    const { data: products } = await supabase
      .from('product_rankings')
      .select('id, name, url_slug, rank')
      .eq('category', category)
      .order('rank', { ascending: true });

    if (!products || products.length === 0) {
      return {};
    }

    const currentIndex = products.findIndex((p: ProductRanking) => p.id === currentId);
    if (currentIndex === -1) return {};

    return {
      previous: currentIndex > 0 ? products[currentIndex - 1].url_slug : undefined,
      next: currentIndex < products.length - 1 ? products[currentIndex + 1].url_slug : undefined
    };
  }

  static getNavigationPath(productId: string): string[] {
    return [
      '/',
      '/products',
      `/products/${productId}`
    ];
  }
}