'use client';

import { DatabaseError, DatabaseErrorType } from '@/lib/supabase/client';
import { useEffect } from 'react';

interface Props {
  error: Error;
  reset: () => void;
}

export function ErrorBoundary({ error, reset }: Props) {
  useEffect(() => {
    // Log errors to your error reporting service
    console.error('Error caught by boundary:', error);
  }, [error]);

  // Handle specific database errors
  if (error instanceof DatabaseError) {
    switch (error.type) {
      case DatabaseErrorType.CONNECTION:
        return (
          <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center">
            <h2 className="text-2xl font-bold text-red-600 mb-4">Connection Error</h2>
            <p className="text-gray-600 mb-6">
              We're having trouble connecting to our servers. Please check your internet connection and try again.
            </p>
            <button
              onClick={reset}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        );

      case DatabaseErrorType.AUTHENTICATION:
        return (
          <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center">
            <h2 className="text-2xl font-bold text-red-600 mb-4">Authentication Error</h2>
            <p className="text-gray-600 mb-6">
              Your session may have expired. Please refresh the page and try again.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Refresh Page
            </button>
          </div>
        );

      case DatabaseErrorType.NOT_FOUND:
        return (
          <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Not Found</h2>
            <p className="text-gray-600 mb-6">
              We couldn't find what you're looking for. The item may have been removed or doesn't exist.
            </p>
            <a
              href="/"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Return Home
            </a>
          </div>
        );

      default:
        return (
          <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center">
            <h2 className="text-2xl font-bold text-red-600 mb-4">Something Went Wrong</h2>
            <p className="text-gray-600 mb-6">
              We encountered an unexpected error. Our team has been notified.
            </p>
            <button
              onClick={reset}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        );
    }
  }

  // Handle generic errors
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center">
      <h2 className="text-2xl font-bold text-red-600 mb-4">Unexpected Error</h2>
      <p className="text-gray-600 mb-6">
        Something went wrong. Please try again later.
      </p>
      <button
        onClick={reset}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
      >
        Try Again
      </button>
    </div>
  );
} 