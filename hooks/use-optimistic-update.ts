"use client"

import { useState, useCallback } from "react"

interface OptimisticUpdateOptions<T> {
  onSuccess?: (data: T) => void
  onError?: (error: Error) => void
  rollbackOnError?: boolean
}

export function useOptimisticUpdate<T>(
  updateFn: (data: T) => Promise<any>,
  options: OptimisticUpdateOptions<T> = {}
) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const execute = useCallback(
    async (data: T, optimisticData?: T) => {
      setIsLoading(true)
      setError(null)

      try {
        // If optimistic data is provided, call onSuccess immediately
        if (optimisticData && options.onSuccess) {
          options.onSuccess(optimisticData)
        }

        // Perform the actual update
        const result = await updateFn(data)

        // Call onSuccess with the real data
        if (options.onSuccess) {
          options.onSuccess(result)
        }

        return result
      } catch (err) {
        const error = err instanceof Error ? err : new Error('An error occurred')
        setError(error)

        // If rollback is enabled and optimistic data was used, trigger error handler
        if (options.rollbackOnError && optimisticData && options.onError) {
          options.onError(error)
        }

        throw error
      } finally {
        setIsLoading(false)
      }
    },
    [updateFn, options]
  )

  return {
    execute,
    isLoading,
    error,
    reset: () => setError(null)
  }
} 