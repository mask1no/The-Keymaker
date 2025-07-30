import { Component, ReactNode } from 'react';
import { toast } from 'react-hot-toast';
import * as Sentry from '@sentry/nextjs';
interface Props { children: ReactNode }
interface State { hasError: boolean; error?: Error | null }
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };
  static getDerivedStateFromError(error: Error) { return { hasError: true, error }; }
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    Sentry.captureException(error, { extra: { componentStack: errorInfo.componentStack } });
    toast.error(`Error: ${error.message}`);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="text-red-500 p-4">
          <h2>Internal Server Error</h2>
          <p>{this.state.error?.message || 'An unexpected error occurred.'}</p>
        </div>
      );
    }
    return this.props.children;
  }
} 