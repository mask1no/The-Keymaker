import { NextResponse } from 'next/server';

// Standardized API error shape: { error, message?, requestId? }
export function apiError(status: number, error: string, requestId?: string, message?: string) {
  const body: { error: string; message?: string; requestId?: string } = { error };
  if (message) body.message = message;
  if (requestId) body.requestId = requestId;
  return NextResponse.json(body, {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
}
