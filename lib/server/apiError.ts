import { NextResponse } from 'next/server';

export function apiError(status: number, msg: string, requestId?: string) {
  return NextResponse.json({ error: msg, requestId }, { status });
}


