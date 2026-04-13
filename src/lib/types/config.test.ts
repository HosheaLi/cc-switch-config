/**
 * ClaudeSettings Schema Tests
 *
 * Tests for Zod schema validation of Claude Code configuration.
 * Validates strict mode, required fields, type inference, and refinements.
 */

import { describe, it, expect } from 'vitest';
import {
  ClaudeSettingsSchema,
  EnvConfigSchema,
  McpServerConfigSchema,
  PermissionRuleSchema,
  HookConfigSchema,
} from './config.js';

describe('ClaudeSettingsSchema', () => {
  describe('valid configs', () => {
    it('accepts minimal empty config', () => {
      const result = ClaudeSettingsSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('accepts config with version field', () => {
      const result = ClaudeSettingsSchema.safeParse({ version: 1 });
      expect(result.success).toBe(true);
    });

    it('accepts config with env variables', () => {
      const config = {
        env: {
          ANTHROPIC_MODEL: 'claude-3-5-sonnet',
          ANTHROPIC_BASE_URL: 'https://api.anthropic.com',
        },
      };
      const result = ClaudeSettingsSchema.safeParse(config);
      expect(result.success).toBe(true);
    });

    it('accepts full config with all fields', () => {
      const config = {
        version: 1,
        env: { ANTHROPIC_MODEL: 'claude-3' },
        model: 'claude-3-5-sonnet',
        mcpServers: {
          'my-server': {
            command: 'node',
            args: ['server.js'],
          },
        },
        permissions: [{ allow: 'Read(*)' }],
        hooks: [{ match: 'PreToolUse', run: 'echo test' }],
      };
      const result = ClaudeSettingsSchema.safeParse(config);
      expect(result.success).toBe(true);
    });

    it('accepts mcpServers with arbitrary server names', () => {
      const config = {
        mcpServers: {
          'custom-server-name': { command: 'node' },
          'another-server': { command: 'python' },
          'special_chars_123': { command: 'bash' },
        },
      };
      const result = ClaudeSettingsSchema.safeParse(config);
      expect(result.success).toBe(true);
    });

    it('accepts optional version field as integer', () => {
      const result = ClaudeSettingsSchema.safeParse({ version: 2 });
      expect(result.success).toBe(true);
    });
  });

  describe('strict validation (reject unknown keys)', () => {
    it('rejects unknown keys like typo "modle"', () => {
      const result = ClaudeSettingsSchema.safeParse({ modle: 'claude-3' });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some(i => i.code === 'unrecognized_keys')).toBe(true);
      }
    });

    it('rejects unknown nested keys', () => {
      const config = {
        mcpServers: {
          'my-server': {
            command: 'node',
            unknownField: 'value',
          },
        },
      };
      const result = ClaudeSettingsSchema.safeParse(config);
      expect(result.success).toBe(false);
    });
  });
});

describe('McpServerConfigSchema', () => {
  describe('valid configs', () => {
    it('requires command field', () => {
      const result = McpServerConfigSchema.safeParse({ command: 'node' });
      expect(result.success).toBe(true);
    });

    it('accepts optional args', () => {
      const result = McpServerConfigSchema.safeParse({
        command: 'node',
        args: ['server.js', '--port', '3000'],
      });
      expect(result.success).toBe(true);
    });

    it('accepts optional env', () => {
      const result = McpServerConfigSchema.safeParse({
        command: 'node',
        env: { NODE_ENV: 'production' },
      });
      expect(result.success).toBe(true);
    });

    it('accepts optional disabled', () => {
      const result = McpServerConfigSchema.safeParse({
        command: 'node',
        disabled: true,
      });
      expect(result.success).toBe(true);
    });

    it('accepts all optional fields together', () => {
      const result = McpServerConfigSchema.safeParse({
        command: 'node',
        args: ['server.js'],
        env: { PORT: '3000' },
        disabled: false,
      });
      expect(result.success).toBe(true);
    });
  });

  describe('invalid configs', () => {
    it('rejects missing command field', () => {
      const result = McpServerConfigSchema.safeParse({ args: ['server.js'] });
      expect(result.success).toBe(false);
    });

    it('rejects unknown fields', () => {
      const result = McpServerConfigSchema.safeParse({
        command: 'node',
        unknownOption: true,
      });
      expect(result.success).toBe(false);
    });
  });
});

