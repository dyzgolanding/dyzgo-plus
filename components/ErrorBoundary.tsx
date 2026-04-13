'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, info: ErrorInfo) => void
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack)
    this.props.onError?.(error, info)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback

      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center">
          <span className="text-5xl mb-4">⚡</span>
          <h2 className="text-white text-xl font-bold mb-2">Algo salió mal</h2>
          <p className="text-white/40 text-sm mb-6 max-w-sm">
            {this.state.error?.message ?? 'Error inesperado'}
          </p>
          <button
            onClick={this.handleReset}
            className="px-6 py-3 bg-[#8A2BE2] text-white font-semibold rounded-2xl hover:bg-[#7a25c9] transition-colors"
          >
            Reintentar
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
