import * as Sentry from '@sentry/nextjs';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    // Trigger a test error
    const error = new Error('Test server-side error for Sentry');
    error.name = 'SentryTestError';
    
    // Add some context
    Sentry.setContext('test_context', {
      endpoint: '/api/sentry/test-error',
      method: 'GET',
      timestamp: new Date().toISOString(),
      userAgent: request.headers.get('user-agent'),
    });

    // Add some tags
    Sentry.setTag('test_type', 'server_error');
    Sentry.setTag('environment', process.env.NODE_ENV || 'development');

    // Capture the exception
    Sentry.captureException(error);

    return NextResponse.json({
      success: true,
      message: 'Test error sent to Sentry',
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Trigger an error with custom data
    const error = new Error(`Custom test error: ${body.message || 'No message provided'}`);
    error.name = 'CustomSentryTestError';
    
    // Add custom context from request body
    Sentry.setContext('custom_test', {
      ...body,
      endpoint: '/api/sentry/test-error',
      method: 'POST',
      timestamp: new Date().toISOString(),
    });

    // Capture the exception
    Sentry.captureException(error);

    return NextResponse.json({
      success: true,
      message: 'Custom test error sent to Sentry',
      error: error.message,
      receivedData: body,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
