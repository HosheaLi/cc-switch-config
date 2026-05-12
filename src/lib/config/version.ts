/**
 * Config Versioning
 *
 * Implements version field and helpers for config schema evolution.
 * Version field exists from day one to support future migrations.
 *
 * Key safety guarantees:
 * - All configs have version field identifying schema version
 * - Older configs automatically migrate to current version
 * - Version field exists from day one
 */

import type { ClaudeSettings } from '../types/index.js';

/**
 * Current config schema version.
 *
 * Start at 1 (v0 is implicit for configs without version field).
 * Increment when making schema changes that require migration.
 */
export const CONFIG_VERSION = 1;

/**
 * Default config structure.
 *
 * Complete default config matching ClaudeSettings schema.
 * Empty values for optional fields.
 */
export const DEFAULT_CONFIG: ClaudeSettings = {
  version: CONFIG_VERSION,
  env: {},
  permissions: [],
  hooks: [],
};

/**
 * Check if config has a version field.
 *
 * @param config - Config object to check
 * @returns true if config is an object with 'version' property
 */
export function hasVersionField(config: unknown): boolean {
  if (config === null || config === undefined) {
    return false;
  }

  if (typeof config !== 'object') {
    return false;
  }

  // Arrays are objects but shouldn't have version field
  if (Array.isArray(config)) {
    return false;
  }

  return 'version' in config;
}

/**
 * Get config version or 0 if missing.
 *
 * Missing version means oldest version (v0).
 * This allows migration from configs created before versioning was added.
 *
 * @param config - Config object to check
 * @returns Version number (0 if missing or invalid)
 */
export function getConfigVersion(config: unknown): number {
  if (!hasVersionField(config)) {
    return 0;
  }

  const configObj = config as Record<string, unknown>;
  const version = configObj.version;

  // Validate version is a number
  if (typeof version !== 'number' || !Number.isInteger(version)) {
    return 0;
  }

  return version;
}