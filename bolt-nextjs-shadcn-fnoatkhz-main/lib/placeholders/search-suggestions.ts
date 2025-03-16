"use client"

export interface SearchSuggestion {
  type: 'product' | 'category' | 'brand'
  id: string
  text: string
  score: number
  metadata?: Record<string, any>
}

export class SearchSuggestionSystem {
  static async getSuggestions(query: string): Promise<SearchSuggestion[]> {
    // TODO: Implement search suggestions
    return []
  }

  static async getPopularSearches(): Promise<string[]> {
    // TODO: Implement popular searches
    return []
  }

  static async getRecentSearches(userId: string): Promise<string[]> {
    // TODO: Implement recent searches
    return []
  }
}