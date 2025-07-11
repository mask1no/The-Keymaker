import * as Sentry from '@sentry/nextjs';
import { Component, PropsWithChildren, ErrorInfo } from 'react';
import { useToast } from '../ui/use-toast';
import { useEffect } from 'react';

function ErrorFallback({ error }: { error: Error | null }) {
  const { toast } = useToast();
  useEffect(() => {
    if (error) {
      toast({
        title: "An error occurred",
        description: error.message,
        variant: "destructive",
      });
    }
  }, [error, toast]);
  return (
    <div className="p-4 bg-red-100 text-red-800 rounded">
      <h2>Something went wrong.</h2>
      <p>{error?.message}</p>
    </div>
  );
}

class ErrorBoundary extends Component<PropsWithChildren, { hasError: boolean; error: Error | null }> {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    Sentry.captureException(error);
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} />;
    }
    return this.props.children;
  }
}

export default ErrorBoundary; 