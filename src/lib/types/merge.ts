/**
 * Config Layer Merge Algorithms
 *
 * Deep merge implementation for three-layer config priority system.
 * Provides config inheritance with proper merge semantics per D-04, D-06.
 *
 * Merge strategy (per D-04):
 * - Objects: recursive deep merge
 * - Arrays: replacement (higher priority wins)
 * - Primitives: replacement
 * - undefined: skip (don't override with undefined)
 * - null: replace (explicit null clears value)
 */

import type { ClaudeSettings } from './config.js';

/**
 * Config layer priority levels.
 * Priority: user < project < local (lowest to highest)
 */
export type ConfigLayer = 'user' | 'project' | 'local';

/**
 * Layered config input for merge.
 * Each layer may have partial config.
 */
export interface LayeredConfig {
  user?: Partial<ClaudeSettings>;
  project?: Partial<ClaudeSettings>;
  local?: Partial<ClaudeSettings>;
}

/**
 * Layer priority order for merging.
 * Order: user → project → local (lowest to highest priority)
 */
export const LAYER_PRIORITY: ConfigLayer[] = ['user', 'project', 'local'];

/**
 * Deep merge config objects.
 *
 * Merge strategy (per D-04):
 * - Objects: recursive deep merge
 * - Arrays: replacement (higher priority wins)
 * - Primitives: replacement
 * - undefined: skip (don't override with undefined)
 * - null: replace (explicit null clears value)
 *
 * @param base - Base config (lower priority)
 * @param override - Override config (higher priority)
 * @returns Merged config with override values taking precedence
 */
export function deepMergeConfig<T extends Record<string, unknown>>(
  base: T,
  override: Partial<T>
): T {
  const result = { ...base } as T;

  for (const key in override) {
    const overrideValue = override[key];
    const baseValue = result[key];

    // Skip undefined - don't override with undefined
    if (overrideValue === undefined) {
      continue;
    }

    // Null replaces - explicit null clears the value
    if (overrideValue === null) {
      result[key] = null as T[Extract<keyof T, string>];
      continue;
    }

    // Arrays REPLACE (not concatenate) - per D-04 research
    if (Array.isArray(overrideValue)) {
      result[key] = overrideValue as T[Extract<keyof T, string>];
      continue;
    }

    // Objects deep merge recursively
    if (
      typeof overrideValue === 'object' &&
      overrideValue !== null &&
      typeof baseValue === 'object' &&
      baseValue !== null &&
      !Array.isArray(baseValue) &&
      !Array.isArray(overrideValue)
    ) {
      result[key] = deepMergeConfig(
        baseValue as Record<string, unknown>,
        overrideValue as Record<string, unknown>
      ) as T[Extract<keyof T, string>];
      continue;
    }

    // Primitives replace
    result[key] = overrideValue as T[Extract<keyof T, string>];
  }

  return result;
}

/**
 * Merge config layers in priority order (per D-06).
 *
 * Order: user → project → local (lowest to highest priority)
 * Higher priority layers override lower priority values.
 *
 * @param layers - Config layers to merge
 * @returns Merged config combining all layers
 */
export function mergeConfigLayers(layers: LayeredConfig): ClaudeSettings {
  // Start with empty/default config
  const empty: ClaudeSettings = {};
  let merged: ClaudeSettings = empty;

  // Merge in priority order (lowest to highest)
  for (const layer of LAYER_PRIORITY) {
    const config = layers[layer];
    if (config !== undefined && config !== null) {
      merged = deepMergeConfig(merged, config);
    }
  }

  return merged;
}