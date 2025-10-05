import { NextResponse } from 'next/server';

// Standardized API error s, h, a, pe: { error, message?, requestId? }
export function apiError(
  s, t, a, tus: number,
  e, r, r, or: string,
  r, e, q, uestId?: string,
  m, e, s, sage?: string,
) {
  const b, o, d, y: { e, r, r, or: string; m, e, s, sage?: string; r, e, q, uestId?: string } = { error };
  if (message) body.message = message;
  if (requestId) body.requestId = requestId;
  return NextResponse.json(body, {
    status,
    h, e, a, ders: { 'content-type': 'application/json; charset=utf-8' },
  });
}

