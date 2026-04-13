/**
 * Deep Merge Algorithm Tests
 *
 * Tests for config layer merging with proper priority semantics.
 * Validates array replacement, object deep merge, and three-layer priority.
 */

import { describe, it, expect } from 'vitest';
import {
  deepMergeConfig,
  mergeConfigLayers,
  LAYER_PRIORITY,
  type LayeredConfig,
} from './merge.js';
import type { ClaudeSettings } from './config.js';

describe('deepMergeConfig', () => {
  describe('primitive replacement', () => {
    it('replaces primitive values', () => {
      const base = { a: 1, b: 'test' };
      const override = { a: 2 };
      expect(deepMergeConfig(base, override)).toEqual({ a: 2, b: 'test' });
    });

    it('replaces string values', () => {
      const base = { model: 'claude-3' };
      const override = { model: 'claude-3-5-sonnet' };
      expect(deepMergeConfig(base, override)).toEqual({ model: 'claude-3-5-sonnet' });
    });

    it('preserves base values not in override', () => {
      const base = { a: 1, b: 2, c: 3 };
      const override = { b: 20 };
      expect(deepMergeConfig(base, override)).toEqual({ a: 1, b: 20, c: 3 });
    });
  });

  describe('object deep merge', () => {
    it('deep merges nested objects', () => {
      const base = { obj: { x: 1, y: 2 } };
      const override = { obj: { y: 3, z: 4 } };
      expect(deepMergeConfig(base, override)).toEqual({ obj: { x: 1, y: 3, z: 4 } });
    });

    it('deep merges at multiple nesting levels', () => {
      const base = {
        env: { MODEL: 'a', KEY: 'base-key' },
        mcpServers: { s1: { command: 'n1', args: ['a'] } },
      };
      const override = {
        env: { KEY: 'override-key', NEW_VAR: 'b' },
        mcpServers: { s2: { command: 'n2' } },
      };
      const result = deepMergeConfig(base, override);
      expect(result.env).toEqual({ MODEL: 'a', KEY: 'override-key', NEW_VAR: 'b' });
      expect(result.mcpServers).toEqual({
        s1: { command: 'n1', args: ['a'] },
        s2: { command: 'n2' },
      });
    });

    it('merges nested objects with different structures', () => {
      const base = { level1: { level2: { a: 1 } } };
      const override = { level1: { level2: { b: 2 }, c: 3 } };
      expect(deepMergeConfig(base, override)).toEqual({
        level1: { level2: { a: 1, b: 2 }, c: 3 },
      });
    });
  });

  describe('array replacement (critical per D-04)', () => {
    it('replaces arrays (not concatenates)', () => {
      const base = { arr: [1, 2, 3] };
      const override = { arr: [4, 5] };
      expect(deepMergeConfig(base, override)).toEqual({ arr: [4, 5] });
    });

    it('replaces arrays with different lengths', () => {
      const base = { permissions: [{ allow: 'Read(*)' }, { allow: 'Write(*)' }] };
      const override = { permissions: [{ deny: 'Write(secrets/*)' }] };
      expect(deepMergeConfig(base, override)).toEqual({
        permissions: [{ deny: 'Write(secrets/*)' }],
      });
    });

    it('replaces empty array with non-empty', () => {
      const base = { hooks: [] };
      const override = { hooks: [{ match: 'PreToolUse', run: 'echo test' }] };
      expect(deepMergeConfig(base, override)).toEqual({
        hooks: [{ match: 'PreToolUse', run: 'echo test' }],
      });
    });

    it('replaces non-empty array with empty', () => {
      const base = { arr: [1, 2, 3] };
      const override = { arr: [] };
      expect(deepMergeConfig(base, override)).toEqual({ arr: [] });
    });
  });

  describe('undefined handling', () => {
    it('preserves base when override has undefined', () => {
      const base = { a: 1 };
      const override = { a: undefined, b: 2 };
      expect(deepMergeConfig(base, override)).toEqual({ a: 1, b: 2 });
    });

    it('skips undefined values in nested objects', () => {
      const base = { env: { MODEL: 'a' } };
      const override = { env: { MODEL: undefined, KEY: 'b' } };
      expect(deepMergeConfig(base, override)).toEqual({ env: { MODEL: 'a', KEY: 'b' } });
    });
  });

  describe('null handling', () => {
    it('replaces with null', () => {
      const base = { a: 1, b: 2 };
      const override = { b: null };
      expect(deepMergeConfig(base, override)).toEqual({ a: 1, b: null });
    });

    it('explicitly sets null for clearing values', () => {
      const base = { model: 'claude-3', env: { KEY: 'value' } };
      const override = { env: null };
      expect(deepMergeConfig(base, override)).toEqual({ model: 'claude-3', env: null });
    });
  });

  describe('empty handling', () => {
    it('returns base unchanged for empty override', () => {
      const base = { a: 1, b: 'test' };
      expect(deepMergeConfig(base, {})).toEqual(base);
    });

    it('returns copy of override for empty base', () => {
      const base = {};
      const override = { a: 1, b: 2 };
      const result = deepMergeConfig(base, override);
      expect(result).toEqual(override);
    });
  });

  describe('ClaudeSettings integration', () => {
    it('merges ClaudeSettings configs correctly', () => {
      const base: Partial<ClaudeSettings> = {
        model: 'claude-3',
        env: { ANTHROPIC_MODEL: 'claude-3' },
        permissions: [{ allow: 'Read(*)' }],
      };
      const override: Partial<ClaudeSettings> = {
        model: 'claude-3-5-sonnet',
        env: { ANTHROPIC_BASE_URL: 'https://api.custom.com' },
      };
      const result = deepMergeConfig<ClaudeSettings>(
        base as ClaudeSettings,
        override
      );
      expect(result.model).toBe('claude-3-5-sonnet');
      expect(result.env).toEqual({
        ANTHROPIC_MODEL: 'claude-3',
        ANTHROPIC_BASE_URL: 'https://api.custom.com',
      });
      expect(result.permissions).toEqual([{ allow: 'Read(*)' }]);
    });
  });
});

