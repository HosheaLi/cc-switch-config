/**
 * XDG Base Directory Implementation
 *
 * Provides cross-platform XDG-compliant directory paths using env-paths.
 *
 * Platform-specific paths:
 * - macOS: ~/Library/Application Support/cc-config-switch
 * - Linux: ~/.config/cc-config-switch
 * - Windows: %APPDATA%/cc-config-switch
 */

import envPaths from 'env-paths';

// Singleton instance of env-paths for our application
const paths = envPaths('cc-config-switch', { suffix: '' });

/**
 * Get the platform-specific configuration directory.
 * XDG_CONFIG_HOME equivalent.
 */
export function getConfigDir(): string {
  return paths.config;
}

/**
 * Get the platform-specific data directory.
 * XDG_DATA_HOME equivalent.
 */
export function getDataDir(): string {
  return paths.data;
}

/**
 * Get the platform-specific cache directory.
 * XDG_CACHE_HOME equivalent.
 */
export function getCacheDir(): string {
  return paths.cache;
}