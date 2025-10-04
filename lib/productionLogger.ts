export const log = {
  info: (...a: unknown[]) => { if (process.env.NODE_ENV !== 'production') console.log('[i]', ...a); },
  warn: (...a: unknown[]) => console.warn('[w]', ...a),
  error: (...a: unknown[]) => console.error('[e]', ...a),
};
