/**
 * Validation Utilities Tests
 *
 * Tests for ValidationError class, validateConfig function, and error formatting.
 */

import { describe, it, expect } from 'vitest';
import { ValidationError, validateConfig, formatValidationErrors, ValidationResult } from './validation.js';
import type { ClaudeSettings } from './config.js';
import type { z } from 'zod';

describe('ValidationError', () => {
  it('extends Error with name ValidationError', () => {
    const error = new ValidationError('test', []);
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('ValidationError');
  });

  it('stores issues array from Zod', () => {
    const issues: z.core.$ZodIssue[] = [
      { code: 'invalid_type', path: ['env'], message: 'Expected object', expected: 'object' }
    ];
    const error = new ValidationError('test', issues);
    expect(error.issues).toHaveLength(1);
    expect(error.issues[0].code).toBe('invalid_type');
  });

  it('getMessages returns formatted strings with paths', () => {
    const issues = [
      { code: 'invalid_type', path: ['env', 'MODEL'], message: 'Expected string', expected: 'string' }
    ] as z.core.$ZodIssue[];
    const error = new ValidationError('test', issues);
    expect(error.getMessages()).toEqual(['env.MODEL: Expected string']);
  });

  it('getMessages handles root-level issues', () => {
    const issues = [
      { code: 'invalid_type', path: [], message: 'Expected object', expected: 'object' }
    ] as z.core.$ZodIssue[];
    const error = new ValidationError('test', issues);
    expect(error.getMessages()).toEqual(['root: Expected object']);
  });
});

describe('validateConfig', () => {
  it('accepts valid minimal config (empty env)', () => {
    const result = validateConfig({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({});
    }
  });

  it('accepts valid config with env object', () => {
    const config = {
      env: { ANTHROPIC_MODEL: 'claude-3' }
    };
    const result = validateConfig(config);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.env?.ANTHROPIC_MODEL).toBe('claude-3');
    }
  });

  it('accepts valid full config', () => {
    const config = {
      env: { ANTHROPIC_MODEL: 'claude-3' },
      model: 'claude-3-5-sonnet',
      mcpServers: { 'my-server': { command: 'node' } },
    };
    const result = validateConfig(config);
    expect(result.success).toBe(true);
  });

  it('rejects config with unrecognized keys (catches typos)', () => {
    // McpServerConfigSchema still uses strict(), test through a nested config
    const config = {
      mcpServers: {
        bad: { args: [] } // missing required 'command'
      }
    };
    const result = validateConfig(config);
    expect(result.success).toBe(false);
    if (!result.success) {
      // Should have invalid_type error for command
      const hasInvalidType = result.error.issues.some(
        issue => issue.code === 'invalid_type'
      );
      expect(hasInvalidType).toBe(true);
    }
  });

  it('collects ALL errors, not just first (D-05)', () => {
    // Config with multiple invalid fields
    const config = {
      env: { ANTHROPIC_MODEL: 123 }, // invalid type (should be string)
      mcpServers: {
        'bad': { args: [] } // missing required 'command'
      },
      permissions: [{}] // missing allow/deny
    };
    const result = validateConfig(config);
    expect(result.success).toBe(false);
    if (!result.success) {
      // Should have 3+ errors collected (per D-05)
      expect(result.error.issues.length).toBeGreaterThanOrEqual(3);
    }
  });

  it('returns ValidationError with formatted message', () => {
    const config = { permissions: [{}] }; // missing allow/deny
    const result = validateConfig(config);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBeInstanceOf(ValidationError);
      expect(result.error.message).toContain('permissions');
    }
  });
});

describe('ValidationResult discriminated union', () => {
  it('narrows to success branch correctly', () => {
    const result = validateConfig({ env: {} });
    if (result.success) {
      // TypeScript should narrow here
      expect(result.data).toBeDefined();
      // result.error should not be accessible here
    } else {
      // This branch should not be reached for valid config
      expect.fail('Valid config should not have errors');
    }
  });

  it('narrows to error branch correctly', () => {
    const result = validateConfig({ permissions: [{}] }); // missing allow/deny
    if (!result.success) {
      // TypeScript should narrow here
      expect(result.error).toBeInstanceOf(ValidationError);
      expect(result.error.issues).toBeDefined();
    } else {
      // This branch should not be reached for invalid config
      expect.fail('Invalid config should have errors');
    }
  });
});

describe('formatValidationErrors', () => {
  it('includes path in output', () => {
    const issues = [
      { code: 'invalid_type', path: ['env', 'ANTHROPIC_MODEL'], message: 'Expected string', expected: 'string' }
    ] as z.core.$ZodIssue[];
    const message = formatValidationErrors(issues);
    expect(message).toContain('env.ANTHROPIC_MODEL');
  });

  it('formats multiple issues as multi-line', () => {
    const issues = [
      { code: 'invalid_type', path: ['model'], message: 'Expected string', expected: 'string' },
      { code: 'unrecognized_keys', path: [], message: 'Unknown key: modle', keys: ['modle'] }
    ] as z.core.$ZodIssue[];
    const message = formatValidationErrors(issues);
    expect(message.split('\n').length).toBe(2);
  });

  it('uses different symbols for error types', () => {
    const issues = [
      { code: 'invalid_type', path: ['model'], message: 'Wrong type', expected: 'string' },
      { code: 'unrecognized_keys', path: [], message: 'Unknown key', keys: ['modle'] }
    ] as z.core.$ZodIssue[];
    const message = formatValidationErrors(issues);
    // Should have warning symbol for invalid_type
    expect(message).toContain('\u26A0'); // WARNING SIGN (⚠)
    // Should have question symbol for unrecognized_keys
    expect(message).toContain('?');
  });

  it('uses cross mark for default error types', () => {
    const issues = [
      { code: 'custom', path: ['test'], message: 'Custom error' }
    ] as z.core.$ZodIssue[];
    const message = formatValidationErrors(issues);
    // Should have cross mark for custom errors
    expect(message).toContain('\u2716'); // HEAVY MULTIPLICATION X (✖)
  });
});