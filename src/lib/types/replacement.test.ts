/**
 * Field Replacement Tests
 *
 * Tests for precise env/model field replacement in ClaudeSettings.
 * Validates that permissions/hooks/mcpServers are preserved.
 */

import { describe, it, expect } from 'vitest';
import { replaceEnvModel, buildUnifiedEnv } from './replacement.js';
import type { ClaudeSettings } from './config.js';
import type { ApiConfig } from './api-config.js';

describe('replaceEnvModel', () => {
  describe('env field replacement', () => {
    it('replaces env field completely, preserves permissions/hooks/mcpServers', () => {
      const existing: ClaudeSettings = {
        version: 1,
        env: {
          ANTHROPIC_MODEL: 'old-model',
          ANTHROPIC_AUTH_TOKEN: 'old-token',
        },
        permissions: [{ allow: 'Read(*)' }],
        hooks: [{ match: 'PreToolUse', run: 'echo test' }],
        mcpServers: {
          'test-server': { command: 'node', args: ['test.js'] },
        },
      };

      const apiConfig: ApiConfig = {
        name: 'test-config',
        apiKey: 'new-api-key',
        baseUrl: 'https://new.api.com',
        mode: 'unified',
        modelName: 'new-model',
      };

      const result = replaceEnvModel(existing, apiConfig);

      // env should be completely replaced (not merged)
      expect(result.env?.ANTHROPIC_MODEL).toBe('new-model');
      expect(result.env?.ANTHROPIC_AUTH_TOKEN).toBe('new-api-key');
      expect(result.env?.ANTHROPIC_BASE_URL).toBe('https://new.api.com');
      // Old env values should NOT be preserved (complete replacement)
      expect(Object.keys(result.env ?? {}).length).toBe(8); // 6 model vars + apiKey + baseUrl
      expect(result.env?.ANTHROPIC_MODEL).not.toBe('old-model');

      // Other fields preserved
      expect(result.permissions).toEqual([{ allow: 'Read(*)' }]);
      expect(result.hooks).toEqual([{ match: 'PreToolUse', run: 'echo test' }]);
      expect(result.mcpServers).toEqual({
        'test-server': { command: 'node', args: ['test.js'] },
      });
    });

    it('env field is completely replaced (not merged)', () => {
      const existing: ClaudeSettings = {
        env: {
          OLD_VAR: 'old-value',
          ANOTHER_OLD: 'another',
        },
      };

      const apiConfig: ApiConfig = {
        name: 'test-config',
        apiKey: 'test-key',
        baseUrl: 'https://api.test.com',
        mode: 'granular',
        env: {
          NEW_VAR: 'new-value',
          DIFFERENT_VAR: 'different',
        },
      };

      const result = replaceEnvModel(existing, apiConfig);

      // Only new env should exist
      expect(result.env).toEqual({
        NEW_VAR: 'new-value',
        DIFFERENT_VAR: 'different',
      });
      // Old env values should NOT exist
      expect(result.env?.OLD_VAR).toBeUndefined();
      expect(result.env?.ANOTHER_OLD).toBeUndefined();
    });
  });

  describe('model field handling', () => {
    it('sets model field for unified mode', () => {
      const existing: ClaudeSettings = {
        model: 'old-model',
      };

      const apiConfig: ApiConfig = {
        name: 'test-config',
        apiKey: 'test-key',
        baseUrl: 'https://api.test.com',
        mode: 'unified',
        modelName: 'claude-3-5-sonnet-20241022',
      };

      const result = replaceEnvModel(existing, apiConfig);
      expect(result.model).toBe('claude-3-5-sonnet-20241022');
    });

    it('sets model to undefined for granular mode', () => {
      const existing: ClaudeSettings = {
        model: 'old-model',
      };

      const apiConfig: ApiConfig = {
        name: 'test-config',
        apiKey: 'test-key',
        baseUrl: 'https://api.test.com',
        mode: 'granular',
        env: { ANTHROPIC_MODEL: 'custom-model' },
      };

      const result = replaceEnvModel(existing, apiConfig);
      expect(result.model).toBeUndefined();
    });
  });

  describe('field preservation (CFG-02)', () => {
    it('preserves permissions field', () => {
      const existing: ClaudeSettings = {
        permissions: [
          { allow: 'Read(*)' },
          { deny: 'Write(secrets/*)' },
        ],
      };

      const apiConfig: ApiConfig = {
        name: 'test-config',
        apiKey: 'test-key',
        baseUrl: 'https://api.test.com',
        mode: 'unified',
        modelName: 'claude-3',
      };

      const result = replaceEnvModel(existing, apiConfig);
      expect(result.permissions).toEqual([
        { allow: 'Read(*)' },
        { deny: 'Write(secrets/*)' },
      ]);
    });

    it('preserves hooks field', () => {
      const existing: ClaudeSettings = {
        hooks: [
          { match: 'PreToolUse', run: 'echo before' },
          { match: 'PostToolUse', run: 'echo after', timeout: 5000 },
        ],
      };

      const apiConfig: ApiConfig = {
        name: 'test-config',
        apiKey: 'test-key',
        baseUrl: 'https://api.test.com',
        mode: 'unified',
        modelName: 'claude-3',
      };

      const result = replaceEnvModel(existing, apiConfig);
      expect(result.hooks).toEqual([
        { match: 'PreToolUse', run: 'echo before' },
        { match: 'PostToolUse', run: 'echo after', timeout: 5000 },
      ]);
    });

    it('preserves mcpServers field', () => {
      const existing: ClaudeSettings = {
        mcpServers: {
          'filesystem': { command: 'npx', args: ['-y', '@anthropic/mcp-server'] },
          'custom': { command: 'node', args: ['custom.js'], env: { VAR: 'value' } },
        },
      };

      const apiConfig: ApiConfig = {
        name: 'test-config',
        apiKey: 'test-key',
        baseUrl: 'https://api.test.com',
        mode: 'unified',
        modelName: 'claude-3',
      };

      const result = replaceEnvModel(existing, apiConfig);
      expect(result.mcpServers).toEqual({
        'filesystem': { command: 'npx', args: ['-y', '@anthropic/mcp-server'] },
        'custom': { command: 'node', args: ['custom.js'], env: { VAR: 'value' } },
      });
    });

    it('preserves version field', () => {
      const existing: ClaudeSettings = {
        version: 1,
      };

      const apiConfig: ApiConfig = {
        name: 'test-config',
        apiKey: 'test-key',
        baseUrl: 'https://api.test.com',
        mode: 'unified',
        modelName: 'claude-3',
      };

      const result = replaceEnvModel(existing, apiConfig);
      expect(result.version).toBe(1);
    });
  });

  describe('empty existing config handling', () => {
    it('empty existing config works (env/model replaced, others remain undefined)', () => {
      const existing: ClaudeSettings = {};

      const apiConfig: ApiConfig = {
        name: 'test-config',
        apiKey: 'test-key',
        baseUrl: 'https://api.test.com',
        mode: 'unified',
        modelName: 'claude-3',
      };

      const result = replaceEnvModel(existing, apiConfig);

      // env and model should be set
      expect(result.env).toBeDefined();
      expect(result.model).toBe('claude-3');

      // Other fields should be undefined
      expect(result.permissions).toBeUndefined();
      expect(result.hooks).toBeUndefined();
      expect(result.mcpServers).toBeUndefined();
      expect(result.version).toBeUndefined();
    });
  });

  describe('granular mode handling', () => {
    it('uses provided env for granular mode', () => {
      const existing: ClaudeSettings = {};

      const apiConfig: ApiConfig = {
        name: 'test-config',
        apiKey: 'test-key',
        baseUrl: 'https://api.test.com',
        mode: 'granular',
        env: {
          ANTHROPIC_MODEL: 'glm-5',
          ANTHROPIC_AUTH_TOKEN: 'custom-token',
          ANTHROPIC_BASE_URL: 'https://ark.cn-beijing.volces.com/api/coding',
          CUSTOM_VAR: 'custom',
        },
      };

      const result = replaceEnvModel(existing, apiConfig);
      expect(result.env).toEqual({
        ANTHROPIC_MODEL: 'glm-5',
        ANTHROPIC_AUTH_TOKEN: 'custom-token',
        ANTHROPIC_BASE_URL: 'https://ark.cn-beijing.volces.com/api/coding',
        CUSTOM_VAR: 'custom',
      });
    });

    it('handles granular mode with empty env', () => {
      const existing: ClaudeSettings = {
        env: { OLD_VAR: 'old' },
      };

      const apiConfig: ApiConfig = {
        name: 'test-config',
        apiKey: 'test-key',
        baseUrl: 'https://api.test.com',
        mode: 'granular',
        env: {},
      };

      const result = replaceEnvModel(existing, apiConfig);
      expect(result.env).toEqual({});
    });
  });
});

