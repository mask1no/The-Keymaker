import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromCookies } from './session';
import { rateLimit } from './rateLimit';

type Handler = (request: NextRequest, context: { userPubkey: string }) => Promise<Response>;

interface Options {
  rateLimit?: {
    cap?: number;
    refillPerSec?: number;
  };
}

export function withSessionAndLimit(handler: Handler, options: Options = {}) {
  return async (request: NextRequest) => {
    const session = getSessionFromCookies();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sub: userPubkey } = session;

    const cap = options.rateLimit?.cap ?? 30;
    const refillPerSec = options.rateLimit?.refillPerSec ?? 10;

    if (!rateLimit(`session:${userPubkey}`, cap, refillPerSec)) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    try {
      return await handler(request, { userPubkey });
    } catch (error) {
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  };
}
