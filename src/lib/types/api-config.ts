/**
 * API Configuration Schemas
 *
 * Zod schemas defining API configuration for v2.0 simplified config management.
 * Per CFG-01: Simplified三元组 (name + apiKey + baseUrl + modelName) with mode selection.
 *
 * Key principles (per D-01):
 * - TypeScript types are inferred via z.infer<>
 * - Strict validation rejects unknown fields
 * - Conditional validation via .refine() for unified/granular modes
 */

import { z } from 'zod';

/**
 * API Configuration Mode Schema.
 *
 * Defines the configuration mode:
 * - 'unified': Simplified mode using modelName (single model name for all 6 model vars)
 * - 'granular': Advanced mode using complete env object (full control over env vars)
 *
 * Per D-02: mode field supports 'unified' and 'granular' two configuration modes.
 * Per D-06: Default configuration mode is unified (simplified first-time config).
 */
export const ApiConfigModeSchema = z.enum(['unified', 'granular']);
export type ApiConfigMode = z.infer<typeof ApiConfigModeSchema>;

/**
 * API Configuration Schema.
 *
 * Defines a complete API configuration for v2.0.
 * Per CFG-01/CFG-04: Simplified structure with name/apiKey/baseUrl/mode.
 *
 * Fields:
 * - name: Config identifier (required, non-empty string, unique in store)
 * - apiKey: API authentication key (required, non-empty string, masked in display)
 * - baseUrl: API base URL (required, must be valid URL format)
 * - mode: Configuration mode (required, from ApiConfigMode enum)
 * - modelName: Model name for unified mode (optional, required when mode='unified')
 * - env: Environment variables for granular mode (optional, required when mode='granular')
 * - createdAt: Creation timestamp (optional, ISO datetime string)
 * - updatedAt: Last update timestamp (optional, ISO datetime string)
 *
 * Per D-01: ApiConfig contains name/apiKey/baseUrl/mode/modelName/env fields.
 * Per D-03: unified mode uses modelName field (single model name).
 * Per D-04: granular mode uses complete env object (ClaudeSettings.env format).
 * Per D-05: name is unique in global config store (cross-project shared).
 *
 * Uses strict mode to reject unknown fields - prevents injection via extra fields (T-10-06).
 * Uses refine for conditional validation of mode-specific fields.
 */
export const ApiConfigSchema = z.object({
  name: z.string().min(1, 'Config name required'),
  apiKey: z.string().min(1, 'API key required'),
  baseUrl: z.string().url('Valid URL required'),
  mode: ApiConfigModeSchema,
  modelName: z.string().optional(),
  env: z.record(z.string(), z.string()).optional(),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
}).strict().refine(
  data => data.mode === 'unified' ? data.modelName !== undefined : data.env !== undefined,
  "unified mode requires modelName, granular mode requires env"
);

/**
 * API Configuration TypeScript type.
 *
 * Inferred from ApiConfigSchema, ensuring type definitions
 * stay synchronized with validation logic.
 */
export type ApiConfig = z.infer<typeof ApiConfigSchema>;

/**
 * Masked API Configuration type.
 *
 * Per CFG-04/SEC-01: API key masked in all display contexts.
 * Used for preview/diff/logs where apiKey should not be exposed.
 * apiKey field is string type (masked value like "...xyz").
 */
export type MaskedApiConfig = Omit<ApiConfig, 'apiKey'> & { apiKey: string };