import { Component, type ErrorInfo, type ReactNode } from 'react'
import './ErrorBoundary.css'

interface ErrorBoundaryProps {
  readonly children: ReactNode
  readonly fallback?: ReactNode
}

interface ErrorBoundaryState {
  readonly hasError: boolean
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  public static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true }
  }

  public override componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('[RANDSUM] Component error:', error, info)
  }

  public override render(): ReactNode {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="randsum-error-boundary">
            Something went wrong with the RANDSUM roller.
          </div>
        )
      )
    }
    return this.props.children
  }
}
