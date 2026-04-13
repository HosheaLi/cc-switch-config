/**
 * Template Store
 *
 * Manages user-defined API provider templates stored in templates.json.
 * Per DATA-02: TemplateStore provides CRUD operations for templates.
 *
 * Key features:
 * - Lazy loading (load on first access)
 * - Schema validation before save
 * - Backup before modifications
 * - Automatic timestamp management
 * - In-memory cache for performance
 */

import path from 'path';
import { z } from 'zod';
import { readJSON, writeJSON, exists } from '../file-system/json.js';
import { createBackup } from '../file-system/backup.js';
import { getConfigDir } from '../paths/xdg.js';
import { TemplateConfigSchema, TemplateStoreSchema } from '../types/provider.js';
import type { TemplateConfig, TemplateStore as TemplateStoreType } from '../types/provider.js';
import { ValidationError } from '../types/validation.js';

/**
 * TemplateStore data structure.
 * Matches TemplateStoreSchema for type safety.
 */
export interface TemplateStoreData {
  version?: number;
  templates: Record<string, TemplateConfig>;
}

/**
 * TemplateStore class for managing API provider templates.
 *
 * Provides CRUD operations with:
 * - Validation against TemplateConfigSchema
 * - Backup before modifications
 * - Automatic timestamp management (createdAt/updatedAt)
 * - Lazy loading for performance
 * - Persistence to templates.json
 *
 * Usage:
 * ```typescript
 * const store = new TemplateStore();
 * await store.set('my-template', templateConfig);
 * const template = await store.get('my-template');
 * ```
 */
export class TemplateStore {
  /**
   * Path to the templates.json file.
   * Default: getConfigDir()/templates.json
   */
  private filePath: string;

  /**
   * In-memory cache of template data.
   * Null until first load (lazy loading pattern).
   */
  private data: TemplateStoreData | null = null;

  /**
   * Create a new TemplateStore instance.
   *
   * @param customFilePath - Optional custom file path for testing
   *                         If not provided, uses getConfigDir()/templates.json
   */
  constructor(customFilePath?: string) {
    this.filePath = customFilePath ?? path.join(getConfigDir(), 'templates.json');
  }

  /**
   * Load template data from file (lazy loading).
   *
   * - Returns cached data if already loaded
   * - Creates default empty store if file doesn't exist
   * - Validates loaded data against TemplateStoreSchema
   *
   * @returns TemplateStoreData with version and templates
   * @throws ValidationError if stored data is invalid
   */
  private async load(): Promise<TemplateStoreData> {
    // Return cached data if available
    if (this.data !== null) {
      return this.data;
    }

    // Load from file or create default
    const raw = await readJSON<TemplateStoreData>(this.filePath);

    if (raw === null) {
      // File doesn't exist - create default empty store
      this.data = {
        version: 1,
        templates: {},
      };
      return this.data;
    }

    // Validate loaded data
    const result = TemplateStoreSchema.safeParse(raw);

    if (!result.success) {
      // Collect all validation issues
      const issues = result.error.issues;
      const message = `Invalid template store data in ${this.filePath}`;
      throw new ValidationError(message, issues);
    }

    this.data = result.data;
    return this.data;
  }

  /**
   * Save template data to file.
   *
   * - Updates in-memory cache
   * - Uses atomic write pattern (write-rename)
   * - Preserves file permissions
   *
   * @param data - Data to save
   */
  private async save(data: TemplateStoreData): Promise<void> {
    await writeJSON(this.filePath, data);
    this.data = data; // Update cache
  }

  /**
   * Get all templates.
   *
   * @returns Record of template name to TemplateConfig
   */
  async getAll(): Promise<Record<string, TemplateConfig>> {
    const data = await this.load();
    return data.templates;
  }

  /**
   * Get a template by name.
   *
   * @param name - Template name to look up
   * @returns TemplateConfig if found, null if not exists
   */
  async get(name: string): Promise<TemplateConfig | null> {
    const templates = await this.getAll();
    return templates[name] ?? null;
  }

  /**
   * Create or update a template.
   *
   * - Validates template against TemplateConfigSchema
   * - Throws ValidationError for invalid templates
   * - Creates backup before modification (if file exists)
   * - Manages createdAt/updatedAt timestamps
   *
   * @param name - Template name (key in store)
   * @param template - Template configuration to save
   * @throws ValidationError if template fails validation
   */
  async set(name: string, template: TemplateConfig): Promise<void> {
    // Validate template
    const result = TemplateConfigSchema.safeParse(template);

    if (!result.success) {
      const issues = result.error.issues;
      const message = `Invalid template configuration for "${name}"`;
      throw new ValidationError(message, issues);
    }

    const validatedTemplate = result.data;

    // Load current data
    const data = await this.load();

    // Check if this is an update (template already exists)
    const isUpdate = data.templates[name] !== undefined;

    // Create backup before modification (only if file exists)
    const fileExists = await exists(this.filePath);
    if (fileExists) {
      await createBackup(this.filePath);
    }

    // Manage timestamps
    const now = new Date().toISOString();

    if (isUpdate) {
      // Update: preserve createdAt, set updatedAt
      validatedTemplate.createdAt = data.templates[name]?.createdAt ?? now;
      validatedTemplate.updatedAt = now;
    } else {
      // Create: set createdAt and updatedAt
      validatedTemplate.createdAt = now;
      validatedTemplate.updatedAt = now;
    }

    // Update data
    data.templates[name] = validatedTemplate;

    // Save to file
    await this.save(data);
  }

  /**
   * Delete a template by name.
   *
   * - Returns false if template doesn't exist
   * - Creates backup before deletion
   * - Returns true if successfully deleted
   *
   * @param name - Template name to delete
   * @returns true if deleted, false if not found
   */
  async delete(name: string): Promise<boolean> {
    const data = await this.load();

    // Check if template exists
    if (data.templates[name] === undefined) {
      return false;
    }

    // Create backup before deletion
    const fileExists = await exists(this.filePath);
    if (fileExists) {
      await createBackup(this.filePath);
    }

    // Remove template
    delete data.templates[name];

    // Save updated data
    await this.save(data);

    return true;
  }

  /**
   * List all template names.
   *
   * @returns Array of template names (keys in store)
   */
  async list(): Promise<string[]> {
    const templates = await this.getAll();
    return Object.keys(templates);
  }
}