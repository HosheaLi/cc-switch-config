import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { launchTUI, selectTemplateInTUI } from './tui-launch.js';

describe('TUI launch utility', () => {
  let mockConsole: ReturnType<typeof vi.spyOn>;
  let mockExit: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    mockConsole = vi.spyOn(console, 'log').mockImplementation(() => {});
    mockExit = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('launchTUI (stub)', () => {
    it('resolves without error', async () => {
      await launchTUI();
      expect(mockExit).toHaveBeenCalledWith(0);
    });

    it('outputs placeholder message', async () => {
      await launchTUI();
      expect(mockConsole).toHaveBeenCalled();
      expect(mockConsole.mock.calls.some(call =>
        call[0].includes('TUI not implemented')
      )).toBe(true);
    });

    it('outputs help suggestions', async () => {
      await launchTUI();
      expect(mockConsole.mock.calls.some(call =>
        call[0].includes('cc-config list')
      )).toBe(true);
    });
  });

  describe('selectTemplateInTUI (stub)', () => {
    it('returns null', async () => {
      const result = await selectTemplateInTUI();
      expect(result).toBeNull();
    });

    it('outputs placeholder message', async () => {
      await selectTemplateInTUI();
      expect(mockConsole).toHaveBeenCalled();
      expect(mockConsole.mock.calls.some(call =>
        call[0].includes('TUI template selection not implemented')
      )).toBe(true);
    });
  });
});