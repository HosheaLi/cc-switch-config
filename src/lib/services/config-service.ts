/**
 * ConfigService - Configuration Management Service
 *
 * Encapsulates config file operations for Profile CRUD (F1).
 * Per D-01: Services as classes + constructor injection.
 * Per D-02: Services throw Error, caller handles.
 * Per D-03: Template uses deep merge.
 *
 * Key features:
 * - readProjectConfig: Load project config from path
 * - writeProjectConfig: Write config with validation and backup
 * - mergeTemplateWithConfig: Deep merge template with existing config
 * - applyTemplate: Apply template to project (merge + write)
 *
 * Dependencies (constructor injected):
 * - readConfig function (from ConfigRepository)
 * - writeConfig function (from ConfigRepository)
 */

import path from 'path';
import type { ClaudeSettings } from '../types/config.js';
import type { TemplateConfig } from '../types/provider.js';
import { deepMergeConfig } from '../types/merge.js';
import { ServiceError } from './types.js';
import { ValidationError } from '../types/validation.js';

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
    const configPath = this.getConfigPath(projectPath);
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
    const configPath = this.getConfigPath(projectPath);
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
   * Merge template configuration with existing project config.
   *
   * Per D-03: Uses deep merge for template application.
   * Template provider config overrides existing config fields.
   *
   * @param projectPath - Root path of the project
   * @param template - TemplateConfig to merge
   * @returns Merged ClaudeSettings
   */
  async mergeTemplateWithConfig(
    projectPath: string,
    template: TemplateConfig
  ): Promise<ClaudeSettings> {
    // Get existing config (null treated as empty)
    const existing = await this.readProjectConfig(projectPath) ?? {};

    // Deep merge template provider settings with existing
    // Template provider fields: env, baseUrl, headers -> merge into ClaudeSettings
    const templateSettings: Partial<ClaudeSettings> = {
      env: template.provider.env,
      // Other provider fields would map to appropriate ClaudeSettings fields
      // For now, we focus on env which is the primary use case
    };

    return deepMergeConfig(existing, templateSettings);
  }

  /**
   * Apply template to project configuration.
   *
   * Per F1: Apply template (merge + write) for Profile CRUD.
   * Per D-03: Uses deep merge before writing.
   *
   * @param projectPath - Root path of the project
   * @param template - TemplateConfig to apply
   * @throws ServiceError on write failure
   */
  async applyTemplate(projectPath: string, template: TemplateConfig): Promise<void> {
    const merged = await this.mergeTemplateWithConfig(projectPath, template);
    await this.writeProjectConfig(projectPath, merged);
  }

  /**
   * Get config filepath for a project.
   *
   * Config path follows Claude Code convention:
   * <projectPath>/.claude/settings.json
   *
   * @param projectPath - Root path of the project
   * @returns Full path to settings.json
   */
  private getConfigPath(projectPath: string): string {
    return path.join(projectPath, '.claude', 'settings.json');
  }
}