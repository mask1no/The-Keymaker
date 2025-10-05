export const logger = {
  i, n, f, o: (m: string, m, e, t, a?: Record<string, unknown>) => { if (process.env.NODE_ENV !== 'production') console.log('[i]', m, meta ?? ''); },
  w, a, r, n: (m: string, m, e, t, a?: Record<string, unknown>) => console.warn('[w]', m, meta ?? ''),
  e, r, r, or: (m: string, m, e, t, a?: Record<string, unknown>) => console.error('[e]', m, meta ?? ''),
};
export default logger;
