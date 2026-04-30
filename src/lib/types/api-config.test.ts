/**
 * API Configuration Schema Tests
 *
 * Tests for Zod schema validation of API configurations.
 * Validates unified/granular mode conditional validation and strict mode.
 */

import { describe, it, expect } from 'vitest';
import {
  ApiConfigModeSchema,
  ApiConfigSchema,
  type ApiConfig,
  type ApiConfigMode,
  type MaskedApiConfig,
} from './api-config.js';

describe('ApiConfigModeSchema', () => {
  describe('valid modes', () => {
    it('accepts "unified" mode', () => {
      expect(ApiConfigModeSchema.parse('unified')).toBe('unified');
    });

    it('accepts "granular" mode', () => {
      expect(ApiConfigModeSchema.parse('granular')).toBe('granular');
    });
  });

  describe('invalid modes', () => {
    it('rejects "mixed" mode', () => {
      const result = ApiConfigModeSchema.safeParse('mixed');
      expect(result.success).toBe(false);
    });

    it('rejects empty string', () => {
      const result = ApiConfigModeSchema.safeParse('');
      expect(result.success).toBe(false);
    });

    it('rejects null', () => {
      const result = ApiConfigModeSchema.safeParse(null);
      expect(result.success).toBe(false);
    });

    it('rejects undefined', () => {
      const result = ApiConfigModeSchema.safeParse(undefined);
      expect(result.success).toBe(false);
    });
  });
});

