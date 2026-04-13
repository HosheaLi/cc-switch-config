/**
 * API Provider Schema Tests
 *
 * Tests for Zod schema validation of API provider and template configurations.
 * Validates AuthType enum, provider config, template config, and strict mode.
 */

import { describe, it, expect } from 'vitest';
import {
  AuthTypeSchema,
  ApiProviderConfigSchema,
  TemplateConfigSchema,
  TemplateStoreSchema,
  type AuthType,
  type ApiProviderConfig,
  type TemplateConfig,
  type TemplateStore,
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

describe('TemplateConfigSchema', () => {
  describe('valid template configs', () => {
    it('accepts minimal template with required fields', () => {
      const template = {
        name: 'my-openrouter',
        provider: {
          name: 'OpenRouter',
          baseUrl: 'https://openrouter.ai/api/v1',
          authType: 'header',
        },
      };
      const result = TemplateConfigSchema.safeParse(template);
      expect(result.success).toBe(true);
    });

    it('accepts template with description', () => {
      const template = {
        name: 'my-openrouter',
        description: 'OpenRouter API template',
        provider: {
          name: 'OpenRouter',
          baseUrl: 'https://openrouter.ai/api/v1',
          authType: 'header',
        },
      };
      const result = TemplateConfigSchema.safeParse(template);
      expect(result.success).toBe(true);
    });

    it('accepts template with tags', () => {
      const template = {
        name: 'my-template',
        provider: {
          name: 'Provider',
          baseUrl: 'https://api.example.com',
          authType: 'token',
        },
        tags: ['ai', 'llm', 'production'],
      };
      const result = TemplateConfigSchema.safeParse(template);
      expect(result.success).toBe(true);
    });

    it('accepts template with timestamps', () => {
      const template = {
        name: 'my-template',
        provider: {
          name: 'Provider',
          baseUrl: 'https://api.example.com',
          authType: 'token',
        },
        createdAt: '2026-04-13T10:00:00Z',
        updatedAt: '2026-04-13T11:00:00Z',
      };
      const result = TemplateConfigSchema.safeParse(template);
      expect(result.success).toBe(true);
    });

    it('accepts template with all optional fields', () => {
      const template = {
        name: 'complete-template',
        description: 'A complete template with all fields',
        provider: {
          name: 'FullProvider',
          baseUrl: 'https://api.example.com',
          authType: 'custom',
          headers: { 'X-API-Key': 'key' },
          env: { CUSTOM_VAR: 'value' },
        },
        tags: ['production', 'custom'],
        createdAt: '2026-04-13T10:00:00Z',
        updatedAt: '2026-04-13T11:00:00Z',
      };
      const result = TemplateConfigSchema.safeParse(template);
      expect(result.success).toBe(true);
    });
  });

  describe('invalid template configs', () => {
    it('rejects template without provider', () => {
      const template = {
        name: 'broken-template',
        description: 'Missing provider',
      };
      const result = TemplateConfigSchema.safeParse(template);
      expect(result.success).toBe(false);
    });

    it('rejects template with invalid nested provider (bad URL)', () => {
      const template = {
        name: 'template',
        provider: {
          name: 'Bad',
          baseUrl: 'invalid-url',
          authType: 'token',
        },
      };
      const result = TemplateConfigSchema.safeParse(template);
      expect(result.success).toBe(false);
    });

    it('rejects template with invalid nested provider (missing authType)', () => {
      const template = {
        name: 'template',
        provider: {
          name: 'Incomplete',
          baseUrl: 'https://api.example.com',
        },
      };
      const result = TemplateConfigSchema.safeParse(template);
      expect(result.success).toBe(false);
    });

    it('rejects template with missing name', () => {
      const template = {
        provider: {
          name: 'Provider',
          baseUrl: 'https://api.example.com',
          authType: 'token',
        },
      };
      const result = TemplateConfigSchema.safeParse(template);
      expect(result.success).toBe(false);
    });

    it('rejects template with empty name', () => {
      const template = {
        name: '',
        provider: {
          name: 'Provider',
          baseUrl: 'https://api.example.com',
          authType: 'token',
        },
      };
      const result = TemplateConfigSchema.safeParse(template);
      expect(result.success).toBe(false);
    });
  });

  describe('strict validation (reject unknown keys)', () => {
    it('rejects unknown field at template level', () => {
      const template = {
        name: 'template',
        provider: {
          name: 'Provider',
          baseUrl: 'https://api.example.com',
          authType: 'token',
        },
        unknownField: 'value',
      };
      const result = TemplateConfigSchema.safeParse(template);
      expect(result.success).toBe(false);
    });
  });
});

describe('TemplateStoreSchema', () => {
  describe('valid store configs', () => {
    it('accepts empty store', () => {
      const store = {
        templates: {},
      };
      const result = TemplateStoreSchema.safeParse(store);
      expect(result.success).toBe(true);
    });

    it('accepts store with single template', () => {
      const store = {
        templates: {
          'my-template': {
            name: 'my-template',
            provider: {
              name: 'Provider',
              baseUrl: 'https://api.example.com',
              authType: 'token',
            },
          },
        },
      };
      const result = TemplateStoreSchema.safeParse(store);
      expect(result.success).toBe(true);
    });

    it('accepts store with multiple templates', () => {
      const store = {
        version: 1,
        templates: {
          'template-1': {
            name: 'template-1',
            provider: {
              name: 'Provider1',
              baseUrl: 'https://api1.example.com',
              authType: 'token',
            },
          },
          'template-2': {
            name: 'template-2',
            provider: {
              name: 'Provider2',
              baseUrl: 'https://api2.example.com',
              authType: 'header',
            },
          },
        },
      };
      const result = TemplateStoreSchema.safeParse(store);
      expect(result.success).toBe(true);
    });
  });

  describe('invalid store configs', () => {
    it('rejects store without templates field', () => {
      const store = {
        version: 1,
      };
      const result = TemplateStoreSchema.safeParse(store);
      expect(result.success).toBe(false);
    });

    it('rejects store with invalid template', () => {
      const store = {
        templates: {
          'bad-template': {
            name: 'bad-template',
            // Missing provider
          },
        },
      };
      const result = TemplateStoreSchema.safeParse(store);
      expect(result.success).toBe(false);
    });
  });

  describe('strict validation', () => {
    it('rejects unknown field at store level', () => {
      const store = {
        templates: {},
        unknownField: 'value',
      };
      const result = TemplateStoreSchema.safeParse(store);
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

  it('TemplateConfig type matches schema output', () => {
    const template = {
      name: 'my-template',
      description: 'Test template',
      provider: {
        name: 'Provider',
        baseUrl: 'https://api.example.com',
        authType: 'token' as const,
      },
      tags: ['test'],
    };

    const result = TemplateConfigSchema.safeParse(template);
    expect(result.success).toBe(true);

    if (result.success) {
      const typed: TemplateConfig = result.data;
      expect(typed.name).toBe('my-template');
      expect(typed.description).toBe('Test template');
      expect(typed.provider.name).toBe('Provider');
      expect(typed.tags).toEqual(['test']);
    }
  });

  it('TemplateStore type matches schema output', () => {
    const store = {
      version: 1,
      templates: {
        'my-template': {
          name: 'my-template',
          provider: {
            name: 'Provider',
            baseUrl: 'https://api.example.com',
            authType: 'token' as const,
          },
        },
      },
    };

    const result = TemplateStoreSchema.safeParse(store);
    expect(result.success).toBe(true);

    if (result.success) {
      const typed: TemplateStore = result.data;
      expect(typed.version).toBe(1);
      expect(typed.templates['my-template'].name).toBe('my-template');
    }
  });

  it('AuthType type matches schema output', () => {
    const authType: AuthType = 'token';
    const result = AuthTypeSchema.safeParse(authType);
    expect(result.success).toBe(true);
    expect(result.data).toBe('token');
  });
});