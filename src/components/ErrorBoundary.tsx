import Link from 'next/link'
import { Component, ErrorInfo, ReactNode } from 'react'

type Props = {
  children: ReactNode
}

type State = {
  hasError: boolean
}

// Top-level React error boundary. Catches render-time errors in the component
// tree so a single broken page does not crash the whole app with a white screen.
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error('ErrorBoundary caught:', error, info.componentStack)
  }

  handleReset = () => {
    this.setState({ hasError: false })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center" style={{ height: '100vh' }}>
          <div className="px-10">
            <span className="mb-3 inline-block font-semibold text-primary-700">Error</span>
            <h1 className="mb-3 text-5xl font-semibold tracking-tight text-gray-900">Oops! Something happens...</h1>
            <p className="mb-6 max-w-2xl text-lg text-gray-600">
              Please Try Again Later... after 10 - 15 minutes. We&apos;re doing software update or some internal errors
              happened
            </p>
            <div className="mt-12 flex items-center gap-3 ">
              <Link href="/dashboard" onClick={this.handleReset}>
                <span className="inline-block rounded-lg bg-primary-700 px-5 py-3 font-medium text-white">
                  Take me home
                </span>
              </Link>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
