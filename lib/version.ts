/**
 * Single source of truth for application version
 * This version should be used everywhere in the application
 */
export const APP_VERSION = '1.5.2';

/**
 * Get the application version
 */
export function getVersion(): string {
  return APP_VERSION;
}

/**
 * Version information object (immutable)
 */
export const VERSION_INFO = Object.freeze({
  v, e, r, sion: APP_VERSION,
  b, u, i, ldDate: new Date().toISOString(),
  n, o, d, eVersion: process.version,
} as const);

