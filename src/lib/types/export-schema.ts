/**
 * Export/Import Schema Definitions
 *
 * Zod schemas for config export/import functionality.
 * Per D-06: Single JSON file format with settings + template + metadata.
 *
 * Key components:
 * - ExportMetadataSchema: Metadata about the export (version, timestamp, tool)
 * - ProjectRefSchema: Lightweight project reference (id, path, name)
 * - ExportPayloadSchema: Complete export payload with all components
 * - ConflictField: Interface for conflict detection (used in service, not schema)
 */

import { z } from 'zod';
import { ClaudeSettingsSchema } from './config.js';
import { ApiConfigSchema } from './api-config.js';
import type { ApiConfig } from './api-config.js';

/**
 * Export Metadata Schema.
 *
 * Per D-06: Fixed schema version '1.0', ISO timestamp, optional tool version.
 *
 * Fields:
 * - version: Fixed schema version ('1.0' - literal for future migration support)
 * - exportedAt: ISO datetime string when export was created
 * - toolVersion: cc-config tool version (optional, defaults to 0.1.0)
 *
 * Uses strict mode to reject unknown fields.
 */
export const ExportMetadataSchema = z.object({
  version: z.literal('1.0'),           // Fixed schema version
  exportedAt: z.string().datetime(),   // ISO timestamp
  toolVersion: z.string().optional(),  // cc-config version (0.1.0)
}).strict();

export type ExportMetadata = z.infer<typeof ExportMetadataSchema>;

/**
 * Project Reference Schema.
 *
 * Lightweight project reference for export/import.
 * Not full ProjectEntry - just enough to identify and optionally name the project.
 *
 * Fields:
 * - id: Project UUID (required)
 * - path: Project path (required, may differ on import machine)
 * - name: Display name (optional, derived from path basename)
 *
 * Uses strict mode to reject unknown fields.
 */
export const ProjectRefSchema = z.object({
  id: z.string().uuid(),               // Project UUID
  path: z.string(),                    // Project path (may differ on import)
  name: z.string().optional(),         // Display name (derived from path)
}).strict();

export type ProjectRef = z.infer<typeof ProjectRefSchema>;

/**
 * Export Payload Schema.
 *
 * Complete export payload containing all configuration data.
 * Per D-06: Single JSON file with metadata, project ref, settings, and config.
 *
 * Fields:
 * - metadata: Export metadata (required)
 * - project: Project reference (required)
 * - settings: Claude configuration (required, validated by ClaudeSettingsSchema)
 * - config: Applied API config (nullable - may not have config)
 *
 * Uses strict mode to reject unknown fields.
 * Config is nullable to support projects without applied config.
 */
export const ExportPayloadSchema = z.object({
  metadata: ExportMetadataSchema,
  project: ProjectRefSchema,
  settings: ClaudeSettingsSchema,      // Actual config
  config: ApiConfigSchema.nullable(), // Applied API config (if any)
}).strict();

export type ExportPayload = z.infer<typeof ExportPayloadSchema>;

/**
 * Legacy Export Payload Schema (v1.0 with template field).
 *
 * Used for migration from old export files that used template field.
 * Per D-06: Support backward compatibility during migration.
 */
export const LegacyExportPayloadSchema = z.object({
  metadata: ExportMetadataSchema,
  project: ProjectRefSchema,
  settings: ClaudeSettingsSchema,
  template: z.any().nullable(), // Legacy template field (untyped for flexibility)
}).strict();

/**
 * Legacy Template Provider Structure.
 *
 * 用于类型守卫验证旧格式 template.provider 字段。
 */
interface LegacyTemplateProvider {
  name?: string;
  baseUrl?: string;
  env?: Record<string, string>;
}

interface LegacyTemplate {
  name: string;
  provider?: LegacyTemplateProvider;
}

interface LegacyPayload {
  metadata?: unknown;
  project?: unknown;
  settings?: unknown;
  template?: LegacyTemplate | null;
}

/**
 * 验证 legacy.template 是否有效结构。
 */
function isValidLegacyTemplate(template: unknown): template is LegacyTemplate {
  if (!template || typeof template !== 'object') return false;
  const t = template as Record<string, unknown>;
  return typeof t.name === 'string';
}

/**
 * Migrate legacy export payload to new format.
 *
 * Detects old format (contains 'template' field) and converts to new format
 * with 'config' field using TemplateConfig → ApiConfig field mapping.
 *
 * Per CFG-06: Migration utility for backward compatibility.
 *
 * Field mapping (TemplateConfig → ApiConfig):
 * - name → name
 * - provider.name → modelName
 * - provider.baseUrl → baseUrl
 * - provider.env.ANTHROPIC_API_KEY → apiKey
 * - Added mode: 'unified'
 *
 * @param payload - Legacy or new payload (unknown type for flexibility)
 * @returns New ExportPayload with config field
 * @throws Error if payload is invalid or migration fails
 */
export function migrateExportPayload(payload: unknown): ExportPayload {
  // Check if already new format (has config field)
  if (payload && typeof payload === 'object' && 'config' in payload) {
    // Already new format - validate and return
    const result = ExportPayloadSchema.safeParse(payload);
    if (!result.success) {
      throw new Error(`Invalid export payload: ${result.error.message}`);
    }
    return result.data;
  }

  // Check if legacy format (has template field)
  if (payload && typeof payload === 'object' && 'template' in payload) {
    const legacy = payload as LegacyPayload;

    // Convert template to config if template exists
    let config: ApiConfig | null = null;
    if (legacy.template && isValidLegacyTemplate(legacy.template) && legacy.template.provider) {
      const template = legacy.template;

      // Field mapping (per PATTERNS.md Pattern A)
      config = {
        name: template.name,
        apiKey: template.provider.env?.ANTHROPIC_API_KEY || '',
        baseUrl: template.provider.baseUrl || '',
        mode: 'unified',
        modelName: template.provider.name, // provider.name → modelName
      };
    }

    // Build new payload
    const newPayload = {
      metadata: legacy.metadata,
      project: legacy.project,
      settings: legacy.settings,
      config,
    };

    // Validate new payload
    const result = ExportPayloadSchema.safeParse(newPayload);
    if (!result.success) {
      throw new Error(`Migration failed: ${result.error.message}`);
    }

    return result.data;
  }

  // Invalid payload format
  throw new Error('Invalid export payload: neither template nor config field present');
}

/**
 * Conflict Field Interface.
 *
 * Represents a detected conflict between imported and existing config.
 * Used by ExportService.detectConflicts(), not a Zod schema.
 *
 * Fields:
 * - key: Field path (e.g., 'env.ANTHROPIC_MODEL', 'model')
 * - imported: Value from import file
 * - existing: Current value in project
 *
 * Example:
 * { key: 'env.ANTHROPIC_MODEL', imported: 'claude-3', existing: 'claude-2' }
 */
export interface ConflictField {
  key: string;           // Field path (e.g., 'env.ANTHROPIC_MODEL')
  imported: unknown;     // Value from import file
  existing: unknown;     // Current value in project
}