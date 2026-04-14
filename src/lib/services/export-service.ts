/**
 * ExportService - Export/Import Configuration Service
 *
 * Handles config export and import operations with conflict detection.
 * Per D-05: Single project scope for export/import.
 * Per D-07: Interactive conflict handling with merge/overwrite/skip options.
 *
 * Key features:
 * - exportProject: Export project config to JSON payload
 * - detectConflicts: Find conflicts between imported and existing settings
 * - importProject: Import config with merge/overwrite/skip strategies
 *
 * Dependencies (constructor injected):
 * - ProjectIndex for project lookup
 * - TemplateStore for template lookup
 * - ConfigService for config read/write
 */

import path from 'path';
import fs from 'fs-extra';
import { ServiceError } from './types.js';
import { ExportPayloadSchema } from '../types/export-schema.js';
import { deepMergeConfig } from '../types/merge.js';
import { createBackup } from '../file-system/backup.js';
import type { ProjectIndex, ProjectEntry } from '../store/index.js';
import type { TemplateStore } from '../store/index.js';
import type { ConfigService } from './config-service.js';
import type { ExportPayload, ConflictField, ExportMetadata } from '../types/export-schema.js';
import type { ClaudeSettings, TemplateConfig } from '../types/index.js';

/**
 * Import strategy options.
 * Per D-07: User chooses between merge, overwrite, or skip.
 */
export type ImportStrategy = 'merge' | 'overwrite' | 'skip';

/**
 * ExportService class for managing config export/import.
 *
 * Usage:
 * ```typescript
 * const service = new ExportService(projectIndex, templateStore, configService);
 * const payload = await service.exportProject(projectId);
 * const conflicts = detectConflicts(payload.settings, existingSettings);
 * await service.importProject(payload, '/path/to/project', 'merge');
 * ```
 */
export class ExportService {
  /** Current tool version for export metadata */
  private readonly TOOL_VERSION = '0.1.0';

  /**
   * Create ExportService with injected dependencies.
   *
   * @param projectIndex - ProjectIndex for project lookup
   * @param templateStore - TemplateStore for template lookup
   * @param configService - ConfigService for config operations
   */
  constructor(
    private projectIndex: ProjectIndex,
    private templateStore: TemplateStore,
    private configService: ConfigService
  ) {}

  /**
   * Export project configuration to JSON payload.
   *
   * Per D-06: Creates ExportPayload with metadata, project ref, settings, and template.
   * Per D-05: Single project scope.
   *
   * Steps:
   * 1. Get project by ID from projectIndex
   * 2. Throw ServiceError if not found (PROJECT_NOT_FOUND)
   * 3. Read project config via configService
   * 4. Get template if project.activeConfig set
   * 5. Build ExportPayload with metadata
   *
   * @param projectId - Project UUID to export
   * @returns ExportPayload with all config data
   * @throws ServiceError with code 'PROJECT_NOT_FOUND' if project doesn't exist
   */
  async exportProject(projectId: string): Promise<ExportPayload> {
    // Get project by ID
    const project = await this.projectIndex.getById(projectId);
    if (!project) {
      throw new ServiceError(
        `Project not found: ${projectId}`,
        'PROJECT_NOT_FOUND',
        { projectId }
      );
    }

    // Read project config
    const settings = await this.configService.readProjectConfig(project.path) ?? {};

    // Get template if activeConfig is set
    let template: TemplateConfig | null = null;
    if (project.activeConfig) {
      template = await this.templateStore.get(project.activeConfig);
    }

    // Build export metadata
    const metadata: ExportMetadata = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      toolVersion: this.TOOL_VERSION,
    };

    // Build project reference
    const projectRef = {
      id: project.id,
      path: project.path,
      name: this.deriveProjectName(project.path),
    };

    // Build payload
    const payload: ExportPayload = {
      metadata,
      project: projectRef,
      settings,
      template,
    };

