/**
 * CLI Launch Utility Tests - Terminal-Native Mode (Phase 15)
 *
 * Tests launchTUI calls launchPromptsTUI (D-02).
 * Tests selectConfigInCLI lists configs (D-06).
 *
 * Phase 09: launchTUI calls launchPromptsTUI.
 * Phase 15: Renamed to cli-launch.ts, migrated to ApiService.
 *
 * Note: Uses vi.mock with factory functions for proper hoisting.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock prompts module - Phase 09
vi.mock('../prompts/index.js', () => ({
  launchPromptsTUI: vi.fn().mockResolvedValue(undefined),
}));

// Mock services - hoisted to top, returns object with listConfigs method
vi.mock('../../lib/services/index.js', () => ({
  ApiService: vi.fn().mockImplementation(() => ({
    listConfigs: vi.fn().mockResolvedValue(['anthropic-config', 'openai-config']),
    getConfig: vi.fn().mockResolvedValue(null),
  })),
  ProjectService: vi.fn().mockImplementation(() => ({
    listProjects: vi.fn().mockResolvedValue([]),
    scanProjects: vi.fn().mockResolvedValue([]),
    registerProject: vi.fn().mockResolvedValue(undefined),
  })),
}));

// Mock store - hoisted to top
vi.mock('../../lib/store/index.js', () => ({
  ApiConfigStore: vi.fn().mockImplementation(() => {}),
  ProjectIndex: vi.fn().mockImplementation(() => {}),
  AppState: vi.fn().mockImplementation(() => {}),
}));

// Mock config - hoisted to top
vi.mock('../../lib/store/config.js', () => ({
  readConfig: vi.fn(),
  writeConfig: vi.fn(),
}));

// Import AFTER mocks are defined (vitest hoists mocks automatically)
import { launchTUI, selectConfigInCLI } from './cli-launch.js';
import { ApiService } from '../../lib/services/index.js';

describe('CLI launch utility', () => {
  let mockConsole: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    mockConsole = vi.spyOn(console, 'log').mockImplementation(() => {});
    // Don't clear mocks - let each test set up its own override if needed
  });

  afterEach(() => {
    vi.restoreAllMocks();
    // Reset ApiService to default implementation
    vi.mocked(ApiService).mockImplementation(() => ({
      listConfigs: vi.fn().mockResolvedValue(['anthropic-config', 'openai-config']),
      getConfig: vi.fn().mockResolvedValue(null),
    }));
  });

  describe('launchTUI', () => {
    it('calls launchPromptsTUI from prompts module (Phase 09)', async () => {
      await launchTUI();

      const { launchPromptsTUI } = await import('../prompts/index.js');
      expect(vi.mocked(launchPromptsTUI)).toHaveBeenCalled();
    });

    it('resolves without error', async () => {
      const result = await launchTUI();
      expect(result).toBeUndefined();
    });
  });

  describe('selectConfigInCLI', () => {
    it('returns null (user must specify via CLI)', async () => {
      const result = await selectConfigInCLI();
      expect(result).isNull();
    });

    it('lists available configs (D-06)', async () => {
      await selectConfigInCLI();

      // Should output config names
      expect(mockConsole).toHaveBeenCalled();
      const calls = mockConsole.mock.calls;
      const logOutput = calls.map(c => c[0]).join('\n');

      expect(logOutput).toContain('可用配置');
    });

    it('handles no configs available', async () => {
      // Override ApiService mock for empty configs
      vi.mocked(ApiService).mockImplementationOnce(() => ({
        listConfigs: vi.fn().mockResolvedValue([]),
        getConfig: vi.fn().mockResolvedValue(null),
      }) as any);

      await selectConfigInCLI();

      const logOutput = mockConsole.mock.calls.map(c => c[0]).join('\n');
      expect(logOutput).toContain('没有可用的配置');
    });

    it('handles errors gracefully', async () => {
      // Override ApiService mock for error
      vi.mocked(ApiService).mockImplementationOnce(() => ({
        listConfigs: vi.fn().mockRejectedValue(new Error('Store error')),
        getConfig: vi.fn().mockResolvedValue(null),
      }) as any);

      const result = await selectConfigInCLI();

      expect(result).isNull();
      const logOutput = mockConsole.mock.calls.map(c => c[0]).join('\n');
      expect(logOutput).toContain('列出配置失败');
    });
  });
});