describe('PermissionRuleSchema', () => {
  describe('valid configs', () => {
    it('accepts allow rule', () => {
      const result = PermissionRuleSchema.safeParse({ allow: 'Read(*)' });
      expect(result.success).toBe(true);
    });

    it('accepts deny rule', () => {
      const result = PermissionRuleSchema.safeParse({ deny: 'Write(*)' });
      expect(result.success).toBe(true);
    });

    it('accepts both allow and deny', () => {
      const result = PermissionRuleSchema.safeParse({
        allow: 'Read(*)',
        deny: 'Write(secrets/*)',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('invalid configs', () => {
    it('rejects rule with neither allow nor deny', () => {
      const result = PermissionRuleSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it('rejects unknown fields', () => {
      const result = PermissionRuleSchema.safeParse({
        allow: 'Read(*)',
        unknown: 'field',
      });
      expect(result.success).toBe(false);
    });
  });
});

describe('HookConfigSchema', () => {
  describe('valid configs', () => {
    it('requires match and run fields', () => {
      const result = HookConfigSchema.safeParse({
        match: 'PreToolUse',
        run: 'echo test',
      });
      expect(result.success).toBe(true);
    });

    it('accepts optional timeout', () => {
      const result = HookConfigSchema.safeParse({
        match: 'PreToolUse',
        run: 'echo test',
        timeout: 5000,
      });
      expect(result.success).toBe(true);
    });
  });

  describe('invalid configs', () => {
    it('rejects missing match field', () => {
      const result = HookConfigSchema.safeParse({ run: 'echo test' });
      expect(result.success).toBe(false);
    });

    it('rejects missing run field', () => {
      const result = HookConfigSchema.safeParse({ match: 'PreToolUse' });
      expect(result.success).toBe(false);
    });

    it('rejects unknown fields', () => {
      const result = HookConfigSchema.safeParse({
        match: 'PreToolUse',
        run: 'echo test',
        unknown: 'field',
      });
      expect(result.success).toBe(false);
    });

    it('rejects negative timeout', () => {
      const result = HookConfigSchema.safeParse({
        match: 'PreToolUse',
        run: 'echo test',
        timeout: -100,
      });
      expect(result.success).toBe(false);
    });
  });
});

describe('EnvConfigSchema', () => {
  describe('valid configs', () => {
    it('accepts ANTHROPIC_MODEL', () => {
      const result = EnvConfigSchema.safeParse({ ANTHROPIC_MODEL: 'claude-3-5-sonnet' });
      expect(result.success).toBe(true);
    });

    it('accepts ANTHROPIC_BASE_URL with valid URL format', () => {
      const result = EnvConfigSchema.safeParse({
        ANTHROPIC_BASE_URL: 'https://api.anthropic.com',
      });
      expect(result.success).toBe(true);
    });

    it('accepts ANTHROPIC_AUTH_TOKEN', () => {
      const result = EnvConfigSchema.safeParse({ ANTHROPIC_AUTH_TOKEN: 'sk-ant-xxx' });
      expect(result.success).toBe(true);
    });

    it('accepts all three fields together', () => {
      const result = EnvConfigSchema.safeParse({
        ANTHROPIC_MODEL: 'claude-3-5-sonnet',
        ANTHROPIC_BASE_URL: 'https://api.anthropic.com',
        ANTHROPIC_AUTH_TOKEN: 'sk-ant-xxx',
      });
      expect(result.success).toBe(true);
    });

    it('passthrough allows arbitrary env vars', () => {
      const result = EnvConfigSchema.safeParse({
        ANTHROPIC_MODEL: 'claude-3',
        CUSTOM_VAR: 'value',
        NODE_ENV: 'production',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('invalid configs', () => {
    it('rejects invalid URL format for ANTHROPIC_BASE_URL', () => {
      const result = EnvConfigSchema.safeParse({
        ANTHROPIC_BASE_URL: 'not-a-valid-url',
      });
      expect(result.success).toBe(false);
    });
  });
});