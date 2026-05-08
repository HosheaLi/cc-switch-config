/**
 * ConfigService - Configuration Management Service
 *
 * Encapsulates config file operations for Profile CRUD (F1).
 * Per D-01: Services as classes + constructor injection.
 * Per D-02: Services throw Error, caller handles.
 *
 * Key features:
 * - readProjectConfig: Load project config from path
 * - writeProjectConfig: Write config with validation and backup
 * - applyApiConfig: Apply ApiConfig with precise env/model replacement (CFG-02)
 *
 * Dependencies (constructor injected):
 * - readConfig function (from ConfigRepository)
 * - writeConfig function (from ConfigRepository)
 */

import path from 'path';
import type { ClaudeSettings } from '../types/config.js';
import type { ApiConfig } from '../types/api-config.js';
import { replaceEnvModel } from '../types/replacement.js';
import { ServiceError } from './types.js';
import { ValidationError } from '../types/validation.js';
import { getProjectConfigPath } from '../paths/claude.js';

/**
 * ConfigService provides configuration management operations.
 *
 * Uses constructor injection for repository functions (D-01),
 * enabling testing with mock repositories.
 *
 * @example
 * ```typescript
 * import { readConfig, writeConfig } from '../store/config.js';
 * const service = new ConfigService(readConfig, writeConfig);
 *
 * const config = await service.readProjectConfig('/path/to/project');
 * await service.writeProjectConfig('/path/to/project', { model: 'claude-3' });
 * ```
 */
export class ConfigService {
  /**
   * Create a ConfigService with injected repository functions.
   *
   * @param readConfigFn - Function to read config from filepath
   * @param writeConfigFn - Function to write config to filepath
   */
  constructor(
    private readConfigFn: (filepath: string) => Promise<ClaudeSettings | null>,
    private writeConfigFn: (filepath: string, config: ClaudeSettings) => Promise<void>
  ) {}

  /**
   * Read project config from .claude/settings.json.
   *
   * Per D-02: Throws ServiceError on failure.
   * Returns null if config doesn't exist.
   *
   * @param projectPath - Root path of the project
   * @returns ClaudeSettings object or null if not found
   * @throws ServiceError with code 'CONFIG_READ_FAILED' on read failure
   */
  async readProjectConfig(projectPath: string): Promise<ClaudeSettings | null> {
    const configPath = getProjectConfigPath(projectPath);
    try {
      return await this.readConfigFn(configPath);
    } catch (error) {
      if (error instanceof Error) {
        throw new ServiceError(
          `Failed to read config at ${configPath}: ${error.message}`,
          'CONFIG_READ_FAILED'
        );
      }
      throw error;
    }
  }

  /**
   * Write project config to .claude/settings.json.
   *
   * Validates config before writing (via writeConfigFn).
   * Creates backup if file exists.
   * Per D-02: Throws ServiceError on failure.
   *
   * @param projectPath - Root path of the project
   * @param config - ClaudeSettings to write
   * @throws ValidationError if config is invalid (from writeConfigFn)
   * @throws ServiceError with code 'CONFIG_WRITE_FAILED' on write failure
   */
  async writeProjectConfig(projectPath: string, config: ClaudeSettings): Promise<void> {
    const configPath = getProjectConfigPath(projectPath);
    try {
      await this.writeConfigFn(configPath, config);
    } catch (error) {
      // Per D-02: Services throw Error, but let ValidationError pass through
      // (validation errors should not be wrapped - caller needs the details)
      if (error instanceof ValidationError) {
        throw error;
      }
      if (error instanceof Error) {
        throw new ServiceError(
          `Failed to write config at ${configPath}: ${error.message}`,
          'CONFIG_WRITE_FAILED'
        );
      }
      throw error;
    }
  }

  /**
   * Apply ApiConfig to project configuration.
   *
   * Per CFG-02: Precise field replacement - only env/model changed.
   * Per D-13: Complete replacement of env/model (not merge).
   * Preserves permissions, hooks, mcpServers.
   *
   * @param projectPath - Root path of the project
   * @param apiConfig - ApiConfig to apply (takes config directly, not name)
   * @throws ServiceError with code 'CONFIG_WRITE_FAILED' on write failure
   */
  async applyApiConfig(projectPath: string, apiConfig: ApiConfig): Promise<void> {
    // Get existing config (null treated as empty for new configs)
    const existing = await this.readProjectConfig(projectPath) ?? {};

    // Per CFG-02/D-13: Precise env/model replacement (not deep merge)
    const merged = replaceEnvModel(existing, apiConfig);

    // Write config (validation and backup handled by writeProjectConfig)
    await this.writeProjectConfig(projectPath, merged);
  }

}