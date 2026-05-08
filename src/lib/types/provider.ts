/**
 * API Provider Configuration Schemas
 *
 * Zod schemas defining API provider configurations.
 * These schemas serve as the single source of truth for TypeScript types.
 *
 * Key principles (per D-01):
 * - TypeScript types are inferred via z.infer<>
 * - Strict validation rejects unknown fields (catches typos)
 * - Nested schemas validated recursively
 *
 * Per D-09: Provider types include name, baseUrl, authType, headers.
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