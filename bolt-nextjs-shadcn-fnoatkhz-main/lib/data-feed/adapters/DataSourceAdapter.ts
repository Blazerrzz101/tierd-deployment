"use client"

import { DataSource, ProductUpdate } from '../types'

export class DataSourceAdapter {
  private source: DataSource
  private retryCount: number = 0
  private readonly MAX_RETRIES = 3

  constructor(source: DataSource) {
    this.source = source
  }

  async fetchUpdates(): Promise<ProductUpdate[]> {
    try {
      const response = await this.makeRequest()
      this.retryCount = 0
      return this.transformResponse(response)
    } catch (error) {
      if (this.retryCount < this.MAX_RETRIES) {
        this.retryCount++
        await this.delay(1000 * this.retryCount)
        return this.fetchUpdates()
      }
      throw error
    }
  }

  private async makeRequest(): Promise<any> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json'
    }

    if (this.source.apiKey) {
      headers['Authorization'] = `Bearer ${this.source.apiKey}`
    }

    const response = await fetch(`${this.source.baseUrl}/products`, {
      headers
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    return response.json()
  }

  private transformResponse(data: any): ProductUpdate[] {
    // Transform source-specific response format to ProductUpdate
    return data.map((item: any) => ({
      id: item.id || item.productId,
      name: item.name || item.productName,
      price: Number(item.price),
      stock: Number(item.stock || item.inventory || 0),
      specs: this.transformSpecs(item.specifications || item.specs || {}),
      lastUpdated: Date.now(),
      source: this.source.id
    }))
  }

  private transformSpecs(sourceSpecs: Record<string, any>): Record<string, string> {
    const specs: Record<string, string> = {}
    for (const [key, value] of Object.entries(sourceSpecs)) {
      specs[key] = String(value)
    }
    return specs
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}