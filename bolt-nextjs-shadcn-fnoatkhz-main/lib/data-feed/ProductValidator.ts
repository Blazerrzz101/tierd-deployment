"use client"

import { ProductUpdate } from './types'

export class ProductValidator {
  validate(update: ProductUpdate): boolean {
    return this.validateRequired(update) &&
           this.validatePricing(update) &&
           this.validateSpecs(update)
  }

  private validateRequired(update: ProductUpdate): boolean {
    return Boolean(
      update.id &&
      update.name &&
      update.source &&
      update.lastUpdated
    )
  }

  private validatePricing(update: ProductUpdate): boolean {
    return typeof update.price === 'number' && 
           update.price >= 0 &&
           Number.isFinite(update.price)
  }

  private validateSpecs(update: ProductUpdate): boolean {
    return typeof update.specs === 'object' &&
           Object.entries(update.specs).every(
             ([key, value]) => typeof key === 'string' && 
                              typeof value === 'string' &&
                              key.length > 0 &&
                              value.length > 0
           )
  }
}