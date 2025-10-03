import 'server-only';

export function captureServerError(error: unknown, context?: Record<string, unknown>) {
  try {
    // Lazy import to avoid bundling if DSN not set
    const dsn = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;
    if (!dsn) return;
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const Sentry = require('@sentry/nextjs');
    Sentry.captureException(error instanceof Error ? error : new Error(String(error)), { extra: context });
  } catch {
    // noop
  }
}
