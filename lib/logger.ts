export const logger = {
  info: (m: string, meta?: Record<string, unknown>) => { if (process.env.NODE_ENV !== 'production') console.log('[i]', m, meta ?? ''); },
  warn: (m: string, meta?: Record<string, unknown>) => console.warn('[w]', m, meta ?? ''),
  error: (m: string, meta?: Record<string, unknown>) => console.error('[e]', m, meta ?? ''),
};
export default logger;