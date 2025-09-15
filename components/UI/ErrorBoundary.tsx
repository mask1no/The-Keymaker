'use client'

import React, { Component, ReactNode } from 'react'
import { AlertCircle, RefreshCw, Home } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface Props {
  children: ReactNode
}
interface State {
  hasError: booleanerror?: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
    toast.error(`Error: ${error.message}`)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
    window.location.reload()
  }

  handleGoHome = () => {
    this.setState({ hasError: false, error: null })
    window.location.href = '/'
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-green-900 to-black flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-black/40 backdrop-blur-xl border border-red-500/20 rounded-xl p-8">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="w-8 h-8 text-red-500" />
              <h1 className="text-2xl font-bold text-white">
                Something went wrong
              </h1>
            </div>

            <p className="text-gray-400 mb-4">
              An unexpected error occurred. This could be due to:
            </p>

            <ul className="text-sm text-gray-500 space-y-1 mb-6">
              <li>• Network connectivity issues</li>
              <li>• Invalid configuration or missing API keys</li>
              <li>• Rate limiting or service unavailable</li>
              <li>• Incompatible browser or extensions</li>
            </ul>

            {this.state.error && (
              <div className="bg-black/50 border border-red-500/20 rounded-lg p-4 mb-6">
                <p className="text-xs font-mono text-red-400 break-all">
                  {this.state.error.message}
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <buttononClick={this.handleGoHome}
                className="flex-1 bg-black/50 hover:bg-black/70 border border-white/10 text-white py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
              >
                <Home className="w-4 h-4" />
                Go Home
              </button>
              <buttononClick={this.handleReset}
                className="flex-1 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Reload
              </button>
            </div>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
