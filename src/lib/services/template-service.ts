/**
 * TemplateService - Template Management Service
 *
 * Encapsulates template CRUD operations and template-to-project application.
 * Per F7: Template management with full CRUD.
 * Per F1: Apply template to project config.
 *
 * Key features:
 * - Constructor injection with TemplateStore (D-01)
 * - ServiceError on failures (D-02)
 * - Deep merge preserves non-template fields (D-03)
 */

import path from 'path';
import fs from 'fs-extra';
import type { TemplateConfig } from '../types/provider.js';
import type { ClaudeSettings } from '../types/config.js';
import { deepMergeConfig } from '../types/merge.js';
import { ServiceError } from './types.js';
import type { TemplateStore } from '../store/template.js';

/**
 * TemplateService class for template management.
 *
 * Provides CRUD operations for templates and template application:
 * - createTemplate: Save new template via TemplateStore
 * - getTemplate: Retrieve template by name
 * - updateTemplate: Modify existing template
 * - deleteTemplate: Remove template
 * - listTemplates: Get all template names
 * - getAllTemplates: Get all templates as record
 * - applyTemplate: Apply template to project config (D-03 deep merge)
 *
 * Usage:
 * ```typescript
 * const service = new TemplateService(templateStore, readConfig, writeConfig);
 * await service.createTemplate('my-template', templateConfig);
 * await service.applyTemplate('/path/to/project', 'my-template');
 * ```
 */
export class TemplateService {
  /**
   * Create a TemplateService instance.
   *
   * @param templateStore - TemplateStore instance for template persistence
   * @param readConfigFn - Function to read project config
   * @param writeConfigFn - Function to write project config
   */
  constructor(
    private templateStore: TemplateStore,
    private readConfigFn: (filepath: string) => Promise<ClaudeSettings | null>,
    private writeConfigFn: (filepath: string, config: ClaudeSettings) => Promise<void>
  ) {}

  /**
   * Create a new template.
   *
   * Validates and saves template via TemplateStore.
   * Per D-02: Throws ServiceError on failure.
   *
   * @param name - Template name (key in store)
   * @param config - Template configuration
   * @throws ServiceError with code TEMPLATE_CREATE_FAILED on failure
   */
  async createTemplate(name: string, config: TemplateConfig): Promise<void> {
    try {
      await this.templateStore.set(name, config);
    } catch (error) {
      if (error instanceof Error) {
        throw new ServiceError(
          `Failed to create template "${name}": ${error.message}`,
          'TEMPLATE_CREATE_FAILED'
        );
      }
      throw error;
    }
  }

  /**
   * Get a template by name.
   *
   * @param name - Template name to look up
   * @returns TemplateConfig if found, null if not exists
   */
  async getTemplate(name: string): Promise<TemplateConfig | null> {
    return this.templateStore.get(name);
  }

  /**
   * Update an existing template.
   *
   * Per D-02: Throws ServiceError if template not found.
   *
   * @param name - Template name to update
   * @param config - New template configuration
   * @throws ServiceError with code TEMPLATE_NOT_FOUND if template doesn't exist
   * @throws ServiceError with code TEMPLATE_UPDATE_FAILED on write failure
   */
  async updateTemplate(name: string, config: TemplateConfig): Promise<void> {
    const existing = await this.templateStore.get(name);
    if (!existing) {
      throw new ServiceError(
        `Template "${name}" not found`,
        'TEMPLATE_NOT_FOUND'
      );
    }

    try {
      await this.templateStore.set(name, config);
    } catch (error) {
      if (error instanceof Error) {
        throw new ServiceError(
          `Failed to update template "${name}": ${error.message}`,
          'TEMPLATE_UPDATE_FAILED'
        );
      }
      throw error;
    }
  }

  /**
   * Delete a template by name.
   *
   * Per D-02: Throws ServiceError if template not found.
   *
   * @param name - Template name to delete
   * @returns true if deleted
   * @throws ServiceError with code TEMPLATE_NOT_FOUND if template doesn't exist
   */
  async deleteTemplate(name: string): Promise<boolean> {
    const result = await this.templateStore.delete(name);
    if (!result) {
      throw new ServiceError(
        `Template "${name}" not found`,
        'TEMPLATE_NOT_FOUND'
      );
    }
    return result;
  }

  /**
   * List all template names.
   *
   * @returns Array of template names
   */
  async listTemplates(): Promise<string[]> {
    return this.templateStore.list();
  }

  /**
   * Get all templates as a record.
   *
   * @returns Record of template name to TemplateConfig
   */
  async getAllTemplates(): Promise<Record<string, TemplateConfig>> {
    return this.templateStore.getAll();
  }

  /**
   * Apply a template to a project's configuration.
   *
   * Per F1: Apply template to project config.
   * Per D-03: Deep merge preserves non-template fields.
   *
   * Behavior:
   * - Retrieves template from store
   * - Loads existing project config (or empty if not exists)
   * - Deep merges template env settings with existing config
   * - Preserves all non-template fields (mcpServers, permissions, hooks, etc.)
   * - Creates .claude directory if needed
   *
   * @param projectPath - Project directory path
   * @param templateName - Template name to apply
   * @throws ServiceError with code TEMPLATE_NOT_FOUND if template doesn't exist
   * @throws ServiceError with code TEMPLATE_APPLY_FAILED on write failure
   */
  async applyTemplate(projectPath: string, templateName: string): Promise<void> {
    // Per D-03: Get template for merge
    const template = await this.templateStore.get(templateName);
    if (!template) {
      throw new ServiceError(
        `Template "${templateName}" not found`,
        'TEMPLATE_NOT_FOUND'
      );
    }

    const configPath = this.getConfigPath(projectPath);

    // Ensure .claude directory exists
    await fs.ensureDir(path.dirname(configPath));

    // Load existing config (or empty object if not exists)
    const existing = await this.readConfigFn(configPath) ?? {};

    // Convert template provider config to ClaudeSettings partial
    // Template's env variables override existing env
    const templateSettings: Partial<ClaudeSettings> = {
      env: template.provider.env,
    };

    // Per D-03: Deep merge - template overrides, preserves others
    const merged = deepMergeConfig(existing, templateSettings);

    try {
      await this.writeConfigFn(configPath, merged);
    } catch (error) {
      if (error instanceof Error) {
        throw new ServiceError(
          `Failed to apply template "${templateName}" to ${projectPath}: ${error.message}`,
          'TEMPLATE_APPLY_FAILED'
        );
      }
      throw error;
    }
  }

  /**
   * Get the config file path for a project.
   *
   * @param projectPath - Project directory path
   * @returns Path to .claude/settings.json
   */
  private getConfigPath(projectPath: string): string {
    return path.join(projectPath, '.claude', 'settings.json');
  }
}