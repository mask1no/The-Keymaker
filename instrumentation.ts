export async function register() {
  // Skip all instrumentation in development
  if (process.env.NODE_ENV === 'development') {
    console.log('[Instrumentation] Skipped in development');
    return;
  }
  
  // Production instrumentation
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    try {
      await import('./lib/server/httpAgent');
    } catch (e) {
      console.warn('[Instrumentation] Failed to load httpAgent:', e);
    }
  }
}
