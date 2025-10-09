'use client';

import React from 'react';
import { Button } from '@/components/UI/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/UI/Card';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>;
}

export class GlobalErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Global Error Boundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });

    // Log error to external service in production
    if (process.env.NODE_ENV === 'production') {
      // TODO: Send to error tracking service (Sentry, etc.)
      console.error('Production error:', { error: error.message, stack: error.stack });
    }
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent error={this.state.error!} resetError={this.resetError} />;
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-zinc-950">
          <Card className="max-w-md w-full bg-zinc-900/50 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-red-400">Something went wrong</CardTitle>
              <CardDescription className="text-zinc-400">
                An unexpected error occurred. Please try refreshing the page.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="p-3 bg-zinc-800 rounded-lg">
                  <p className="text-sm text-red-300 font-mono">
                    {this.state.error.message}
                  </p>
                  {this.state.error.stack && (
                    <details className="mt-2">
                      <summary className="text-xs text-zinc-400 cursor-pointer">
                        Stack trace
                      </summary>
                      <pre className="text-xs text-zinc-500 mt-1 whitespace-pre-wrap">
                        {this.state.error.stack}
                      </pre>
                    </details>
                  )}
                </div>
              )}
              <div className="flex gap-2">
                <Button 
                  onClick={this.resetError}
                  variant="outline"
                  className="flex-1"
                >
                  Try Again
                </Button>
                <Button 
                  onClick={() => window.location.reload()}
                  className="flex-1 bg-zinc-800 hover:bg-zinc-700"
                >
                  Refresh Page
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook for functional components to handle errors
export function useErrorHandler() {
  return (error: Error, errorInfo?: React.ErrorInfo) => {
    console.error('Error caught by useErrorHandler:', error, errorInfo);
    
    // In production, send to error tracking service
    if (process.env.NODE_ENV === 'production') {
      // TODO: Send to error tracking service
      console.error('Production error:', { error: error.message, stack: error.stack });
    }
  };
}
