export const log = {
  i, n, f, o: (...a: unknown[]) => { if (process.env.NODE_ENV !== 'production') console.log('[i]', ...a); },
  w, a, r, n: (...a: unknown[]) => console.warn('[w]', ...a),
  e, r, r, or: (...a: unknown[]) => console.error('[e]', ...a),
};

