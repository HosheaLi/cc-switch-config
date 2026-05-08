/**
 * Select API Config Component Tests
 *
 * Per D-03: SelectApiConfig prompts user to choose API configuration.
 * Per TUI-04: Autocomplete for >5 configs, select for <=5.
 * Per TUI-05: Ctrl+C returns null (cancellation).
 *
 * Test coverage:
 * - Empty configs warning
 * - Single config selection
 * - Multiple configs (autocomplete vs select)
 * - Cancellation handling
 * - Description format (modelName @ baseUrl, NO API key exposure)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import prompts from 'prompts';

// Types
import type { ApiConfig } from '../../lib/types/api-config.js';

// Target function
import { selectApiConfig } from './select-api-config.js';

// Mock prompts
vi.mock('prompts', () => ({
  default: vi.fn(),
}));

// Mock promptWithCancel
vi.mock('../utils/handle-cancel.js', () => ({
  promptWithCancel: vi.fn(),
  defaultOnCancel: vi.fn(),
}));

// Mock getPromptType and createFuzzySuggest
vi.mock('../utils/autocomplete.js', () => ({
  getPromptType: vi.fn((count: number) => count > 5 ? 'autocomplete' : 'select'),
  createFuzzySuggest: vi.fn(() => async () => []),
}));

// Mock theme/colors
vi.mock('../../theme/index.js', () => ({
  colors: {
    warning: vi.fn((str: string) => str),
    muted: vi.fn((str: string) => str),
  },
}));

// Import mocked modules after mocking
import { promptWithCancel } from '../utils/handle-cancel.js';
import { getPromptType } from '../utils/autocomplete.js';
import { colors } from '../../theme/index.js';

describe('selectApiConfig', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  // ========================================
  // Empty configs warning
  // ========================================
  describe('empty configs', () => {
    it('shows warning message when configs empty', async () => {
      const result = await selectApiConfig({});

      expect(result).toBeNull();
      expect(consoleLogSpy).toHaveBeenCalled();
      const output = consoleLogSpy.mock.calls.map(c => c[0]).join('\n');
      expect(output).toContain('没有可用配置');
    });

    it('shows hint to create config', async () => {
      const result = await selectApiConfig({});

      expect(result).toBeNull();
      const output = consoleLogSpy.mock.calls.map(c => c[0]).join('\n');
      expect(output).toContain('cc-config config add');
    });

    it('returns null immediately for empty array', async () => {
      const result = await selectApiConfig({});

      expect(result).toBeNull();
      // Should not call promptWithCancel for empty configs
      expect(promptWithCancel).not.toHaveBeenCalled();
    });

    it('uses warning color for message', async () => {
      vi.mocked(colors.warning).mockReturnValue('WARNING_MSG');

      await selectApiConfig({});

      expect(colors.warning).toHaveBeenCalled();
    });
  });

  // ========================================
  // Single config selection
  // ========================================
  describe('single config', () => {
    it('shows selection UI even for single config', async () => {
      const configs: Record<string, ApiConfig> = {
        'test-config': {
          name: 'test-config',
          apiKey: 'secret-key',
          baseUrl: 'https://api.example.com',
          mode: 'unified',
          modelName: 'claude-3-sonnet',
        },
      };

      vi.mocked(promptWithCancel).mockResolvedValueOnce({ value: 'test-config', cancelled: false });

      await selectApiConfig(configs);

      // Should still call promptWithCancel (not auto-select)
      expect(promptWithCancel).toHaveBeenCalled();
    });

    it('does not auto-select single config', async () => {
      const configs: Record<string, ApiConfig> = {
        'single': {
          name: 'single',
          apiKey: 'key',
          baseUrl: 'https://api.example.com',
          mode: 'unified',
          modelName: 'claude-3',
        },
      };

      // User cancels the prompt
      vi.mocked(promptWithCancel).mockResolvedValueOnce({ value: null, cancelled: true });

      const result = await selectApiConfig(configs);

      // Should return null (user cancelled), not auto-select 'single'
      expect(result).toBeNull();
    });

    it('user must press Enter to confirm', async () => {
      const configs: Record<string, ApiConfig> = {
        'default': {
          name: 'default',
          apiKey: 'key',
          baseUrl: 'https://api.anthropic.com',
          mode: 'unified',
          modelName: 'claude-3',
        },
      };

      vi.mocked(promptWithCancel).mockResolvedValueOnce({ value: 'default', cancelled: false });

      await selectApiConfig(configs);

      // promptWithCancel should be called with initial: 0 (first item selected)
      const callArg = vi.mocked(promptWithCancel).mock.calls[0][0];
      expect(callArg.initial).toBe(0);
    });

    it('shows config name and description', async () => {
      const configs: Record<string, ApiConfig> = {
        'my-config': {
          name: 'my-config',
          apiKey: 'secret',
          baseUrl: 'https://api.anthropic.com',
          mode: 'unified',
          modelName: 'claude-3-opus',
        },
      };

      vi.mocked(promptWithCancel).mockResolvedValueOnce({ value: 'my-config', cancelled: false });

      await selectApiConfig(configs);

      const callArg = vi.mocked(promptWithCancel).mock.calls[0][0];
      expect(callArg.choices).toBeDefined();
      expect(callArg.choices).toHaveLength(1);
      expect(callArg.choices[0].title).toBe('my-config');
      expect(callArg.choices[0].value).toBe('my-config');
      expect(callArg.choices[0].description).toContain('claude-3-opus');
    });
  });

  // ========================================
  // Multiple configs
  // ========================================
  describe('multiple configs', () => {
    it('uses select for <=5 configs', async () => {
      const configs: Record<string, ApiConfig> = {};
      for (let i = 1; i <= 5; i++) {
        configs[`config-${i}`] = {
          name: `config-${i}`,
          apiKey: `key-${i}`,
          baseUrl: `https://api.example.com`,
          mode: 'unified',
          modelName: `model-${i}`,
        };
      }

      vi.mocked(promptWithCancel).mockResolvedValueOnce({ value: 'config-1', cancelled: false });

      await selectApiConfig(configs);

      expect(getPromptType).toHaveBeenCalledWith(5);
      const callArg = vi.mocked(promptWithCancel).mock.calls[0][0];
      expect(callArg.type).toBe('select');
    });

    it('uses autocomplete for >5 configs', async () => {
      const configs: Record<string, ApiConfig> = {};
      for (let i = 1; i <= 10; i++) {
        configs[`config-${i}`] = {
          name: `config-${i}`,
          apiKey: `key-${i}`,
          baseUrl: 'https://api.example.com',
          mode: 'unified',
          modelName: `model-${i}`,
        };
      }

      vi.mocked(promptWithCancel).mockResolvedValueOnce({ value: 'config-1', cancelled: false });

      await selectApiConfig(configs);

      expect(getPromptType).toHaveBeenCalledWith(10);
      const callArg = vi.mocked(promptWithCancel).mock.calls[0][0];
      expect(callArg.type).toBe('autocomplete');
    });

    it('shows numbered list for select mode', async () => {
      const configs: Record<string, ApiConfig> = {
        'alpha': {
          name: 'alpha',
          apiKey: 'k1',
          baseUrl: 'https://api1.com',
          mode: 'unified',
          modelName: 'model-a',
        },
        'beta': {
          name: 'beta',
          apiKey: 'k2',
          baseUrl: 'https://api2.com',
          mode: 'unified',
          modelName: 'model-b',
        },
      };

      vi.mocked(promptWithCancel).mockResolvedValueOnce({ value: 'alpha', cancelled: false });

      await selectApiConfig(configs);

      const callArg = vi.mocked(promptWithCancel).mock.calls[0][0];
      expect(callArg.choices).toHaveLength(2);
    });

    it('preserves original order in choices', async () => {
      const configs: Record<string, ApiConfig> = {
        'first': {
          name: 'first',
          apiKey: 'k1',
          baseUrl: 'https://api1.com',
          mode: 'unified',
          modelName: 'model-1',
        },
        'second': {
          name: 'second',
          apiKey: 'k2',
          baseUrl: 'https://api2.com',
          mode: 'unified',
          modelName: 'model-2',
        },
        'third': {
          name: 'third',
          apiKey: 'k3',
          baseUrl: 'https://api3.com',
          mode: 'unified',
          modelName: 'model-3',
        },
      };

      vi.mocked(promptWithCancel).mockResolvedValueOnce({ value: 'first', cancelled: false });

      await selectApiConfig(configs);

      const callArg = vi.mocked(promptWithCancel).mock.calls[0][0];
      const names = callArg.choices.map((c: any) => c.value);
      expect(names).toEqual(['first', 'second', 'third']);
    });
  });

  // ========================================
  // Cancellation handling
  // ========================================
  describe('cancellation', () => {
    it('Ctrl+C returns null', async () => {
      const configs: Record<string, ApiConfig> = {
        'test': {
          name: 'test',
          apiKey: 'key',
          baseUrl: 'https://api.example.com',
          mode: 'unified',
          modelName: 'claude-3',
        },
      };

      vi.mocked(promptWithCancel).mockResolvedValueOnce({ value: null, cancelled: true });

      const result = await selectApiConfig(configs);

      expect(result).toBeNull();
    });

    it('cancelled flag is true on cancel', async () => {
      const configs: Record<string, ApiConfig> = {
        'test': {
          name: 'test',
          apiKey: 'key',
          baseUrl: 'https://api.example.com',
          mode: 'unified',
          modelName: 'claude-3',
        },
      };

      vi.mocked(promptWithCancel).mockResolvedValueOnce({ value: null, cancelled: true });

      const result = await selectApiConfig(configs);

      expect(result).toBeNull();
      expect(promptWithCancel).toHaveBeenCalled();
      const promptResult = await vi.mocked(promptWithCancel).mock.results[0].value;
      expect(promptResult.cancelled).toBe(true);
    });

    it('no config selected on cancel', async () => {
      const configs: Record<string, ApiConfig> = {
        'config-a': {
          name: 'config-a',
          apiKey: 'key',
          baseUrl: 'https://api.example.com',
          mode: 'unified',
          modelName: 'claude-3',
        },
      };

      vi.mocked(promptWithCancel).mockResolvedValueOnce({ value: null, cancelled: true });

      const result = await selectApiConfig(configs);

      expect(result).toBeNull();
    });
  });

  // ========================================
  // Description format (CFG-04: NO API key exposure)
  // ========================================
  describe('description format', () => {
    it('shows modelName @ baseUrl in description', async () => {
      const configs: Record<string, ApiConfig> = {
        'prod': {
          name: 'prod',
          apiKey: 'sk-ant-secret-key-123',
          baseUrl: 'https://api.anthropic.com',
          mode: 'unified',
          modelName: 'claude-3-opus',
        },
      };

      vi.mocked(promptWithCancel).mockResolvedValueOnce({ value: 'prod', cancelled: false });

      await selectApiConfig(configs);

      const callArg = vi.mocked(promptWithCancel).mock.calls[0][0];
      expect(callArg.choices[0].description).toContain('claude-3-opus');
      expect(callArg.choices[0].description).toContain('https://api.anthropic.com');
    });

    it('hides API key from description (CFG-04)', async () => {
      const configs: Record<string, ApiConfig> = {
        'secure': {
          name: 'secure',
          apiKey: 'sk-ant-api03-very-secret-key-abc123xyz',
          baseUrl: 'https://api.anthropic.com',
          mode: 'unified',
          modelName: 'claude-3',
        },
      };

      vi.mocked(promptWithCancel).mockResolvedValueOnce({ value: 'secure', cancelled: false });

      await selectApiConfig(configs);

      const callArg = vi.mocked(promptWithCancel).mock.calls[0][0];
      const description = callArg.choices[0].description;

      // API key must NOT appear in description
      expect(description).not.toContain('sk-ant-api03-very-secret-key-abc123xyz');
      expect(description).not.toContain('secret');
      expect(description).not.toContain('apiKey');
    });

    it('shows granular mode as "granular" in description', async () => {
      const configs: Record<string, ApiConfig> = {
        'advanced': {
          name: 'advanced',
          apiKey: 'key',
          baseUrl: 'https://api.example.com',
          mode: 'granular',
          env: { ANTHROPIC_API_KEY: 'key', MODEL: 'claude-3' },
        },
      };

      vi.mocked(promptWithCancel).mockResolvedValueOnce({ value: 'advanced', cancelled: false });

      await selectApiConfig(configs);

      const callArg = vi.mocked(promptWithCancel).mock.calls[0][0];
      expect(callArg.choices[0].description).toContain('granular');
    });

    it('format is modelName @ baseUrl', async () => {
      const configs: Record<string, ApiConfig> = {
        'my-config': {
          name: 'my-config',
          apiKey: 'secret',
          baseUrl: 'https://api.custom.com',
          mode: 'unified',
          modelName: 'claude-3-sonnet',
        },
      };

      vi.mocked(promptWithCancel).mockResolvedValueOnce({ value: 'my-config', cancelled: false });

      await selectApiConfig(configs);

      const callArg = vi.mocked(promptWithCancel).mock.calls[0][0];
      const description = callArg.choices[0].description;

      // Format should be "modelName @ baseUrl"
      expect(description).toMatch(/claude-3-sonnet\s*@\s*https:\/\/api\.custom\.com/);
    });
  });

  // ========================================
  // Choice structure
  // ========================================
  describe('choice structure', () => {
    it('title is config name', async () => {
      const configs: Record<string, ApiConfig> = {
        'my-production-config': {
          name: 'my-production-config',
          apiKey: 'key',
          baseUrl: 'https://api.anthropic.com',
          mode: 'unified',
          modelName: 'claude-3',
        },
      };

      vi.mocked(promptWithCancel).mockResolvedValueOnce({ value: 'my-production-config', cancelled: false });

      await selectApiConfig(configs);

      const callArg = vi.mocked(promptWithCancel).mock.calls[0][0];
      expect(callArg.choices[0].title).toBe('my-production-config');
    });

    it('value is config name', async () => {
      const configs: Record<string, ApiConfig> = {
        'dev-config': {
          name: 'dev-config',
          apiKey: 'key',
          baseUrl: 'https://api.anthropic.com',
          mode: 'unified',
          modelName: 'claude-3',
        },
      };

      vi.mocked(promptWithCancel).mockResolvedValueOnce({ value: 'dev-config', cancelled: false });

      await selectApiConfig(configs);

      const callArg = vi.mocked(promptWithCancel).mock.calls[0][0];
      expect(callArg.choices[0].value).toBe('dev-config');
    });

    it('choices array preserves key order from Record', async () => {
      const configs: Record<string, ApiConfig> = {
        'alpha': {
          name: 'alpha',
          apiKey: 'k1',
          baseUrl: 'https://api1.com',
          mode: 'unified',
          modelName: 'm1',
        },
        'beta': {
          name: 'beta',
          apiKey: 'k2',
          baseUrl: 'https://api2.com',
          mode: 'unified',
          modelName: 'm2',
        },
        'gamma': {
          name: 'gamma',
          apiKey: 'k3',
          baseUrl: 'https://api3.com',
          mode: 'unified',
          modelName: 'm3',
        },
      };

      vi.mocked(promptWithCancel).mockResolvedValueOnce({ value: 'alpha', cancelled: false });

      await selectApiConfig(configs);

      const callArg = vi.mocked(promptWithCancel).mock.calls[0][0];
      const names = callArg.choices.map((c: any) => c.value);
      expect(names).toEqual(['alpha', 'beta', 'gamma']);
    });
  });

  // ========================================
  // Edge cases
  // ========================================
  describe('edge cases', () => {
    it('handles config without modelName (granular mode)', async () => {
      const configs: Record<string, ApiConfig> = {
        'granular-config': {
          name: 'granular-config',
          apiKey: 'key',
          baseUrl: 'https://api.example.com',
          mode: 'granular',
          env: { ANTHROPIC_API_KEY: 'key', MODEL: 'claude-3' },
        },
      };

      vi.mocked(promptWithCancel).mockResolvedValueOnce({ value: 'granular-config', cancelled: false });

      await selectApiConfig(configs);

      const callArg = vi.mocked(promptWithCancel).mock.calls[0][0];
      expect(callArg.choices[0].description).toContain('granular');
    });

    it('handles config without baseUrl gracefully', async () => {
      // This shouldn't happen per schema validation, but test edge case
      const configs: Record<string, ApiConfig> = {
        'no-base': {
          name: 'no-base',
          apiKey: 'key',
          baseUrl: '', // Empty string (invalid per schema but edge case)
          mode: 'unified',
          modelName: 'claude-3',
        },
      };

      vi.mocked(promptWithCancel).mockResolvedValueOnce({ value: 'no-base', cancelled: false });

      await selectApiConfig(configs);

      const callArg = vi.mocked(promptWithCancel).mock.calls[0][0];
      expect(callArg.choices[0].description).toBeDefined();
    });

    it('handles very long config names', async () => {
      const longName = 'very-long-config-name-that-exceeds-normal-length-for-testing-purposes';
      const configs: Record<string, ApiConfig> = {
        [longName]: {
          name: longName,
          apiKey: 'key',
          baseUrl: 'https://api.anthropic.com',
          mode: 'unified',
          modelName: 'claude-3',
        },
      };

      vi.mocked(promptWithCancel).mockResolvedValueOnce({ value: longName, cancelled: false });

      const result = await selectApiConfig(configs);

      expect(result).toBe(longName);
    });

    it('handles special characters in name', async () => {
      const configs: Record<string, ApiConfig> = {
        'config-with-dash_and_underscore': {
          name: 'config-with-dash_and_underscore',
          apiKey: 'key',
          baseUrl: 'https://api.anthropic.com',
          mode: 'unified',
          modelName: 'claude-3',
        },
      };

      vi.mocked(promptWithCancel).mockResolvedValueOnce({ value: 'config-with-dash_and_underscore', cancelled: false });

      const result = await selectApiConfig(configs);

      expect(result).toBe('config-with-dash_and_underscore');
    });
  });

  // ========================================
  // Return value
  // ========================================
  describe('return value', () => {
    it('returns selected config name on success', async () => {
      const configs: Record<string, ApiConfig> = {
        'selected': {
          name: 'selected',
          apiKey: 'key',
          baseUrl: 'https://api.example.com',
          mode: 'unified',
          modelName: 'claude-3',
        },
      };

      vi.mocked(promptWithCancel).mockResolvedValueOnce({ value: 'selected', cancelled: false });

      const result = await selectApiConfig(configs);

      expect(result).toBe('selected');
    });

    it('returns null on cancellation', async () => {
      const configs: Record<string, ApiConfig> = {
        'test': {
          name: 'test',
          apiKey: 'key',
          baseUrl: 'https://api.example.com',
          mode: 'unified',
          modelName: 'claude-3',
        },
      };

      vi.mocked(promptWithCancel).mockResolvedValueOnce({ value: null, cancelled: true });

      const result = await selectApiConfig(configs);

      expect(result).toBeNull();
    });

    it('returns null on empty configs', async () => {
      const result = await selectApiConfig({});

      expect(result).toBeNull();
    });

    it('returns Promise<string | null>', async () => {
      const configs: Record<string, ApiConfig> = {
        'test': {
          name: 'test',
          apiKey: 'key',
          baseUrl: 'https://api.example.com',
          mode: 'unified',
          modelName: 'claude-3',
        },
      };

      vi.mocked(promptWithCancel).mockResolvedValueOnce({ value: 'test', cancelled: false });

      const result = selectApiConfig(configs);

      expect(result).toBeInstanceOf(Promise);
      const resolved = await result;
      expect(typeof resolved === 'string' || resolved === null).toBe(true);
    });
  });

  // ========================================
  // Custom message
  // ========================================
  describe('custom message', () => {
    it('uses default message when not provided', async () => {
      const configs: Record<string, ApiConfig> = {
        'test': {
          name: 'test',
          apiKey: 'key',
          baseUrl: 'https://api.example.com',
          mode: 'unified',
          modelName: 'claude-3',
        },
      };

      vi.mocked(promptWithCancel).mockResolvedValueOnce({ value: 'test', cancelled: false });

      await selectApiConfig(configs);

      const callArg = vi.mocked(promptWithCancel).mock.calls[0][0];
      expect(callArg.message).toContain('选择 API 配置');
    });

    it('uses custom message when provided', async () => {
      const configs: Record<string, ApiConfig> = {
        'test': {
          name: 'test',
          apiKey: 'key',
          baseUrl: 'https://api.example.com',
          mode: 'unified',
          modelName: 'claude-3',
        },
      };

      vi.mocked(promptWithCancel).mockResolvedValueOnce({ value: 'test', cancelled: false });

      await selectApiConfig(configs, '请选择目标配置');

      const callArg = vi.mocked(promptWithCancel).mock.calls[0][0];
      expect(callArg.message).toBe('请选择目标配置');
    });
  });
});