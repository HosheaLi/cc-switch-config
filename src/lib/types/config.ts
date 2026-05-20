/**
 * Claude Code Configuration Schemas
 *
 * Zod schemas defining the complete Claude Code settings.json structure.
 * These schemas serve as the single source of truth for TypeScript types.
 *
 * Key principles (per D-01):
 * - TypeScript types are inferred via z.infer<>
 * - Strict validation catches typos and invalid fields
 * - All config fields covered (per D-02)
 */

import { z } from 'zod';

/**
 * Environment variable configuration schema.
 *
 * Validates environment variables for Claude Code.
 * Uses passthrough to allow arbitrary additional environment variables.
 */
export const EnvConfigSchema = z.object({
  ANTHROPIC_MODEL: z.string().optional(),
  ANTHROPIC_BASE_URL: z.string().url().optional(),
  ANTHROPIC_AUTH_TOKEN: z.string().optional(),
}).passthrough(); // Allow arbitrary env vars

/**
 * MCP server configuration schema.
 *
 * Validates individual MCP server settings.
 * Uses strict mode to reject unknown configuration options.
 */
export const McpServerConfigSchema = z.object({
  command: z.string(),
  args: z.array(z.string()).optional(),
  env: z.record(z.string(), z.string()).optional(),
  disabled: z.boolean().optional(),
}).strict(); // Reject unknown keys

/**
 * Permission rule schema.
 *
 * Validates permission rules for tool access control.
 * Requires at least one of 'allow' or 'deny'.
 * Uses strict mode to reject unknown fields.
 */
export const PermissionRuleSchema = z.object({
  allow: z.string().optional(),
  deny: z.string().optional(),
}).strict().refine(
  data => data.allow !== undefined || data.deny !== undefined,
  "Permission rule must have 'allow' or 'deny'"
);

/**
 * Hook configuration schema.
 *
 * Validates hook definitions for lifecycle events.
 * Uses strict mode to reject unknown fields.
 */
export const HookConfigSchema = z.object({
  match: z.string(),
  run: z.string(),
  timeout: z.number().int().positive().optional(),
}).strict(); // Reject unknown keys

/**
 * Complete Claude Code settings.json schema.
 *
 * Validates the entire settings configuration including:
 * - version: Config schema version
 * - env: Environment variables (key-value pairs)
 * - model: Default model selection
 * - mcpServers: Named MCP server configurations
 * - permissions: Permission rules for tool access
 * - hooks: Lifecycle event hooks
 *
 * Uses passthrough to allow official Claude Code fields not defined here
 * (e.g., skipWebFetchPreflight, enabledMcpjsonServers).
 * permissions accepts both array and object formats used by different
 * Claude Code versions.
 */
export const ClaudeSettingsSchema = z.object({
  version: z.number().int().optional(),
  env: z.record(z.string(), z.string()).optional(),
  model: z.string().optional(),
  mcpServers: z.record(z.string(), McpServerConfigSchema).optional(),
  permissions: z.union([
    z.array(PermissionRuleSchema),
    z.record(z.string(), z.unknown())
  ]).optional(),
  hooks: z.array(HookConfigSchema).optional(),
}).passthrough(); // Allow official fields not explicitly defined

/**
 * TypeScript types inferred from Zod schemas.
 *
 * These types are automatically derived from schemas above,
 * ensuring type definitions stay synchronized with validation logic.
 */
export type EnvConfig = z.infer<typeof EnvConfigSchema>;
export type McpServerConfig = z.infer<typeof McpServerConfigSchema>;
export type PermissionRule = z.infer<typeof PermissionRuleSchema>;
export type HookConfig = z.infer<typeof HookConfigSchema>;
export type ClaudeSettings = z.infer<typeof ClaudeSettingsSchema>;