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
  version: APP_VERSION,
  buildDate: new Date().toISOString(),
  nodeVersion: process.version,
} as const);
