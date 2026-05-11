/**
 * Field Replacement Utilities
 *
 * Implements precise env/model field replacement for ClaudeSettings.
 * Per CFG-02: Only env/model fields are replaced, permissions/hooks/mcpServers preserved.
 *
 * Key difference from deepMergeConfig (D-12):
 * - deepMergeConfig: recursive deep merge (combines values)
 * - replaceEnvModel: complete replacement (only env/model changed)
 *
 * Per D-13: Complete replacement of env/model fields (simple and clear).
 * Per D-14: unified mode generates standard env with 6 model vars + apiKey + baseUrl.
 */

import type { ClaudeSettings } from './config.js';
import type { ApiConfig } from './api-config.js';

/**
 * Replace env/model fields in ClaudeSettings.
 *
 * Per CFG-02: Precise field replacement - only env/model changed,
 * permissions/hooks/mcpServers preserved.
 *
 * Per D-13: Complete replacement, not merge (simple and clear).
 * - env field is completely replaced (not merged with existing)
 * - model field is set/unset based on mode
 *
 * @param existing - Current ClaudeSettings (preserves permissions/hooks/mcpServers)
 * @param apiConfig - API configuration to apply
 * @returns New ClaudeSettings with env/model replaced, other fields preserved
 */
export function replaceEnvModel(
  existing: ClaudeSettings,
  apiConfig: ApiConfig
): ClaudeSettings {
  // Build env from apiConfig mode
  const newEnv = apiConfig.mode === 'unified'
    ? buildUnifiedEnv(apiConfig) // D-14: 6 model vars + apiKey + baseUrl = 8 vars
    : apiConfig.env ?? {};       // granular mode: use provided env

  // D-13: Complete replacement - only env/model changed
  return {
    ...existing,
    env: newEnv,
    model: apiConfig.mode === 'unified' ? apiConfig.modelName : undefined,
    // permissions, hooks, mcpServers PRESERVED (CFG-02)
  };
}

/**
 * Generate standard env object for unified mode.
 *
 * Per D-14: unified mode generates standard env object with:
 * - 6 model variables (all using same modelName)
 * - ANTHROPIC_AUTH_TOKEN (apiKey)
 * - ANTHROPIC_BASE_URL (baseUrl)
 * = 8 total env vars
 *
 * Model variables:
 * - ANTHROPIC_MODEL
 * - ANTHROPIC_DEFAULT_SONNET_MODEL
 * - ANTHROPIC_DEFAULT_HAIKU_MODEL
 * - ANTHROPIC_DEFAULT_OPUS_MODEL
 * - ANTHROPIC_REASONING_MODEL
 * - CLAUDE_CODE_SUBAGENT_MODEL
 *
 * @param config - API configuration with unified mode
 * @returns Standard env object for Claude Code
 * @throws Error if modelName is undefined (防御性校验)
 */
export function buildUnifiedEnv(config: ApiConfig): Record<string, string> {
  // 防御性校验：unified mode 必须有 modelName
  if (!config.modelName) {
    throw new Error('unified mode requires modelName');
  }

  return {
    // 6 model variables - all use same modelName
    ANTHROPIC_MODEL: config.modelName,
    ANTHROPIC_DEFAULT_SONNET_MODEL: config.modelName,
    ANTHROPIC_DEFAULT_HAIKU_MODEL: config.modelName,
    ANTHROPIC_DEFAULT_OPUS_MODEL: config.modelName,
    ANTHROPIC_REASONING_MODEL: config.modelName,
    CLAUDE_CODE_SUBAGENT_MODEL: config.modelName,
    // API key and base URL
    ANTHROPIC_AUTH_TOKEN: config.apiKey,
    ANTHROPIC_BASE_URL: config.baseUrl,
  };
}