"use client"

import { DataSource, ProductUpdate, FeedConfig } from './types'
import { ProductValidator } from './ProductValidator'
import { DataSourceAdapter } from './adapters/DataSourceAdapter'

export class FeedManager {
  private static instance: FeedManager
  private config: FeedConfig
  private adapters: Map<string, DataSourceAdapter> = new Map()
  private updateQueue: ProductUpdate[] = []

  private constructor(config: FeedConfig) {
    this.config = config
    this.initializeAdapters()
    this.startUpdateCycle()
  }

  static getInstance(config: FeedConfig): FeedManager {
    if (!FeedManager.instance) {
      FeedManager.instance = new FeedManager(config)
    }
    return FeedManager.instance
  }

  async fetchLatestData(): Promise<ProductUpdate[]> {
    const updates: ProductUpdate[] = []

    for (const source of this.config.sources) {
      const adapter = this.adapters.get(source.id)
      if (!adapter) continue

      try {
        const sourceUpdates = await adapter.fetchUpdates()
        updates.push(...sourceUpdates)
      } catch (error) {
        console.error(`Error fetching from ${source.name}:`, error)
      }
    }

    return this.processUpdates(updates)
  }

  private async processUpdates(updates: ProductUpdate[]): Promise<ProductUpdate[]> {
    const validator = new ProductValidator()
    const validUpdates = updates.filter(update => validator.validate(update))
    
    this.updateQueue.push(...validUpdates)
    return validUpdates
  }

  private initializeAdapters(): void {
    this.config.sources.forEach(source => {
      const adapter = new DataSourceAdapter(source)
      this.adapters.set(source.id, adapter)
    })
  }

  private startUpdateCycle(): void {
    setInterval(async () => {
      await this.fetchLatestData()
    }, this.config.updateInterval)
  }
}