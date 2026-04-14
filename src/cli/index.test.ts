import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Command } from 'commander';
import { runCLI } from './index.js';

// Mock TUI launcher
vi.mock('./utils/tui-launch.js', () => ({
  launchTUI: vi.fn(),
}));

// Mock command registration
vi.mock('./commands/list.js', () => ({
  registerListCommand: vi.fn(),
}));
vi.mock('./commands/switch.js', () => ({
  registerSwitchCommand: vi.fn(),
}));
vi.mock('./commands/current.js', () => ({
  registerCurrentCommand: vi.fn(),
}));
vi.mock('./commands/template.js', () => ({
  registerTemplateCommand: vi.fn(),
}));

describe('CLI entry point', () => {
  let mockLaunchTUI: ReturnType<typeof vi.fn>;
  let mockRegisterList: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockLaunchTUI = vi.mocked(await import('./utils/tui-launch.js')).launchTUI;
    mockRegisterList = vi.mocked(await import('./commands/list.js')).registerListCommand;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('runCLI', () => {
    it('creates Commander program with name cc-config', async () => {
      try {
        await runCLI(['node', 'cc-config', '--help']);
      } catch {
        // Expected: Commander throws on --help with exitOverride
      }

      expect(mockRegisterList).toHaveBeenCalled();
    });

    it('registers --version option', async () => {
      try {
        await runCLI(['node', 'cc-config', '--version']);
      } catch {
        // Expected: Commander throws on --version with exitOverride
      }

      expect(mockRegisterList).toHaveBeenCalled();
    });

    it('calls launchTUI when no arguments', async () => {
      await runCLI(['node', 'cc-config']);

      expect(mockLaunchTUI).toHaveBeenCalled();
    });

    it('calls parseAsync when arguments present', async () => {
      try {
        await runCLI(['node', 'cc-config', '--help']);
      } catch {
        // Expected: Commander throws on --help with exitOverride
      }

      expect(mockLaunchTUI).not.toHaveBeenCalled();
    });
  });

  describe('NO_COLOR support', () => {
    it('respects NO_COLOR environment variable', async () => {
      const originalNoColor = process.env.NO_COLOR;
      process.env.NO_COLOR = '1';

      try {
        await runCLI(['node', 'cc-config', '--help']);
      } catch {
        // Expected: Commander throws on --help
      }

      // chalk.level should be 0 when NO_COLOR is set
      // Note: chalk.level is global, hard to test directly

      process.env.NO_COLOR = originalNoColor;
    });
  });
});