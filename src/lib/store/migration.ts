/**
 * Data Migration Utility - templates.json → api-configs.json
 *
 * Migrates legacy TemplateConfig data from templates.json to ApiConfig format
 * in api-configs.json. Handles field mapping, validation, backup, and error reporting.
 *
 * Field mapping (PATTERNS.md Pattern A):
 * - TemplateConfig.name → ApiConfig.name
 * - TemplateConfig.provider.name → ApiConfig.modelName (NOT ApiConfig.name!)
 * - TemplateConfig.provider.baseUrl → ApiConfig.baseUrl
 * - TemplateConfig.provider.env.ANTHROPIC_API_KEY → ApiConfig.apiKey
 * - New: ApiConfig.mode = 'unified'
 *
 * Safety:
 * - Creates backup of templates.json before migration
 * - Validates each converted config with Zod (ApiConfigSchema)
 * - Reports errors without crashing on individual failures
 * - Idempotent: safe to run multiple times
 */

import fs from 'fs-extra';
import path from 'path';
import { ApiConfigStore } from './api-config.js';
import { getConfigDir } from '../paths/xdg.js';
import { ApiConfigSchema } from '../types/api-config.js';
import type { ApiConfig } from '../types/api-config.js';
import { exists } from '../file-system/json.js';
import { createBackup } from '../file-system/backup.js';

/**
 * Legacy TemplateConfig type (simplified, only for parsing old data).
 * Source files have been deleted in Plan 02; this is a local redefinition
 * for migration purposes only.
 */
interface LegacyTemplateConfig {
  name: string;
  description?: string;
  provider: {
    name: string;        // Model name → ApiConfig.modelName
    baseUrl: string;
    authType: string;
    env: { ANTHROPIC_API_KEY: string };
  };
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Legacy templates.json file structure.
 */
interface LegacyTemplatesFile {
  version: number;
  templates: Record<string, LegacyTemplateConfig>;
}

/**
 * Migration result summary.
 */
export interface MigrationResult {
  /** Number of configs successfully migrated */
  migrated: number;
  /** Error messages for failed migrations */
  errors: string[];
  /** Path to backup file, or null if no backup was needed */
  backupPath: string | null;
}

/**
 * Migrate templates.json to api-configs.json.
 *
 * Steps:
 * 1. Check if templates.json exists in config directory
 * 2. If not found, return early with migrated: 0
 * 3. Create backup of templates.json
 * 4. Read and parse templates.json
 * 5. For each TemplateConfig, convert to ApiConfig with field mapping
 * 6. Validate each converted config with ApiConfigSchema (Zod strict)
 * 7. Write valid configs to api-configs.json via ApiConfigStore
 * 8. Rename templates.json to templates.json.migrated
 * 9. Return migration statistics
 *
 * @param customTemplatesPath - Optional custom path for templates.json (for testing)
 * @param customApiConfigsPath - Optional custom path for api-configs.json (for testing)
 * @returns MigrationResult with counts, errors, and backup path
 */
export async function migrateTemplatesToApiConfigs(
  customTemplatesPath?: string,
  customApiConfigsPath?: string
): Promise<MigrationResult> {
  const configDir = getConfigDir();
  const templatesPath = customTemplatesPath ?? path.join(configDir, 'templates.json');

  // 1. Check if templates.json exists
  const templatesExists = await exists(templatesPath);
  if (!templatesExists) {
    return { migrated: 0, errors: [], backupPath: null };
  }

  // 2. Create backup
  let backupPath: string | null = null;
  try {
    backupPath = await createBackup(templatesPath);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      migrated: 0,
      errors: [`Failed to create backup: ${message}`],
      backupPath: null,
    };
  }

  // 3. Read and parse templates.json
  let templatesFile: LegacyTemplatesFile;
  try {
    const content = await fs.readFile(templatesPath, 'utf8');
    templatesFile = JSON.parse(content) as LegacyTemplatesFile;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      migrated: 0,
      errors: [`Failed to read/parse templates.json: ${message}`],
      backupPath,
    };
  }

  // 4. Convert each template to ApiConfig
  const result: MigrationResult = {
    migrated: 0,
    errors: [],
    backupPath,
  };

  const apiConfigStore = new ApiConfigStore(customApiConfigsPath);
  const templates = templatesFile.templates ?? {};

  for (const [name, template] of Object.entries(templates)) {
    try {
      // Field mapping: TemplateConfig → ApiConfig
      const apiConfig: ApiConfig = {
        name: template.name,
        apiKey: template.provider?.env?.ANTHROPIC_API_KEY ?? '',
        baseUrl: template.provider?.baseUrl ?? '',
        mode: 'unified',
        modelName: template.provider?.name ?? '',  // provider.name → modelName
      };

      // Validate with Zod strict schema
      const parseResult = ApiConfigSchema.safeParse(apiConfig);
      if (!parseResult.success) {
        const issues = parseResult.error.issues
          .map(i => `${i.path.join('.')}: ${i.message}`)
          .join('; ');
        result.errors.push(`Template "${name}" validation failed: ${issues}`);
        continue;
      }

      // Write to ApiConfigStore
      await apiConfigStore.set(name, parseResult.data);
      result.migrated++;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      result.errors.push(`Template "${name}" conversion failed: ${message}`);
    }
  }

  // 5. Rename templates.json to templates.json.migrated
  try {
    const migratedPath = `${templatesPath}.migrated`;
    await fs.rename(templatesPath, migratedPath);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    result.errors.push(`Failed to rename templates.json: ${message}`);
  }

  return result;
}
