import { Product } from "@/types/product";
import { v4 as uuidv4 } from 'uuid';
import { generateAdditionalMonitors } from "./product-categories/monitors";
import { generateAdditionalMice } from "./product-categories/mice";
import { generateAdditionalKeyboards } from "./product-categories/keyboards";
import { generateAdditionalHeadsets } from "./product-categories/headsets";

/**
 * Expands the product database with additional products
 * @param baseProducts The base product array to expand upon
 * @returns An expanded array of products
 */
export function expandProductDatabase(baseProducts: Product[]): Product[] {
  // Create a copy of the base products to avoid modifying the original
  const products = [...baseProducts];
  
  // Add additional products
  const additionalMonitors = generateAdditionalMonitors();
  const additionalMice = generateAdditionalMice();
  const additionalKeyboards = generateAdditionalKeyboards();
  const additionalHeadsets = generateAdditionalHeadsets();
  
  // Combine all products
  return [
    ...products,
    ...additionalMonitors,
    ...additionalMice,
    ...additionalKeyboards,
    ...additionalHeadsets
  ];
}

/**
 * Generate a random number of reviews between min and max
 */
export function generateRandomReviewCount(min: number = 10, max: number = 500): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Generate a random rating between 3.5 and 5.0
 */
export function generateRandomRating(min: number = 3.5, max: number = 5.0): number {
  return Number((Math.random() * (max - min) + min).toFixed(1));
}

/**
 * Generate a random date between Jan 2021 and now
 */
export function generateRandomCreatedDate(): string {
  const start = new Date(2021, 0, 1).getTime();
  const end = new Date().getTime();
  const randomDate = new Date(start + Math.random() * (end - start));
  return randomDate.toISOString();
}

/**
 * Generate a random updated date that comes after the created date
 */
export function generateRandomUpdatedDate(createdDate: string): string {
  const start = new Date(createdDate).getTime();
  const end = new Date().getTime();
  const randomDate = new Date(start + Math.random() * (end - start));
  return randomDate.toISOString();
} 