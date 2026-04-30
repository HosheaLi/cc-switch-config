/**
 * API Configuration Store
 *
 * Manages global API configurations stored in api-configs.json.
 * Per CFG-01: ApiConfigStore provides CRUD operations for global API configs.
 * Per SEC-03: Atomic write and backup patterns maintained from v1.0.
 *
 * Key features:
 * - Lazy loading (load on first access)
 * - Schema validation before save
 * - Backup before modifications (R2)
 * - Automatic timestamp management
 * - In-memory cache for performance
 * - Atomic write pattern (R1)
 */

import path from 'path';
import { z } from 'zod';
import { readJSON, writeJSON, exists } from '../file-system/json.js';
import { createBackup } from '../file-system/backup.js';
import { getConfigDir } from '../paths/xdg.js';
import { ApiConfigSchema } from '../types/api-config.js';
import type { ApiConfig } from '../types/api-config.js';
import { ValidationError } from '../types/validation.js';

/**
 * ApiConfigStore data structure.
 * Contains version and configs record.
 * Per D-07: File path is ~/.claude/api-configs.json (NOT cc-config-switch config dir).
 */
export interface ApiConfigStoreData {
  version?: number;
  configs: Record<string, ApiConfig>;
}

/**
 * ApiConfigStore schema for validation.
 */
const ApiConfigStoreSchema = z.object({
  version: z.number().int().optional(),
  configs: z.record(z.string(), ApiConfigSchema),
});

/**
 * ApiConfigStore class for managing global API configurations.
 *
 * Provides CRUD operations with:
 * - Validation against ApiConfigSchema
 * - Backup before modifications (R2)
 * - Automatic timestamp management (createdAt/updatedAt)
 * - Lazy loading for performance
 * - Persistence to api-configs.json
 * - Atomic write pattern (R1, SEC-03)
 *
 * Usage:
 * ```typescript
 * const store = new ApiConfigStore();
 * await store.set('my-config', apiConfig);
 * const config = await store.get('my-config');
 * ```
 */
export class ApiConfigStore {
  /**
   * Path to the api-configs.json file.
   * Per D-07: Default is ~/.claude/api-configs.json (Claude's config dir).
   */
  private filePath: string;

  /**
   * In-memory cache of config data.
   * Null until first load (lazy loading pattern).
   */
  private data: ApiConfigStoreData | null = null;

  /**
   * Create a new ApiConfigStore instance.
   *
   * @param customFilePath - Optional custom file path for testing
   *                         If not provided, uses ~/.claude/api-configs.json
   */
  constructor(customFilePath?: string) {
    // Per D-07: Store in ~/.claude/ (Claude's config directory), not cc-config-switch config dir
    this.filePath = customFilePath ?? path.join(getConfigDir(), 'api-configs.json');
  }

  /**
   * Load config data from file (lazy loading).
   *
   * - Returns cached data if already loaded
   * - Creates default empty store if file doesn't exist
   * - Validates loaded data against ApiConfigStoreSchema
   *
   * @returns ApiConfigStoreData with version and configs
   * @throws ValidationError if stored data is invalid
   */
  private async load(): Promise<ApiConfigStoreData> {
    // Return cached data if available
    if (this.data !== null) {
      return this.data;
    }

    // Load from file or create default
    const raw = await readJSON<ApiConfigStoreData>(this.filePath);

    if (raw === null) {
      // File doesn't exist - create default empty store
      this.data = {
        version: 1,
        configs: {},
      };
      return this.data;
    }

    // Validate loaded data
    const result = ApiConfigStoreSchema.safeParse(raw);

    if (!result.success) {
      // Collect all validation issues
      const issues = result.error.issues;
      const message = `Invalid API config store data in ${this.filePath}`;
      throw new ValidationError(message, issues);
    }

    this.data = result.data;
    return this.data;
  }

  /**
   * Save config data to file.
   *
   * - Updates in-memory cache
   * - Uses atomic write pattern (write-rename) - R1/SEC-03
   * - Preserves file permissions
   *
   * @param data - Data to save
   */
  private async save(data: ApiConfigStoreData): Promise<void> {
    await writeJSON(this.filePath, data);
    this.data = data; // Update cache
  }

  /**
   * Get all API configurations.
   *
   * @returns Record of config name to ApiConfig
   */
  async getAll(): Promise<Record<string, ApiConfig>> {
    const data = await this.load();
    return data.configs;
  }

  /**
   * Get an API configuration by name.
   *
   * @param name - Config name to look up
   * @returns ApiConfig if found, null if not exists
   */
  async get(name: string): Promise<ApiConfig | null> {
    const configs = await this.getAll();
    return configs[name] ?? null;
  }

  /**
   * Create or update an API configuration.
   *
   * - Validates config against ApiConfigSchema
   * - Throws ValidationError for invalid configs
   * - Creates backup before modification (if file exists) - R2
   * - Manages createdAt/updatedAt timestamps
   * - Uses atomic write pattern - R1/SEC-03
   *
   * @param name - Config name (key in store)
   * @param config - API configuration to save
   * @throws ValidationError if config fails validation
   */
  async set(name: string, config: ApiConfig): Promise<void> {
    // Validate config against ApiConfigSchema
    const result = ApiConfigSchema.safeParse(config);

    if (!result.success) {
      const issues = result.error.issues;
      const message = `Invalid API configuration for "${name}"`;
      throw new ValidationError(message, issues);
    }

    const validatedConfig = result.data;

    // Load current data
    const data = await this.load();

    // Check if this is an update (config already exists)
    const isUpdate = data.configs[name] !== undefined;

    // Create backup before modification (only if file exists) - R2
    const fileExists = await exists(this.filePath);
    if (fileExists) {
      await createBackup(this.filePath);
    }

    // Manage timestamps
    const now = new Date().toISOString();

    if (isUpdate) {
      // Update: preserve createdAt, set updatedAt
      validatedConfig.createdAt = data.configs[name]?.createdAt ?? now;
      validatedConfig.updatedAt = now;
    } else {
      // Create: set createdAt and updatedAt
      validatedConfig.createdAt = now;
      validatedConfig.updatedAt = now;
    }

    // Update data
    data.configs[name] = validatedConfig;

    // Save to file (atomic write) - R1/SEC-03
    await this.save(data);
  }

  /**
   * Delete an API configuration by name.
   *
   * - Returns false if config doesn't exist
   * - Creates backup before deletion - R2
   * - Returns true if successfully deleted
   *
   * @param name - Config name to delete
   * @returns true if deleted, false if not found
   */
  async delete(name: string): Promise<boolean> {
    const data = await this.load();

    // Check if config exists
    if (data.configs[name] === undefined) {
      return false;
    }

    // Create backup before deletion - R2
    const fileExists = await exists(this.filePath);
    if (fileExists) {
      await createBackup(this.filePath);
    }

    // Remove config
    delete data.configs[name];

    // Save updated data
    await this.save(data);

    return true;
  }

  /**
   * List all API configuration names.
   *
   * @returns Array of config names (keys in store)
   */
  async list(): Promise<string[]> {
    const configs = await this.getAll();
    return Object.keys(configs);
  }
}