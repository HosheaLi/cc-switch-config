/**
 * ConfigRepository - Configuration File Abstraction Layer
 *
 * Encapsulates file operations for Claude settings, providing a unified interface
 * for reading, writing, and validating configuration files.
 *
 * Key features:
 * - readConfig: Load and validate config, return null for non-existent files
 * - writeConfig: Validate, backup existing, write atomically
 * - configExists: Check if config file exists
 *
 * Dependencies:
 * - readJSON/writeJSON/exists from file-system/json.js (atomic operations)
 * - createBackup from file-system/backup.js (pre-write backup)
 * - validateConfig from types/validation.js (schema validation)
 */

import { readJSON, writeJSON, exists } from '../file-system/json.js';
import { createBackup } from '../file-system/backup.js';
import { validateConfig, ValidationError } from '../types/validation.js';
import type { ClaudeSettings } from '../types/config.js';

/**
 * Read and validate a Claude settings configuration file.
 *
 * Behavior:
 * - Returns null if file doesn't exist (ENOENT handled gracefully)
 * - Validates loaded config against ClaudeSettingsSchema
 * - Throws ValidationError if config is invalid
 *
 * @param filepath - Path to the settings.json file
 * @returns Validated ClaudeSettings object, or null if file doesn't exist
 * @throws ValidationError if config fails schema validation
 */
export async function readConfig(filepath: string): Promise<ClaudeSettings | null> {
  // Read JSON from file (returns null for ENOENT)
  const data = await readJSON<ClaudeSettings>(filepath);

  if (data === null) {
    return null;
  }

  // Validate loaded config
  const result = validateConfig(data);

  if (!result.success) {
    throw result.error;
  }

  return result.data;
}

/**
 * Write a Claude settings configuration file with validation and backup.
 *
 * Behavior:
 * - Validates config before writing (throws ValidationError on invalid)
 * - Creates backup of existing file before modification
 * - Uses atomic write pattern for crash safety
 *
 * @param filepath - Path to the settings.json file
 * @param config - ClaudeSettings object to write
 * @throws ValidationError if config fails schema validation
 * @throws Error if write operation fails
 */
export async function writeConfig(filepath: string, config: ClaudeSettings): Promise<void> {
  // Validate input config first
  const result = validateConfig(config);

  if (!result.success) {
    throw result.error;
  }

  // Check if file exists to create backup
  const fileExists = await exists(filepath);

  if (fileExists) {
    // Create backup before modification
    await createBackup(filepath);
  }

  // Write atomically using write-rename pattern
  await writeJSON(filepath, result.data);
}

/**
 * Check if a configuration file exists.
 *
 * @param filepath - Path to check
 * @returns true if file exists (and is a file, not directory), false otherwise
 */
export async function configExists(filepath: string): Promise<boolean> {
  return exists(filepath);
}