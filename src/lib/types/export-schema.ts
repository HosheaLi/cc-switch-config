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
import { TemplateConfigSchema } from './provider.js';

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
 * Per D-06: Single JSON file with metadata, project ref, settings, and template.
 *
 * Fields:
 * - metadata: Export metadata (required)
 * - project: Project reference (required)
 * - settings: Claude configuration (required, validated by ClaudeSettingsSchema)
 * - template: Applied template config (nullable - may not have template)
 *
 * Uses strict mode to reject unknown fields.
 * Template is nullable to support projects without applied template.
 */
export const ExportPayloadSchema = z.object({
  metadata: ExportMetadataSchema,
  project: ProjectRefSchema,
  settings: ClaudeSettingsSchema,      // Actual config
  template: TemplateConfigSchema.nullable(), // Applied template (if any)
}).strict();

export type ExportPayload = z.infer<typeof ExportPayloadSchema>;

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