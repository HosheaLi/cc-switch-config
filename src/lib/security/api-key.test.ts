/**
 * API Key Security Tests
 *
 * Tests for API key masking and CLI args enforcement.
 * Per CFG-04: API key masked in display contexts.
 * Per SEC-01: CLI args containing apiKey patterns are rejected.
 */

import { describe, it, expect } from 'vitest';
import { maskApiKey, applyMaskedApiKey, validateNoCliApiKey } from './api-key.js';
import { ServiceError } from '../services/types.js';
import type { ApiConfig, MaskedApiConfig } from '../types/api-config.js';

describe('maskApiKey', () => {
  it('returns ...last4 format for keys >= 4 chars', () => {
    expect(maskApiKey('sk-ant-api03-abc123xyz')).toBe('...3xyz');
    expect(maskApiKey('abcdefghijklmnop')).toBe('...mnop');
    expect(maskApiKey('1234567890')).toBe('...7890');
  });

  it('returns **** for keys < 4 chars', () => {
    expect(maskApiKey('abc')).toBe('****');
    expect(maskApiKey('ab')).toBe('****');
    expect(maskApiKey('a')).toBe('****');
  });

  it('returns **** for empty string', () => {
    expect(maskApiKey('')).toBe('****');
  });

  it('handles exactly 4 character keys', () => {
    expect(maskApiKey('abcd')).toBe('...abcd');
    expect(maskApiKey('1234')).toBe('...1234');
  });

  it('masks long API keys correctly', () => {
    const longKey = 'sk-ant-api03-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';
    expect(maskApiKey(longKey)).toBe('...xxxx');
    expect(maskApiKey(longKey).length).toBe(7); // '...' + 4 chars
  });
});

describe('applyMaskedApiKey', () => {
  it('returns MaskedApiConfig with masked apiKey', () => {
    const config: ApiConfig = {
      name: 'test-config',
      apiKey: 'sk-test-12345678',
      baseUrl: 'https://api.example.com',
      mode: 'unified',
      modelName: 'claude-3-opus',
    };

    const masked = applyMaskedApiKey(config);

    expect(masked.apiKey).toBe('...5678');
    expect(masked.name).toBe('test-config');
    expect(masked.baseUrl).toBe('https://api.example.com');
    expect(masked.mode).toBe('unified');
    expect(masked.modelName).toBe('claude-3-opus');
  });

  it('preserves createdAt and updatedAt fields', () => {
    const config: ApiConfig = {
      name: 'test-config',
      apiKey: 'sk-test-abcdefgh',
      baseUrl: 'https://api.example.com',
      mode: 'granular',
      env: { ANTHROPIC_API_KEY: 'sk-test-abcdefgh' },
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-02T00:00:00.000Z',
    };

    const masked = applyMaskedApiKey(config);

    expect(masked.apiKey).toBe('...efgh');
    expect(masked.createdAt).toBe('2026-01-01T00:00:00.000Z');
    expect(masked.updatedAt).toBe('2026-01-02T00:00:00.000Z');
    expect(masked.env).toEqual({ ANTHROPIC_API_KEY: 'sk-test-abcdefgh' });
  });

  it('masks short apiKeys correctly', () => {
    const config: ApiConfig = {
      name: 'short-key',
      apiKey: 'abc',
      baseUrl: 'https://api.example.com',
      mode: 'unified',
      modelName: 'claude-3-opus',
    };

    const masked = applyMaskedApiKey(config);

    expect(masked.apiKey).toBe('****');
  });
});

describe('validateNoCliApiKey', () => {
  it('throws SecurityError for --api-key arg', () => {
    expect(() => validateNoCliApiKey(['--api-key', 'secret123'])).toThrow(ServiceError);
    expect(() => validateNoCliApiKey(['--api-key', 'secret123'])).toThrow(
      'API key cannot be passed via command-line arguments'
    );
  });

  it('throws SecurityError for --apiKey arg', () => {
    expect(() => validateNoCliApiKey(['--apiKey', 'secret123'])).toThrow(ServiceError);
    expect(() => validateNoCliApiKey(['--apiKey', 'secret123'])).toThrow(
      'API key cannot be passed via command-line arguments'
    );
  });

  it('throws SecurityError for -k arg', () => {
    expect(() => validateNoCliApiKey(['-k', 'secret123'])).toThrow(ServiceError);
    expect(() => validateNoCliApiKey(['-k', 'secret123'])).toThrow(
      'API key cannot be passed via command-line arguments'
    );
  });

  it('throws SecurityError for apiKey= substring', () => {
    expect(() => validateNoCliApiKey(['config', 'apiKey=secret123'])).toThrow(ServiceError);
    expect(() => validateNoCliApiKey(['config', 'apiKey=secret123'])).toThrow(
      'API key cannot be passed via command-line arguments'
    );
  });

  it('does not throw for safe args', () => {
    expect(() => validateNoCliApiKey(['--config', 'my-config'])).not.toThrow();
    expect(() => validateNoCliApiKey(['list'])).not.toThrow();
    expect(() => validateNoCliApiKey(['--project', '/path/to/project'])).not.toThrow();
    expect(() => validateNoCliApiKey(['switch', 'my-config'])).not.toThrow();
  });

  it('throws SecurityError with SECURITY_VIOLATION code', () => {
    try {
      validateNoCliApiKey(['--api-key', 'secret123']);
      expect.fail('Should have thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(ServiceError);
      const serviceError = error as ServiceError;
      expect(serviceError.code).toBe('SECURITY_VIOLATION');
    }
  });

  it('detects apiKey pattern anywhere in args', () => {
    expect(() => validateNoCliApiKey(['config', '--api-key', 'secret', 'add'])).toThrow(ServiceError);
    expect(() => validateNoCliApiKey(['--verbose', '--apiKey=secret'])).toThrow(ServiceError);
    expect(() => validateNoCliApiKey(['-k=secret'])).toThrow(ServiceError);
  });
});