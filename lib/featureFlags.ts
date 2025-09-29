/**
 * Feature Flags for The Keymaker
 * Control experimental or legacy features
 */

export const FEATURE_FLAGS = {
  // Legacy code paths (deprecated, kept for backward compatibility)
  LEGACY_ENABLED: process.env.LEGACY_ENABLED === 'true', // Default: false
  
  // New features
  SIWS_AUTH_ENABLED: process.env.SIWS_AUTH_ENABLED !== 'false', // Default: true
  PHANTOM_AUTO_CONNECT: process.env.PHANTOM_AUTO_CONNECT !== 'false', // Default: true
  
  // Safety features
  DRY_RUN_DEFAULT: process.env.DRY_RUN !== 'false', // Default: true (safe mode)
  REQUIRE_ARMING: process.env.REQUIRE_ARMING !== 'false', // Default: true
  
  // Engine modes
  RPC_FANOUT_ENABLED: true,
  JITO_BUNDLE_ENABLED: true,
} as const;

export type FeatureFlag = keyof typeof FEATURE_FLAGS;

/**
 * Check if a feature is enabled
 */
export function isFeatureEnabled(flag: FeatureFlag): boolean {
  return FEATURE_FLAGS[flag];
}

/**
 * Guard legacy code paths
 */
export function assertLegacyDisabled(): void {
  if (FEATURE_FLAGS.LEGACY_ENABLED) {
    console.warn('⚠️ LEGACY code paths are enabled. This is not recommended for production.');
  }
}

/**
 * Get all feature flags for debugging
 */
export function getFeatureFlags(): Record<string, boolean> {
  return { ...FEATURE_FLAGS };
}