describe('ApiConfigSchema', () => {
  describe('valid unified config', () => {
    it('accepts valid unified config with name/apiKey/baseUrl/mode/modelName', () => {
      const config = {
        name: 'test-config',
        apiKey: 'sk-test-key-123',
        baseUrl: 'https://api.test.com',
        mode: 'unified',
        modelName: 'claude-3-5-sonnet-20241022',
      };
      const result = ApiConfigSchema.safeParse(config);
      expect(result.success).toBe(true);
    });

    it('accepts unified config with timestamps', () => {
      const config = {
        name: 'test-config',
        apiKey: 'sk-test-key-123',
        baseUrl: 'https://api.test.com',
        mode: 'unified',
        modelName: 'claude-3-5-sonnet-20241022',
        createdAt: '2026-04-30T10:00:00Z',
        updatedAt: '2026-04-30T11:00:00Z',
      };
      const result = ApiConfigSchema.safeParse(config);
      expect(result.success).toBe(true);
    });
  });

  describe('valid granular config', () => {
    it('accepts valid granular config with name/apiKey/baseUrl/mode/env', () => {
      const config = {
        name: 'test-config',
        apiKey: 'sk-test-key-123',
        baseUrl: 'https://api.test.com',
        mode: 'granular',
        env: {
          ANTHROPIC_MODEL: 'claude-3-5-sonnet-20241022',
          ANTHROPIC_AUTH_TOKEN: 'custom-token',
          ANTHROPIC_BASE_URL: 'https://custom.api.com',
        },
      };
      const result = ApiConfigSchema.safeParse(config);
      expect(result.success).toBe(true);
    });

    it('accepts granular config with partial env vars', () => {
      const config = {
        name: 'test-config',
        apiKey: 'sk-test-key-123',
        baseUrl: 'https://api.test.com',
        mode: 'granular',
        env: {
          ANTHROPIC_MODEL: 'glm-5',
          CUSTOM_VAR: 'custom_value',
        },
      };
      const result = ApiConfigSchema.safeParse(config);
      expect(result.success).toBe(true);
    });
  });

  describe('unified mode validation (refine)', () => {
    it('rejects unified config without modelName', () => {
      const config = {
        name: 'test-config',
        apiKey: 'sk-test-key-123',
        baseUrl: 'https://api.test.com',
        mode: 'unified',
        // modelName missing - should fail refine validation
      };
      const result = ApiConfigSchema.safeParse(config);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some(issue =>
          issue.message.includes('unified mode requires modelName')
        )).toBe(true);
      }
    });

    it('rejects unified config with env instead of modelName', () => {
      const config = {
        name: 'test-config',
        apiKey: 'sk-test-key-123',
        baseUrl: 'https://api.test.com',
        mode: 'unified',
        env: { ANTHROPIC_MODEL: 'claude-3' },
        // modelName missing, has env - should fail
      };
      const result = ApiConfigSchema.safeParse(config);
      expect(result.success).toBe(false);
    });
  });

  describe('granular mode validation (refine)', () => {
    it('rejects granular config without env', () => {
      const config = {
        name: 'test-config',
        apiKey: 'sk-test-key-123',
        baseUrl: 'https://api.test.com',
        mode: 'granular',
        // env missing - should fail refine validation
      };
      const result = ApiConfigSchema.safeParse(config);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some(issue =>
          issue.message.includes('granular mode requires env')
        )).toBe(true);
      }
    });

    it('rejects granular config with modelName instead of env', () => {
      const config = {
        name: 'test-config',
        apiKey: 'sk-test-key-123',
        baseUrl: 'https://api.test.com',
        mode: 'granular',
        modelName: 'claude-3',
        // env missing, has modelName - should fail
      };
      const result = ApiConfigSchema.safeParse(config);
      expect(result.success).toBe(false);
    });
  });

  describe('strict validation (reject unknown fields)', () => {
    it('rejects unknown field "unknownField"', () => {
      const config = {
        name: 'test-config',
        apiKey: 'sk-test-key-123',
        baseUrl: 'https://api.test.com',
        mode: 'unified',
        modelName: 'claude-3',
        unknownField: 'not-allowed',
      };
      const result = ApiConfigSchema.safeParse(config);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some(issue =>
          issue.code === 'unrecognized_keys'
        )).toBe(true);
      }
    });

    it('rejects unknown nested fields', () => {
      const config = {
        name: 'test-config',
        apiKey: 'sk-test-key-123',
        baseUrl: 'https://api.test.com',
        mode: 'granular',
        env: { CUSTOM_VAR: 'value' },
        extraField: 'not-allowed',
      };
      const result = ApiConfigSchema.safeParse(config);
      expect(result.success).toBe(false);
    });
  });

  describe('field validation', () => {
    it('rejects missing name', () => {
      const config = {
        apiKey: 'sk-test-key-123',
        baseUrl: 'https://api.test.com',
        mode: 'unified',
        modelName: 'claude-3',
      };
      const result = ApiConfigSchema.safeParse(config);
      expect(result.success).toBe(false);
    });

    it('rejects empty name', () => {
      const config = {
        name: '',
        apiKey: 'sk-test-key-123',
        baseUrl: 'https://api.test.com',
        mode: 'unified',
        modelName: 'claude-3',
      };
      const result = ApiConfigSchema.safeParse(config);
      expect(result.success).toBe(false);
    });

    it('rejects missing apiKey', () => {
      const config = {
        name: 'test-config',
        baseUrl: 'https://api.test.com',
        mode: 'unified',
        modelName: 'claude-3',
      };
      const result = ApiConfigSchema.safeParse(config);
      expect(result.success).toBe(false);
    });

    it('rejects empty apiKey', () => {
      const config = {
        name: 'test-config',
        apiKey: '',
        baseUrl: 'https://api.test.com',
        mode: 'unified',
        modelName: 'claude-3',
      };
      const result = ApiConfigSchema.safeParse(config);
      expect(result.success).toBe(false);
    });

    it('rejects missing baseUrl', () => {
      const config = {
        name: 'test-config',
        apiKey: 'sk-test-key-123',
        mode: 'unified',
        modelName: 'claude-3',
      };
      const result = ApiConfigSchema.safeParse(config);
      expect(result.success).toBe(false);
    });

    it('rejects invalid baseUrl format', () => {
      const config = {
        name: 'test-config',
        apiKey: 'sk-test-key-123',
        baseUrl: 'not-a-valid-url',
        mode: 'unified',
        modelName: 'claude-3',
      };
      const result = ApiConfigSchema.safeParse(config);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some(issue =>
          issue.message.includes('Valid URL required')
        )).toBe(true);
      }
    });

    it('rejects missing mode', () => {
      const config = {
        name: 'test-config',
        apiKey: 'sk-test-key-123',
        baseUrl: 'https://api.test.com',
        modelName: 'claude-3',
      };
      const result = ApiConfigSchema.safeParse(config);
      expect(result.success).toBe(false);
    });
  });

  describe('type inference', () => {
    it('ApiConfig type matches schema output', () => {
      const config = {
        name: 'test-config',
        apiKey: 'sk-test-key-123',
        baseUrl: 'https://api.test.com',
        mode: 'unified' as const,
        modelName: 'claude-3-5-sonnet-20241022',
      };

      const result = ApiConfigSchema.safeParse(config);
      expect(result.success).toBe(true);

      if (result.success) {
        const typed: ApiConfig = result.data;
        expect(typed.name).toBe('test-config');
        expect(typed.apiKey).toBe('sk-test-key-123');
        expect(typed.baseUrl).toBe('https://api.test.com');
        expect(typed.mode).toBe('unified');
        expect(typed.modelName).toBe('claude-3-5-sonnet-20241022');
      }
    });

    it('ApiConfigMode type matches schema output', () => {
      const mode: ApiConfigMode = 'unified';
      const result = ApiConfigModeSchema.safeParse(mode);
      expect(result.success).toBe(true);
      expect(result.data).toBe('unified');
    });

    it('MaskedApiConfig type has apiKey as string', () => {
      const config = {
        name: 'test-config',
        apiKey: 'sk-test-key-123',
        baseUrl: 'https://api.test.com',
        mode: 'unified' as const,
        modelName: 'claude-3-5-sonnet-20241022',
      };

      const result = ApiConfigSchema.safeParse(config);
      expect(result.success).toBe(true);

      if (result.success) {
        const typed: ApiConfig = result.data;
        const masked: MaskedApiConfig = {
          ...typed,
          apiKey: '...-123', // Masked format
        };
        expect(typeof masked.apiKey).toBe('string');
        expect(masked.name).toBe('test-config');
      }
    });
  });
});