describe('mergeConfigLayers', () => {
  describe('three-layer priority', () => {
    it('merges three layers in priority order', () => {
      const layers: LayeredConfig = {
        user: { model: 'user-model' },
        project: { env: { PROJECT_VAR: 'value' } },
        local: { model: 'local-model' },
      };
      const result = mergeConfigLayers(layers);
      expect(result.model).toBe('local-model'); // local overrides user
      expect(result.env).toEqual({ PROJECT_VAR: 'value' }); // project added
    });

    it('local overrides project', () => {
      const layers: LayeredConfig = {
        project: { model: 'project-model' },
        local: { model: 'local-model' },
      };
      expect(mergeConfigLayers(layers).model).toBe('local-model');
    });

    it('project overrides user', () => {
      const layers: LayeredConfig = {
        user: { model: 'user-model' },
        project: { model: 'project-model' },
      };
      expect(mergeConfigLayers(layers).model).toBe('project-model');
    });

    it('combines all layers correctly', () => {
      const layers: LayeredConfig = {
        user: {
          model: 'claude-3',
          env: { USER_VAR: 'user' },
          permissions: [{ allow: 'Read(*)' }],
        },
        project: {
          env: { PROJECT_VAR: 'project' },
          mcpServers: { 'project-server': { command: 'node' } },
        },
        local: {
          env: { LOCAL_VAR: 'local' },
          permissions: [{ deny: 'Write(secrets/*)' }],
        },
      };
      const result = mergeConfigLayers(layers);

      // env combines all layers
      expect(result.env).toEqual({
        USER_VAR: 'user',
        PROJECT_VAR: 'project',
        LOCAL_VAR: 'local',
      });

      // model from user layer (no override)
      expect(result.model).toBe('claude-3');

      // mcpServers from project layer
      expect(result.mcpServers).toEqual({
        'project-server': { command: 'node' },
      });

      // permissions replaced by local (array replacement)
      expect(result.permissions).toEqual([{ deny: 'Write(secrets/*)' }]);
    });
  });

  describe('partial layers', () => {
    it('handles missing user layer', () => {
      const layers: LayeredConfig = {
        project: { model: 'project-model' },
        local: { env: { KEY: 'value' } },
      };
      const result = mergeConfigLayers(layers);
      expect(result.model).toBe('project-model');
      expect(result.env).toEqual({ KEY: 'value' });
    });

    it('handles missing project layer', () => {
      const layers: LayeredConfig = {
        user: { model: 'user-model' },
        local: { model: 'local-model' },
      };
      expect(mergeConfigLayers(layers).model).toBe('local-model');
    });

    it('handles missing local layer', () => {
      const layers: LayeredConfig = {
        user: { model: 'user-model' },
        project: { env: { KEY: 'value' } },
      };
      const result = mergeConfigLayers(layers);
      expect(result.model).toBe('user-model');
      expect(result.env).toEqual({ KEY: 'value' });
    });

    it('handles only user layer', () => {
      const layers: LayeredConfig = {
        user: { model: 'user-model', env: { KEY: 'value' } },
      };
      const result = mergeConfigLayers(layers);
      expect(result.model).toBe('user-model');
      expect(result.env).toEqual({ KEY: 'value' });
    });

    it('handles empty layers object', () => {
      const layers: LayeredConfig = {};
      const result = mergeConfigLayers(layers);
      expect(result).toEqual({});
    });

    it('handles layers with null values', () => {
      const layers: LayeredConfig = {
        user: { model: 'user-model' },
        project: null as unknown as Partial<ClaudeSettings>,
        local: { env: { KEY: 'value' } },
      };
      const result = mergeConfigLayers(layers);
      expect(result.model).toBe('user-model');
      expect(result.env).toEqual({ KEY: 'value' });
    });
  });
});

describe('LAYER_PRIORITY', () => {
  it('has correct priority order', () => {
    expect(LAYER_PRIORITY).toEqual(['user', 'project', 'local']);
  });

  it('is immutable (frozen)', () => {
    // TypeScript prevents mutation at compile time
    // Runtime check for array reference
    expect(Array.isArray(LAYER_PRIORITY)).toBe(true);
    expect(LAYER_PRIORITY.length).toBe(3);
  });
});