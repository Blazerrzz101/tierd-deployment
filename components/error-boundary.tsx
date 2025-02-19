"use client"

import { Component, ErrorInfo, ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo)
  }

  public render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="flex min-h-[400px] w-full items-center justify-center">
            <div className="text-center">
              <AlertTriangle className="mx-auto h-12 w-12 text-yellow-500" />
              <h2 className="mt-4 text-lg font-semibold">Something went wrong</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {this.state.error?.message || "An unexpected error occurred"}
              </p>
              <Button
                className="mt-4"
                onClick={() => this.setState({ hasError: false })}
              >
                Try again
              </Button>
            </div>
          </div>
        )
      )
    }

    return this.props.children
  }
} 