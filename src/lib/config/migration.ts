/**
 * Config Migration Framework
 *
 * Implements migration pattern for schema evolution.
 * Migrations array indexed by version, transforms config to next version.
 *
 * Key pattern from PITFALLS.md:
 * - migrations[0] transforms v0 -> v1
 * - migrations[1] transforms v1 -> v2
 * - Loop until config.version reaches CONFIG_VERSION
 */

import { CONFIG_VERSION, DEFAULT_CONFIG, getConfigVersion } from './version.js';

/**
 * Migration function type.
 *
 * Takes a config object and returns the migrated config.
 * Each migration increments version by 1.
 */
export type MigrationFunction = (config: unknown) => unknown;

/**
 * Array of migration functions indexed by version.
 *
 * migrations[0] transforms v0 -> v1
 * migrations[1] transforms v1 -> v2
 * etc.
 *
 * Each migration must:
 * - Preserve all existing data
 * - Add/increment version field
 * - Return new config object (not mutate original)
 */
const migrations: MigrationFunction[] = [
  // v0 -> v1: Add version field
  // This handles configs created before versioning was added
  (config: unknown): unknown => {
    const configObj = config as Record<string, unknown>;
    return {
      ...configObj,
      version: 1,
    };
  },
];

/**
 * Migrate config to current version.
 *
 * Applies all necessary migrations to bring config up to CONFIG_VERSION.
 * Handles missing version (assumes v0), preserves existing data.
 *
 * @param config - Config object to migrate
 * @returns Migrated config at current version, or DEFAULT_CONFIG for invalid input
 */
export function migrateConfig(rawConfig: unknown): unknown {
  // Handle invalid inputs
  if (rawConfig === null || rawConfig === undefined) {
    return DEFAULT_CONFIG;
  }

  if (typeof rawConfig !== 'object' || Array.isArray(rawConfig)) {
    return DEFAULT_CONFIG;
  }

  // Get current version (0 if missing)
  const initialVersion = getConfigVersion(rawConfig);
  let currentVersion = initialVersion;

  // If already at current version, return unchanged
  if (currentVersion >= CONFIG_VERSION) {
    return rawConfig;
  }

  // Apply migrations sequentially
  let migratedConfig: Record<string, unknown> = rawConfig as Record<string, unknown>;

  while (currentVersion < CONFIG_VERSION) {
    // Get migration for current version
    const migration = migrations[currentVersion];

    if (!migration) {
      // Missing migration - should not happen
      // Return current state to preserve data
      console.error(
        `Missing migration for version ${currentVersion}. Config preserved at version ${currentVersion}.`
      );
      return migratedConfig;
    }

    try {
      // Apply migration
      migratedConfig = migration(migratedConfig) as Record<string, unknown>;

      // Update version tracking
      const prevVersion = currentVersion;
      currentVersion = getConfigVersion(migratedConfig);

      // Verify migration incremented version
      if (currentVersion <= prevVersion) {
        console.error(
          `Migration ${prevVersion} did not increment version. Breaking to prevent infinite loop.`
        );
        return migratedConfig;
      }
    } catch (error) {
      // Migration failed - preserve original config
      console.error(`Migration ${currentVersion} failed:`, error);
      return rawConfig;
    }
  }

  return migratedConfig;
}

/**
 * Get migrations array for inspection/testing.
 *
 * @returns Array of migration functions
 */
export function getMigrations(): MigrationFunction[] {
  return [...migrations]; // Return copy to prevent modification
}