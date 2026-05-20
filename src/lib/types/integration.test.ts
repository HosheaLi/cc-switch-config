/**
 * Types Module Integration Tests
 *
 * Verifies that all types modules work together correctly:
 * - Barrel export provides all exports
 * - DEFAULT_CONFIG validates against ClaudeSettingsSchema
 * - mergeConfigLayers integrates with DEFAULT_CONFIG
 */

import { describe, it, expect } from 'vitest';
import {
  ClaudeSettingsSchema,
  validateConfig,
  ValidationError,
  deepMergeConfig,
  mergeConfigLayers,
} from './index.js';
import type { ClaudeSettings } from './index.js';
import { DEFAULT_CONFIG, CONFIG_VERSION } from '../config/version.js';

describe('Types Module Integration', () => {
  it('exports all types from barrel', () => {
    // All exports accessible from index.js
    expect(ClaudeSettingsSchema).toBeDefined();
    expect(validateConfig).toBeDefined();
    expect(deepMergeConfig).toBeDefined();
    expect(mergeConfigLayers).toBeDefined();
    expect(ValidationError).toBeDefined();
  });

  it('DEFAULT_CONFIG validates against ClaudeSettingsSchema', () => {
    const result = validateConfig(DEFAULT_CONFIG);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.version).toBe(CONFIG_VERSION);
    }
  });

  it('DEFAULT_CONFIG has correct version', () => {
    expect(DEFAULT_CONFIG.version).toBe(CONFIG_VERSION);
  });

  it('DEFAULT_CONFIG has all ClaudeSettings fields', () => {
    expect(DEFAULT_CONFIG.env).toBeDefined();
    expect(DEFAULT_CONFIG.permissions).toBeDefined();
    expect(DEFAULT_CONFIG.hooks).toBeDefined();
    // mcpServers is optional — not set by default to avoid accidental override
    // model is optional and undefined by default
    expect(DEFAULT_CONFIG.model).toBeUndefined();
    expect(DEFAULT_CONFIG.mcpServers).toBeUndefined();
  });

  it('validateConfig catches errors in DEFAULT_CONFIG modifications', () => {
    const invalidConfig = { ...DEFAULT_CONFIG, permissions: [{}] }; // missing allow/deny
    const result = validateConfig(invalidConfig);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBeInstanceOf(ValidationError);
      expect(result.error.issues.length).toBeGreaterThan(0);
    }
  });

  it('mergeConfigLayers merges DEFAULT_CONFIG correctly', () => {
    const layers = {
      user: DEFAULT_CONFIG,
      project: { model: 'claude-3' },
    };
    const merged = mergeConfigLayers(layers);
    expect(merged.model).toBe('claude-3');
    expect(merged.version).toBe(CONFIG_VERSION);
    expect(merged.env).toEqual({});
  });

  it('DEFAULT_CONFIG is valid ClaudeSettings type', () => {
    // Type check via inference
    const config: ClaudeSettings = DEFAULT_CONFIG;
    expect(config.version).toBe(CONFIG_VERSION);
  });

  it('deepMergeConfig preserves DEFAULT_CONFIG base values', () => {
    const override = { model: 'claude-3-opus' };
    const merged = deepMergeConfig(DEFAULT_CONFIG, override);
    expect(merged.model).toBe('claude-3-opus');
    expect(merged.version).toBe(CONFIG_VERSION);
    expect(merged.env).toEqual({});
  });

  it('validateConfig accepts DEFAULT_CONFIG extensions', () => {
    const extendedConfig = {
      ...DEFAULT_CONFIG,
      model: 'claude-3',
      env: { ANTHROPIC_MODEL: 'claude-3' },
    };
    const result = validateConfig(extendedConfig);
    expect(result.success).toBe(true);
  });
});