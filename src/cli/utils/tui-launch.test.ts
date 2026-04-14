/**
 * TUI Launch Utility Tests - Real Implementation (Phase 06)
 *
 * Tests launchTUI calls runTUI from TUI module (D-02).
 * Tests selectTemplateInTUI lists templates (D-06).
 *
 * Note: Uses vi.mock with factory functions for proper hoisting.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock TUI module - hoisted to top
vi.mock('../../tui/index.js', () => ({
  runTUI: vi.fn().mockResolvedValue(undefined),
}));

// Mock services - hoisted to top, returns object with listTemplates method
vi.mock('../../lib/services/index.js', () => ({
  TemplateService: vi.fn().mockImplementation(() => ({
    listTemplates: vi.fn().mockResolvedValue(['anthropic-template', 'openai-template']),
  })),
}));

// Mock store - hoisted to top
vi.mock('../../lib/store/index.js', () => ({
  TemplateStore: vi.fn().mockImplementation(() => {}),
}));

// Mock config - hoisted to top
vi.mock('../../lib/store/config.js', () => ({
  readConfig: vi.fn(),
  writeConfig: vi.fn(),
}));

// Import AFTER mocks are defined (vitest hoists mocks automatically)
import { launchTUI, selectTemplateInTUI } from './tui-launch.js';
import { TemplateService } from '../../lib/services/index.js';

describe('TUI launch utility', () => {
  let mockConsole: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    mockConsole = vi.spyOn(console, 'log').mockImplementation(() => {});
    // Don't clear mocks - let each test set up its own override if needed
  });

  afterEach(() => {
    vi.restoreAllMocks();
    // Reset TemplateService to default implementation
    vi.mocked(TemplateService).mockImplementation(() => ({
      listTemplates: vi.fn().mockResolvedValue(['anthropic-template', 'openai-template']),
    }));
  });

  describe('launchTUI', () => {
    it('calls runTUI from tui module (D-02)', async () => {
      await launchTUI();

      const { runTUI } = await import('../../tui/index.js');
      expect(vi.mocked(runTUI)).toHaveBeenCalled();
    });

    it('resolves without error', async () => {
      const result = await launchTUI();
      expect(result).toBeUndefined();
    });
  });

  describe('selectTemplateInTUI', () => {
    it('returns null (user must specify via CLI)', async () => {
      const result = await selectTemplateInTUI();
      expect(result).toBeNull();
    });

    it('lists available templates (D-06)', async () => {
      await selectTemplateInTUI();

      // Should output template names
      expect(mockConsole).toHaveBeenCalled();
      const calls = mockConsole.mock.calls;
      const logOutput = calls.map(c => c[0]).join('\n');

      expect(logOutput).toContain('Available templates');
    });

    it('handles no templates available', async () => {
      // Override TemplateService mock for empty templates
      vi.mocked(TemplateService).mockImplementationOnce(() => ({
        listTemplates: vi.fn().mockResolvedValue([]),
      } as any));

      await selectTemplateInTUI();

      const logOutput = mockConsole.mock.calls.map(c => c[0]).join('\n');
      expect(logOutput).toContain('No templates available');
    });

    it('handles errors gracefully', async () => {
      // Override TemplateService mock for error
      vi.mocked(TemplateService).mockImplementationOnce(() => ({
        listTemplates: vi.fn().mockRejectedValue(new Error('Store error')),
      } as any));

      const result = await selectTemplateInTUI();

      expect(result).toBeNull();
      const logOutput = mockConsole.mock.calls.map(c => c[0]).join('\n');
      expect(logOutput).toContain('Error listing templates');
    });
  });
});