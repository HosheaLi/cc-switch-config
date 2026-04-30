/**
 * ApiService - API Configuration Management Service
 *
 * Encapsulates API config CRUD operations and config-to-project application.
 * Per CFG-01: API configuration management with full CRUD.
 * Per CFG-02: Precise env/model field replacement, preserves permissions/hooks/mcpServers.
 *
 * Key features:
 * - Constructor injection with ApiConfigStore (D-01)
 * - ServiceError on failures (D-02)
 * - replaceEnvModel for precise field replacement (CFG-02/D-13)
 */

import path from 'path';
import fs from 'fs-extra';
import type { ApiConfig } from '../types/api-config.js';
import type { ClaudeSettings } from '../types/config.js';
import { replaceEnvModel } from '../types/replacement.js';
import { ServiceError } from './types.js';
import type { ApiConfigStore } from '../store/api-config.js';
import { getProjectConfigPath } from '../paths/claude.js';

/**
 * ApiService class for API configuration management.
 *
 * Provides CRUD operations for API configs and config application:
 * - createConfig: Save new API config via ApiConfigStore
 * - getConfig: Retrieve config by name
 * - updateConfig: Modify existing config
 * - deleteConfig: Remove config
 * - listConfigs: Get all config names
 * - getAllConfigs: Get all configs as record
 * - applyConfig: Apply API config to project (CFG-02/D-13)
 *
 * Usage:
 * ```typescript
 * const service = new ApiService(apiConfigStore, readConfig, writeConfig);
 * await service.createConfig('my-config', apiConfig);
 * await service.applyConfig('/path/to/project', 'my-config');
 * ```
 */
export class ApiService {
  /**
   * Create an ApiService instance.
   *
   * @param apiConfigStore - ApiConfigStore instance for config persistence
   * @param readConfigFn - Function to read project config
   * @param writeConfigFn - Function to write project config
   */
  constructor(
    private apiConfigStore: ApiConfigStore,
    private readConfigFn: (filepath: string) => Promise<ClaudeSettings | null>,
    private writeConfigFn: (filepath: string, config: ClaudeSettings) => Promise<void>
  ) {}

  /**
   * Create a new API configuration.
   *
   * Validates and saves config via ApiConfigStore.
   * Per D-02: Throws ServiceError on failure.
   *
   * @param name - Config name (key in store)
   * @param config - API configuration to save
   * @throws ServiceError with code CONFIG_ALREADY_EXISTS if name already used
   * @throws ServiceError with code CONFIG_CREATE_FAILED on save failure
   */
  async createConfig(name: string, config: ApiConfig): Promise<void> {
    const existing = await this.apiConfigStore.get(name);
    if (existing) {
      throw new ServiceError(
        `API configuration "${name}" already exists`,
        'CONFIG_ALREADY_EXISTS'
      );
    }

    try {
      await this.apiConfigStore.set(name, config);
    } catch (error) {
      if (error instanceof Error) {
        throw new ServiceError(
          `Failed to create API configuration "${name}": ${error.message}`,
          'CONFIG_CREATE_FAILED'
        );
      }
      throw error;
    }
  }

  /**
   * Get an API configuration by name.
   *
   * @param name - Config name to look up
   * @returns ApiConfig if found, null if not exists
   */
  async getConfig(name: string): Promise<ApiConfig | null> {
    return this.apiConfigStore.get(name);
  }

  /**
   * Update an existing API configuration.
   *
   * Per D-02: Throws ServiceError if config not found.
   *
   * @param name - Config name to update
   * @param config - New API configuration
   * @throws ServiceError with code CONFIG_NOT_FOUND if config doesn't exist
   * @throws ServiceError with code CONFIG_UPDATE_FAILED on save failure
   */
  async updateConfig(name: string, config: ApiConfig): Promise<void> {
    const existing = await this.apiConfigStore.get(name);
    if (!existing) {
      throw new ServiceError(
        `API configuration "${name}" not found`,
        'CONFIG_NOT_FOUND'
      );
    }

    try {
      await this.apiConfigStore.set(name, config);
    } catch (error) {
      if (error instanceof Error) {
        throw new ServiceError(
          `Failed to update API configuration "${name}": ${error.message}`,
          'CONFIG_UPDATE_FAILED'
        );
      }
      throw error;
    }
  }

  /**
   * Delete an API configuration by name.
   *
   * Per D-02: Throws ServiceError if config not found.
   *
   * @param name - Config name to delete
   * @returns true if deleted
   * @throws ServiceError with code CONFIG_NOT_FOUND if config doesn't exist
   */
  async deleteConfig(name: string): Promise<boolean> {
    const result = await this.apiConfigStore.delete(name);
    if (!result) {
      throw new ServiceError(
        `API configuration "${name}" not found`,
        'CONFIG_NOT_FOUND'
      );
    }
    return result;
  }

  /**
   * List all API configuration names.
   *
   * @returns Array of config names
   */
  async listConfigs(): Promise<string[]> {
    return this.apiConfigStore.list();
  }

  /**
   * Get all API configurations as a record.
   *
   * @returns Record of config name to ApiConfig
   */
  async getAllConfigs(): Promise<Record<string, ApiConfig>> {
    return this.apiConfigStore.getAll();
  }

  /**
   * Apply an API configuration to a project's settings.
   *
   * Per CFG-02: Precise env/model field replacement.
   * Per D-13: Complete replacement, not merge.
   *
   * Behavior:
   * - Retrieves config from store
   * - Loads existing project config (or empty if not exists)
   * - Calls replaceEnvModel for precise env/model replacement
   * - Preserves all non-env/model fields (permissions, hooks, mcpServers)
   * - Creates .claude directory if needed
   *
   * @param projectPath - Project directory path
   * @param configName - API config name to apply
   * @throws ServiceError with code CONFIG_NOT_FOUND if config doesn't exist
   * @throws ServiceError with code CONFIG_APPLY_FAILED on write failure
   */
  async applyConfig(projectPath: string, configName: string): Promise<void> {
    // Get API config from store
    const apiConfig = await this.apiConfigStore.get(configName);
    if (!apiConfig) {
      throw new ServiceError(
        `API configuration "${configName}" not found`,
        'CONFIG_NOT_FOUND'
      );
    }

    const configPath = getProjectConfigPath(projectPath);

    // Ensure .claude directory exists
    await fs.ensureDir(path.dirname(configPath));

    // Load existing config (or empty object if not exists)
    const existing = await this.readConfigFn(configPath) ?? {};

    // Per CFG-02/D-13: Precise env/model replacement (not deep merge)
    const merged = replaceEnvModel(existing, apiConfig);

    try {
      await this.writeConfigFn(configPath, merged);
    } catch (error) {
      if (error instanceof Error) {
        throw new ServiceError(
          `Failed to apply API configuration "${configName}" to ${projectPath}: ${error.message}`,
          'CONFIG_APPLY_FAILED'
        );
      }
      throw error;
    }
  }
}