    return payload;
  }

  /**
   * Detect conflicts between imported and existing settings.
   *
   * Per D-07: Conflict detection before import.
   * Compares:
   * - env variables: for each key in imported.env, if existing.env[key] differs
   * - model field: if imported.model differs from existing.model
   * - mcpServers: for each server name, if config differs
   *
   * @param imported - Settings from import file
   * @param existing - Current project settings
   * @returns Array of ConflictField with key, imported value, existing value
   */
  detectConflicts(imported: ClaudeSettings, existing: ClaudeSettings): ConflictField[] {
    const conflicts: ConflictField[] = [];

    // Check env variables
    if (imported.env) {
      for (const key of Object.keys(imported.env)) {
        const importedValue = imported.env[key];
        const existingValue = existing.env?.[key];

        // Conflict if existing has the key with different value
        if (existingValue !== undefined && importedValue !== existingValue) {
          conflicts.push({
            key: `env.${key}`,
            imported: importedValue,
            existing: existingValue,
          });
        }
      }
    }

    // Check model field
    if (imported.model !== undefined && existing.model !== undefined) {
      if (imported.model !== existing.model) {
        conflicts.push({
          key: 'model',
          imported: imported.model,
          existing: existing.model,
        });
      }
    }

    // Check mcpServers
    if (imported.mcpServers) {
      for (const serverName of Object.keys(imported.mcpServers)) {
        const importedServer = imported.mcpServers[serverName];
        const existingServer = existing.mcpServers?.[serverName];

        // Conflict if existing has the server with different config
        if (existingServer !== undefined && !this.serversEqual(importedServer, existingServer)) {
          conflicts.push({
            key: `mcpServers.${serverName}`,
            imported: importedServer,
            existing: existingServer,
          });
        }
      }
    }

    // Check permissions (arrays - compare by length if both exist)
    if (imported.permissions && existing.permissions) {
      if (imported.permissions.length !== existing.permissions.length) {
        conflicts.push({
          key: 'permissions',
          imported: imported.permissions,
          existing: existing.permissions,
        });
      }
    }

    // Check hooks (arrays - compare by length if both exist)
    if (imported.hooks && existing.hooks) {
      if (imported.hooks.length !== existing.hooks.length) {
        conflicts.push({
          key: 'hooks',
          imported: imported.hooks,
          existing: existing.hooks,
        });
      }
    }

    return conflicts;
  }

  /**
   * Import configuration to target path with strategy.
   *
   * Per D-07: Import with merge/overwrite/skip options.
   * Per Safety-First: Creates backup before write.
   *
   * Steps:
   * 1. Validate payload via ExportPayloadSchema.parse
   * 2. Throw ServiceError if validation fails (IMPORT_INVALID)
   * 3. Read existing config at targetPath
   * 4. Apply strategy:
   *    - overwrite: write imported.settings directly
   *    - merge: use deepMergeConfig(existing, imported.settings)
   *    - skip: do nothing, return early
   * 5. Create backup before write
   * 6. Write merged/overwritten config
   *
   * @param payload - Raw payload (unknown type for validation)
   * @param targetPath - Target project path
   * @param strategy - Import strategy (merge, overwrite, skip)
   * @throws ServiceError with code 'IMPORT_INVALID' if payload validation fails
   */
  async importProject(
    payload: unknown,
    targetPath: string,
    strategy: ImportStrategy
  ): Promise<void> {
    // Validate payload
    const result = ExportPayloadSchema.safeParse(payload);
    if (!result.success) {
      throw new ServiceError(
        `Invalid export payload: ${result.error.message}`,
        'IMPORT_INVALID',
        { issues: result.error.issues }
      );
    }

    const validPayload = result.data;

    // Skip strategy: do nothing
    if (strategy === 'skip') {
      return;
    }

    // Read existing config
    const existing = await this.configService.readProjectConfig(targetPath) ?? {};

    // Determine final settings based on strategy
    let finalSettings: ClaudeSettings;
    if (strategy === 'overwrite') {
      finalSettings = validPayload.settings;
    } else {
      // merge strategy
      finalSettings = deepMergeConfig(existing, validPayload.settings);
    }

    // Create backup before write (Safety-First)
    const configPath = path.join(targetPath, '.claude', 'settings.json');
    if (await fs.pathExists(configPath)) {
      await createBackup(configPath);
    }

    // Write config
    await this.configService.writeProjectConfig(targetPath, finalSettings);
  }

  /**
   * Derive project name from path.
   * Uses basename of path as display name.
   *
   * @param projectPath - Full path to project
   * @returns Project name (basename)
   */
  private deriveProjectName(projectPath: string): string {
    return path.basename(projectPath);
  }

  /**
   * Compare two MCP server configs for equality.
   * Compares command, args, and env fields.
   *
   * @param a - First server config
   * @param b - Second server config
   * @returns true if configs are equal
   */
  private serversEqual(a: { command: string; args?: string[]; env?: Record<string, string> },
                       b: { command: string; args?: string[]; env?: Record<string, string> }): boolean {
    // Compare command
    if (a.command !== b.command) return false;

    // Compare args (undefined === undefined, empty !== undefined)
    const argsA = a.args ?? [];
    const argsB = b.args ?? [];
    if (argsA.length !== argsB.length) return false;
    for (let i = 0; i < argsA.length; i++) {
      if (argsA[i] !== argsB[i]) return false;
    }

    // Compare env
    const envA = a.env ?? {};
    const envB = b.env ?? {};
    const keysA = Object.keys(envA);
    const keysB = Object.keys(envB);
    if (keysA.length !== keysB.length) return false;
    for (const key of keysA) {
      if (envA[key] !== envB[key]) return false;
    }

    return true;
  }
}

/**
 * Standalone conflict detection function.
 * Can be used without full ExportService instance.
 *
 * @param imported - Settings from import file
 * @param existing - Current project settings
 * @returns Array of ConflictField
 */
export function detectConflicts(imported: ClaudeSettings, existing: ClaudeSettings): ConflictField[] {
  // Create temporary service instance with null dependencies
  // (detectConflicts doesn't need dependencies)
  const service = new ExportService(
    null as unknown as ProjectIndex,
    null as unknown as TemplateStore,
    null as unknown as ConfigService
  );
  return service.detectConflicts(imported, existing);
}