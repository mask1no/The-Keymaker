import 'server-only';
import { NextResponse } from 'next/server';
import { getSession } from './session';
import { rateLimit } from './rateLimit';

type Handler = (request: Request, context: { userPubkey: string }) => Promise<Response>;

interface Options {
  rateLimit?: {
    cap?: number;
    refillPerSec?: number;
  };
}

export function withSessionAndLimit(handler: Handler, options: Options = {}) {
  return async (request: Request) => {
    const session = getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userPubkey } = session;

    const cap = options.rateLimit?.cap ?? 30;
    const refillPerSec = options.rateLimit?.refillPerSec ?? 10;

    if (!rateLimit(`session:${userPubkey}`, cap, refillPerSec)) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    try {
      return await handler(request, { userPubkey });
    } catch (error) {
      console.error('Handler error:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  };
}

