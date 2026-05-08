/**
 * API Provider Schema Tests
 *
 * Tests for Zod schema validation of API provider configurations.
 * Validates AuthType enum, provider config, and strict mode.
 */

import { describe, it, expect } from 'vitest';
import {
  AuthTypeSchema,
  ApiProviderConfigSchema,
  type AuthType,
  type ApiProviderConfig,
} from './provider.js';

describe('AuthTypeSchema', () => {
  describe('valid auth types', () => {
    it('accepts "token" auth type', () => {
      expect(AuthTypeSchema.parse('token')).toBe('token');
    });

    it('accepts "header" auth type', () => {
      expect(AuthTypeSchema.parse('header')).toBe('header');
    });

    it('accepts "custom" auth type', () => {
      expect(AuthTypeSchema.parse('custom')).toBe('custom');
    });
  });

  describe('invalid auth types', () => {
    it('rejects "oauth" auth type', () => {
      const result = AuthTypeSchema.safeParse('oauth');
      expect(result.success).toBe(false);
    });

    it('rejects "basic" auth type', () => {
      const result = AuthTypeSchema.safeParse('basic');
      expect(result.success).toBe(false);
    });

    it('rejects empty string', () => {
      const result = AuthTypeSchema.safeParse('');
      expect(result.success).toBe(false);
    });

    it('rejects null', () => {
      const result = AuthTypeSchema.safeParse(null);
      expect(result.success).toBe(false);
    });

    it('rejects undefined', () => {
      const result = AuthTypeSchema.safeParse(undefined);
      expect(result.success).toBe(false);
    });
  });
});

describe('ApiProviderConfigSchema', () => {
  describe('valid provider configs', () => {
    it('accepts minimal provider config with required fields', () => {
      const config = {
        name: 'OpenRouter',
        baseUrl: 'https://openrouter.ai/api/v1',
        authType: 'header',
      };
      const result = ApiProviderConfigSchema.safeParse(config);
      expect(result.success).toBe(true);
    });

    it('accepts provider with token auth type', () => {
      const config = {
        name: 'Anthropic',
        baseUrl: 'https://api.anthropic.com',
        authType: 'token',
      };
      const result = ApiProviderConfigSchema.safeParse(config);
      expect(result.success).toBe(true);
    });

    it('accepts provider with custom auth type', () => {
      const config = {
        name: 'CustomProvider',
        baseUrl: 'https://custom.api.com',
        authType: 'custom',
      };
      const result = ApiProviderConfigSchema.safeParse(config);
      expect(result.success).toBe(true);
    });

    it('accepts provider with optional headers', () => {
      const config = {
        name: 'OpenRouter',
        baseUrl: 'https://openrouter.ai/api/v1',
        authType: 'header',
        headers: {
          'Authorization': 'Bearer key',
          'X-Custom-Header': 'value',
        },
      };
      const result = ApiProviderConfigSchema.safeParse(config);
      expect(result.success).toBe(true);
    });

    it('accepts provider with optional env vars', () => {
      const config = {
        name: 'Provider',
        baseUrl: 'https://api.example.com',
        authType: 'token',
        env: {
          CUSTOM_VAR: 'custom_value',
          ANOTHER_VAR: 'another_value',
        },
      };
      const result = ApiProviderConfigSchema.safeParse(config);
      expect(result.success).toBe(true);
    });

    it('accepts provider with both headers and env', () => {
      const config = {
        name: 'FullProvider',
        baseUrl: 'https://api.example.com',
        authType: 'header',
        headers: { 'X-API-Key': 'key' },
        env: { CUSTOM_VAR: 'value' },
      };
      const result = ApiProviderConfigSchema.safeParse(config);
      expect(result.success).toBe(true);
    });
  });

  describe('invalid provider configs', () => {
    it('rejects invalid URL format', () => {
      const config = {
        name: 'BadProvider',
        baseUrl: 'not-a-url',
        authType: 'token',
      };
      const result = ApiProviderConfigSchema.safeParse(config);
      expect(result.success).toBe(false);
    });

    it('rejects missing name', () => {
      const config = {
        baseUrl: 'https://api.example.com',
        authType: 'token',
      };
      const result = ApiProviderConfigSchema.safeParse(config);
      expect(result.success).toBe(false);
    });

    it('rejects empty name', () => {
      const config = {
        name: '',
        baseUrl: 'https://api.example.com',
        authType: 'token',
      };
      const result = ApiProviderConfigSchema.safeParse(config);
      expect(result.success).toBe(false);
    });

    it('rejects missing baseUrl', () => {
      const config = {
        name: 'Provider',
        authType: 'token',
      };
      const result = ApiProviderConfigSchema.safeParse(config);
      expect(result.success).toBe(false);
    });

    it('rejects missing authType', () => {
      const config = {
        name: 'Provider',
        baseUrl: 'https://api.example.com',
      };
      const result = ApiProviderConfigSchema.safeParse(config);
      expect(result.success).toBe(false);
    });

    it('rejects invalid authType value', () => {
      const config = {
        name: 'Provider',
        baseUrl: 'https://api.example.com',
        authType: 'invalid',
      };
      const result = ApiProviderConfigSchema.safeParse(config);
      expect(result.success).toBe(false);
    });
  });

  describe('strict validation (reject unknown keys)', () => {
    it('rejects unknown field at provider level', () => {
      const config = {
        name: 'Provider',
        baseUrl: 'https://api.example.com',
        authType: 'token',
        unknownField: 'value',
      };
      const result = ApiProviderConfigSchema.safeParse(config);
      expect(result.success).toBe(false);
    });

    it('rejects unknown nested field in headers', () => {
      // Note: headers is a record, so unknown keys are allowed within it
      // But unknown fields at provider level are rejected
      const config = {
        name: 'Provider',
        baseUrl: 'https://api.example.com',
        authType: 'token',
        extraField: 'not-allowed',
      };
      const result = ApiProviderConfigSchema.safeParse(config);
      expect(result.success).toBe(false);
    });
  });
});

describe('type inference', () => {
  it('ApiProviderConfig type matches schema output', () => {
    const config = {
      name: 'OpenRouter',
      baseUrl: 'https://openrouter.ai/api/v1',
      authType: 'header' as const,
      headers: { Authorization: 'Bearer key' },
    };

    const result = ApiProviderConfigSchema.safeParse(config);
    expect(result.success).toBe(true);

    if (result.success) {
      const typed: ApiProviderConfig = result.data;
      expect(typed.name).toBe('OpenRouter');
      expect(typed.baseUrl).toBe('https://openrouter.ai/api/v1');
      expect(typed.authType).toBe('header');
      expect(typed.headers?.Authorization).toBe('Bearer key');
    }
  });

  it('AuthType type matches schema output', () => {
    const authType: AuthType = 'token';
    const result = AuthTypeSchema.safeParse(authType);
    expect(result.success).toBe(true);
    expect(result.data).toBe('token');
  });
});