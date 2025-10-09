'use client';

import { useState } from 'react';
import * as Sentry from '@sentry/nextjs';
import { Button } from '@/components/UI/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/UI/Card';

export default function SentryExamplePage() {
  const [errorCount, setErrorCount] = useState(0);

  const triggerTestError = () => {
    setErrorCount((prev) => prev + 1);

    // Trigger a test error that will be caught by Sentry
    try {
      // Call a function that doesn't exist
      (window as any).myUndefinedFunction();
    } catch (error) {
      // This will be automatically captured by Sentry
      console.error('Test error triggered:', error);
    }
  };

  const triggerAsyncError = async () => {
    try {
      // Simulate an async error
      await new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error('Async test error for Sentry'));
        }, 100);
      });
    } catch (error) {
      // This will be captured by Sentry
      console.error('Async error triggered:', error);
    }
  };

  const triggerManualCapture = () => {
    // Manually capture a message
    Sentry.captureMessage('Manual test message from Sentry example page', 'info');

    // Manually capture an exception
    Sentry.captureException(new Error('Manual test exception from Sentry example page'));

    alert('Manual Sentry events sent! Check your Sentry dashboard.');
  };

  const triggerUnhandledPromiseRejection = () => {
    // This will trigger an unhandled promise rejection
    Promise.reject(new Error('Unhandled promise rejection test for Sentry'));
  };

  return (
    <div className="min-h-screen bg-zinc-950 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-green-400">Sentry Integration Test Page</CardTitle>
            <CardDescription className="text-zinc-400">
              Test various error scenarios to verify Sentry is working correctly. Check your Sentry
              dashboard after triggering errors.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button onClick={triggerTestError} variant="destructive" className="w-full">
                Trigger Test Error ({errorCount})
              </Button>

              <Button onClick={triggerAsyncError} variant="destructive" className="w-full">
                Trigger Async Error
              </Button>

              <Button onClick={triggerManualCapture} variant="outline" className="w-full">
                Send Manual Events
              </Button>

              <Button
                onClick={triggerUnhandledPromiseRejection}
                variant="destructive"
                className="w-full"
              >
                Unhandled Promise Rejection
              </Button>
            </div>

            <div className="mt-6 p-4 bg-zinc-800 rounded-lg">
              <h3 className="text-sm font-medium text-zinc-300 mb-2">Test Instructions:</h3>
              <ol className="text-sm text-zinc-400 space-y-1 list-decimal list-inside">
                <li>Click any of the error buttons above</li>
                <li>Check your browser console for error messages</li>
                <li>Visit your Sentry dashboard to see the captured errors</li>
                <li>Verify that errors appear in your Sentry Issues section</li>
              </ol>
            </div>

            <div className="mt-4 p-4 bg-blue-900/20 border border-blue-800 rounded-lg">
              <h3 className="text-sm font-medium text-blue-300 mb-2">
                Sentry Configuration Status:
              </h3>
              <div className="text-sm text-blue-200 space-y-1">
                <p>✅ Client-side error tracking enabled</p>
                <p>✅ Server-side error tracking enabled</p>
                <p>✅ React error boundaries integrated</p>
                <p>✅ Performance monitoring enabled</p>
                <p>✅ Session replay enabled</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