describe('buildUnifiedEnv', () => {
  describe('standard env generation (D-14)', () => {
    it('generates 6 model vars + apiKey + baseUrl (8 keys total)', () => {
      const apiConfig: ApiConfig = {
        name: 'test-config',
        apiKey: 'sk-test-key-123',
        baseUrl: 'https://api.test.com',
        mode: 'unified',
        modelName: 'claude-3-5-sonnet-20241022',
      };

      const env = buildUnifiedEnv(apiConfig);

      // Should have 6 model vars + apiKey + baseUrl = 8 keys
      const expectedKeys = [
        'ANTHROPIC_MODEL',
        'ANTHROPIC_DEFAULT_SONNET_MODEL',
        'ANTHROPIC_DEFAULT_HAIKU_MODEL',
        'ANTHROPIC_DEFAULT_OPUS_MODEL',
        'ANTHROPIC_REASONING_MODEL',
        'CLAUDE_CODE_SUBAGENT_MODEL',
        'ANTHROPIC_AUTH_TOKEN',
        'ANTHROPIC_BASE_URL',
      ];

      expect(Object.keys(env).length).toBe(expectedKeys.length);
      for (const key of expectedKeys) {
        expect(env[key]).toBeDefined();
      }
    });

    it('all 6 model vars use same modelName', () => {
      const apiConfig: ApiConfig = {
        name: 'test-config',
        apiKey: 'test-key',
        baseUrl: 'https://api.test.com',
        mode: 'unified',
        modelName: 'glm-5.1',
      };

      const env = buildUnifiedEnv(apiConfig);

      // All model vars should have same value
      expect(env.ANTHROPIC_MODEL).toBe('glm-5.1');
      expect(env.ANTHROPIC_DEFAULT_SONNET_MODEL).toBe('glm-5.1');
      expect(env.ANTHROPIC_DEFAULT_HAIKU_MODEL).toBe('glm-5.1');
      expect(env.ANTHROPIC_DEFAULT_OPUS_MODEL).toBe('glm-5.1');
      expect(env.ANTHROPIC_REASONING_MODEL).toBe('glm-5.1');
    });

    it('ANTHROPIC_AUTH_TOKEN set to apiKey', () => {
      const apiConfig: ApiConfig = {
        name: 'test-config',
        apiKey: 'sk-secret-key-xyz',
        baseUrl: 'https://api.test.com',
        mode: 'unified',
        modelName: 'claude-3',
      };

      const env = buildUnifiedEnv(apiConfig);
      expect(env.ANTHROPIC_AUTH_TOKEN).toBe('sk-secret-key-xyz');
    });

    it('ANTHROPIC_BASE_URL set to baseUrl', () => {
      const apiConfig: ApiConfig = {
        name: 'test-config',
        apiKey: 'test-key',
        baseUrl: 'https://ark.cn-beijing.volces.com/api/coding',
        mode: 'unified',
        modelName: 'glm-5',
      };

      const env = buildUnifiedEnv(apiConfig);
      expect(env.ANTHROPIC_BASE_URL).toBe('https://ark.cn-beijing.volces.com/api/coding');
    });

    it('returns exactly expected values per D-14', () => {
      const apiConfig: ApiConfig = {
        name: 'test-config',
        apiKey: 'test-api-key',
        baseUrl: 'https://api.example.com',
        mode: 'unified',
        modelName: 'claude-3-5-sonnet-20241022',
      };

      const env = buildUnifiedEnv(apiConfig);

      expect(env).toEqual({
        ANTHROPIC_MODEL: 'claude-3-5-sonnet-20241022',
        ANTHROPIC_DEFAULT_SONNET_MODEL: 'claude-3-5-sonnet-20241022',
        ANTHROPIC_DEFAULT_HAIKU_MODEL: 'claude-3-5-sonnet-20241022',
        ANTHROPIC_DEFAULT_OPUS_MODEL: 'claude-3-5-sonnet-20241022',
        ANTHROPIC_REASONING_MODEL: 'claude-3-5-sonnet-20241022',
        CLAUDE_CODE_SUBAGENT_MODEL: 'claude-3-5-sonnet-20241022',
        ANTHROPIC_AUTH_TOKEN: 'test-api-key',
        ANTHROPIC_BASE_URL: 'https://api.example.com',
      });
    });
  });
});