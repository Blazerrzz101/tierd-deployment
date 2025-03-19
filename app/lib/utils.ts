import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Combines multiple class values into a single className string,
 * with support for conditional classes and tailwind class merging.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
} 