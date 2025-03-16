"use client";

import { Component, ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class SupabaseErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error) {
    console.error('Supabase Error:', error)
  }

  render() {
    if (this.state.hasError) {
      const errorMessage = this.state.error?.message || 'An unknown error occurred'
      const isConnectionError = errorMessage.includes('connection') || errorMessage.includes('network')
      const isAuthError = errorMessage.includes('auth') || errorMessage.includes('JWT')
      const isPermissionError = errorMessage.includes('permission') || errorMessage.includes('access')

      return (
        <Alert variant="destructive" className="my-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            <div className="space-y-2">
              <p>{errorMessage}</p>
              
              {isConnectionError && (
                <p className="text-sm">
                  This appears to be a connection issue. Please check your internet connection
                  and try again.
                </p>
              )}

              {isAuthError && (
                <p className="text-sm">
                  There seems to be an authentication issue. Try signing out and back in.
                </p>
              )}

              {isPermissionError && (
                <p className="text-sm">
                  You don't have permission to access this resource. Please sign in with
                  the correct account.
                </p>
              )}

              <div className="flex space-x-2 mt-4">
                <Button
                  variant="outline"
                  onClick={() => window.location.reload()}
                >
                  Retry
                </Button>
                <Button
                  variant="outline"
                  onClick={() => window.location.href = '/auth/sign-in'}
                >
                  Sign In
                </Button>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )
    }

    return this.props.children
  }
} 