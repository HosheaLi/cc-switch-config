/**
 * API Provider and Template Configuration Schemas
 *
 * Zod schemas defining API provider and template configurations.
 * These schemas serve as the single source of truth for TypeScript types.
 *
 * Key principles (per D-01):
 * - TypeScript types are inferred via z.infer<>
 * - Strict validation rejects unknown fields (catches typos)
 * - Nested schemas validated recursively
 *
 * Per D-09: Provider types include name, baseUrl, authType, headers.
 * Per F7: User-defined templates, no predefined templates.
 */

import { z } from 'zod';

/**
 * Authentication type for API providers.
 *
 * Defines how authentication is handled:
 * - 'token': Environment token (ANTHROPIC_AUTH_TOKEN style)
 * - 'header': Authorization header (Bearer/X-API-Key style)
 * - 'custom': Flexible authentication (user-defined)
 */
export const AuthTypeSchema = z.enum(['token', 'header', 'custom']);
export type AuthType = z.infer<typeof AuthTypeSchema>;

/**
 * API Provider Configuration Schema.
 *
 * Defines a custom API provider with connection details.
 * Per D-09: Includes name, baseUrl, authType, headers, env.
 *
 * Fields:
 * - name: Provider display name (required, non-empty string)
 * - baseUrl: API base URL (required, must be valid URL format)
 * - authType: Authentication method (required, from AuthType enum)
 * - headers: Additional HTTP headers (optional, key-value pairs)
 * - env: Additional environment variables to set (optional, key-value pairs)
 *
 * Uses strict mode to reject unknown fields - catches configuration typos.
 */
export const ApiProviderConfigSchema = z.object({
  name: z.string().min(1, 'Provider name required'),
  baseUrl: z.string().url('Valid URL required'),
  authType: AuthTypeSchema,
  headers: z.record(z.string(), z.string()).optional(),
  env: z.record(z.string(), z.string()).optional(),
}).strict();

export type ApiProviderConfig = z.infer<typeof ApiProviderConfigSchema>;

/**
 * Template Configuration Schema.
 *
 * Defines a reusable provider template.
 * Per F7: User-defined templates, no predefined templates.
 *
 * Fields:
 * - name: Template identifier (required, non-empty string, used as key in store)
 * - description: Human-readable description (optional)
 * - provider: Provider configuration (required, validated by ApiProviderConfigSchema)
 * - tags: Organization/filtering tags (optional, array of strings)
 * - createdAt: Creation timestamp (optional, ISO datetime string)
 * - updatedAt: Last update timestamp (optional, ISO datetime string)
 *
 * Uses strict mode to reject unknown fields.
 * Provider schema is validated recursively (nested validation).
 */
export const TemplateConfigSchema = z.object({
  name: z.string().min(1, 'Template name required'),
  description: z.string().optional(),
  provider: ApiProviderConfigSchema,
  tags: z.array(z.string()).optional(),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
}).strict();

export type TemplateConfig = z.infer<typeof TemplateConfigSchema>;

/**
 * Template Store Schema.
 *
 * Schema for templates.json storage file.
 * Defines the structure for storing multiple templates.
 *
 * Fields:
 * - version: Store schema version (optional, integer)
 * - templates: Named templates (required, record of TemplateConfig)
 *
 * Uses strict mode to reject unknown fields.
 * Template name serves as the key in the templates record.
 */
export const TemplateStoreSchema = z.object({
  version: z.number().int().optional(),
  templates: z.record(z.string(), TemplateConfigSchema),
}).strict();

export type TemplateStore = z.infer<typeof TemplateStoreSchema>;