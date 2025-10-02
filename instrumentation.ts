export async function register() {
  // Skip all instrumentation in development
  if (process.env.NODE_ENV === 'development') {
    console.log('[Instrumentation] Skipped in development');
    return;
  }
  
  // Production instrumentation
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    try {
      // Validate environment early
      try {
        const { validateEnvAtStartup } = await import('./lib/server/env');
        validateEnvAtStartup();
      } catch (e) {
        console.warn('[Instrumentation] Env validation issue:', e);
        throw e; // fail early in production if critical
      }
      
      await import('./lib/server/httpAgent');
    } catch (e) {
      console.warn('[Instrumentation] Failed to load httpAgent:', e);
    }
  }
}
