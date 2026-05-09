/**
 * CLI Launch Utility Tests - Dashboard Mode (v0.2)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('../dashboard/dashboard.js', () => ({
  runDashboard: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../prompts/components/select-api-config.js', () => ({
  selectApiConfig: vi.fn().mockResolvedValue('selected-config'),
}));

vi.mock('./service-factory.js', () => ({
  createServices: vi.fn().mockReturnValue({
    apiService: {
      getAllConfigs: vi.fn().mockResolvedValue({ 'anthropic-config': {}, 'openai-config': {} }),
      getConfig: vi.fn().mockResolvedValue(null),
    },
    projectService: {
      listProjects: vi.fn().mockResolvedValue([]),
      scanProjects: vi.fn().mockResolvedValue([]),
      registerProject: vi.fn().mockResolvedValue(undefined),
    },
    projectIndex: {},
    apiConfigStore: {},
    appState: {},
  }),
}));

vi.mock('../theme/index.js', () => ({
  formatters: {
    warning: (msg: string) => `⚠ ${msg}`,
    error: (msg: string) => `✖ ${msg}`,
    message: (msg: string) => msg,
  },
  hint: (msg: string) => msg,
}));

import { launchTUI, selectConfigInCLI } from './cli-launch.js';
import { createServices } from './service-factory.js';

describe('CLI launch utility', () => {
  let mockConsole: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    mockConsole = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    mockConsole.mockRestore();
  });

  describe('launchTUI', () => {
    it('calls runDashboard from dashboard module', async () => {
      await launchTUI();

      const { runDashboard } = await import('../dashboard/dashboard.js');
      expect(vi.mocked(runDashboard)).toHaveBeenCalled();
    });

    it('resolves without error', async () => {
      const result = await launchTUI();
      expect(result).toBeUndefined();
    });
  });

  describe('selectConfigInCLI', () => {
    it('returns selected config name when configs available', async () => {
      const result = await selectConfigInCLI();
      expect(result).toBe('selected-config');
    });

    it('passes configs to selectApiConfig for interactive selection', async () => {
      await selectConfigInCLI();

      const { selectApiConfig } = await import('../prompts/components/select-api-config.js');
      expect(vi.mocked(selectApiConfig)).toHaveBeenCalledWith(
        { 'anthropic-config': {}, 'openai-config': {} },
        '选择要应用的配置'
      );
    });

    it('handles no configs available', async () => {
      vi.mocked(createServices).mockReturnValueOnce({
        apiService: {
          getAllConfigs: vi.fn().mockResolvedValue({}),
          getConfig: vi.fn().mockResolvedValue(null),
        },
        projectService: { listProjects: vi.fn().mockResolvedValue([]), scanProjects: vi.fn().mockResolvedValue([]), registerProject: vi.fn().mockResolvedValue(undefined) },
        projectIndex: {},
        apiConfigStore: {},
        appState: {},
      } as any);

      const result = await selectConfigInCLI();

      expect(result).toBeNull();
      const logOutput = mockConsole.mock.calls.map(c => c[0]).join('\n');
      expect(logOutput).toContain('没有可用的配置');
    });

    it('handles errors gracefully', async () => {
      vi.mocked(createServices).mockReturnValueOnce({
        apiService: {
          getAllConfigs: vi.fn().mockRejectedValue(new Error('Store error')),
          getConfig: vi.fn().mockResolvedValue(null),
        },
        projectService: { listProjects: vi.fn().mockResolvedValue([]), scanProjects: vi.fn().mockResolvedValue([]), registerProject: vi.fn().mockResolvedValue(undefined) },
        projectIndex: {},
        apiConfigStore: {},
        appState: {},
      } as any);

      const result = await selectConfigInCLI();

      expect(result).toBeNull();
      const logOutput = mockConsole.mock.calls.map(c => c[0]).join('\n');
      expect(logOutput).toContain('列出配置失败');
    });
  });
});
