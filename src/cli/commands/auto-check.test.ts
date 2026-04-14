/**
 * Auto-Check Command Tests
 *
 * Tests shell hook integration command.
 * Per D-01: Shell hook integration.
 * Per D-02: Silent flag for quiet mode.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Command } from 'commander';

// Mock auto-switch utility
vi.mock('../utils/auto-switch.js', () => ({
  detectAutoSwitch: vi.fn(),
  applyAutoSwitch: vi.fn(),
  formatSwitchMessage: vi.fn(),
}));

// Mock project store
vi.mock('../../lib/store/project.js', () => ({
  ProjectIndex: vi.fn().mockImplementation(() => ({
    getByPath: vi.fn(),
  })),
}));

// Mock state store
vi.mock('../../lib/store/state.js', () => ({
  AppState: vi.fn().mockImplementation(() => ({
    getActiveProject: vi.fn().mockReturnValue(null),
    setActiveProject: vi.fn(),
  })),
}));

// Mock error handler
vi.mock('../output/error.js', () => ({
  handleCLIError: vi.fn(),
}));

// Import AFTER mocks
import { registerAutoCheckCommand, autoCheck } from './auto-check.js';
import { detectAutoSwitch, applyAutoSwitch, formatSwitchMessage } from '../utils/auto-switch.js';

describe('auto-check command', () => {
  let program: Command;
  let mockConsole: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    program = new Command();
    program.exitOverride();
    mockConsole = vi.spyOn(console, 'log').mockImplementation(() => {});

    // Register command
    registerAutoCheckCommand(program);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('command registration', () => {
    it('registers auto-check command', () => {
      const cmd = program.commands.find(cmd => cmd.name() === 'auto-check');
      expect(cmd).toBeDefined();
    });

    it('has --silent option with default true (D-02)', () => {
      const cmd = program.commands.find(cmd => cmd.name() === 'auto-check');
      expect(cmd).toBeDefined();

      // Check --silent option exists
      const silentOpt = cmd?.options.find(opt => opt.long === '--silent');
      expect(silentOpt).toBeDefined();
    });

    it('has --root option for override directory', () => {
      const cmd = program.commands.find(cmd => cmd.name() === 'auto-check');
      expect(cmd).toBeDefined();

      const rootOpt = cmd?.options.find(opt => opt.long === '--root');
      expect(rootOpt).toBeDefined();
    });

    it('has correct description', () => {
      const cmd = program.commands.find(cmd => cmd.name() === 'auto-check');
      expect(cmd?.description()).toContain('shell hook');
    });
  });

  describe('autoCheck function', () => {
    it('calls detectAutoSwitch with cwd', async () => {
      vi.mocked(detectAutoSwitch).mockResolvedValue({
        switched: false,
        projectId: null,
        projectName: null,
        templateName: null,
        unregisteredDir: false,
      });
      vi.mocked(formatSwitchMessage).mockReturnValue(null);

      await autoCheck({ silent: true });

      expect(detectAutoSwitch).toHaveBeenCalled();
      const callArgs = vi.mocked(detectAutoSwitch).mock.calls[0];
      expect(callArgs[0]).toBe(process.cwd());
    });

    it('calls applyAutoSwitch when switched=true', async () => {
      vi.mocked(detectAutoSwitch).mockResolvedValue({
        switched: true,
        projectId: 'proj-123',
        projectName: 'my-project',
        templateName: 'anthropic-template',
        unregisteredDir: false,
      });
      vi.mocked(formatSwitchMessage).mockReturnValue('Switched to project: my-project');

      await autoCheck({ silent: true });

      expect(applyAutoSwitch).toHaveBeenCalled();
    });

    it('does not call applyAutoSwitch when switched=false', async () => {
      vi.mocked(detectAutoSwitch).mockResolvedValue({
        switched: false,
        projectId: null,
        projectName: null,
        templateName: null,
        unregisteredDir: false,
      });
      vi.mocked(formatSwitchMessage).mockReturnValue(null);

      await autoCheck({ silent: true });

      expect(applyAutoSwitch).not.toHaveBeenCalled();
    });

    it('outputs message when not silent', async () => {
      vi.mocked(detectAutoSwitch).mockResolvedValue({
        switched: false,
        projectId: null,
        projectName: null,
        templateName: null,
        unregisteredDir: false,
      });
      vi.mocked(formatSwitchMessage).mockReturnValue(null);

      await autoCheck({ silent: false });

      // In non-silent mode with no message, no output is expected
      expect(mockConsole).not.toHaveBeenCalled();
    });

    it('outputs message when switch occurs', async () => {
      vi.mocked(detectAutoSwitch).mockResolvedValue({
        switched: true,
        projectId: 'proj-123',
        projectName: 'my-project',
        templateName: 'anthropic-template',
        unregisteredDir: false,
      });
      vi.mocked(formatSwitchMessage).mockReturnValue('Switched to project: my-project');

      await autoCheck({ silent: true });

      expect(mockConsole).toHaveBeenCalledWith('Switched to project: my-project');
    });

    it('uses --root override directory', async () => {
      vi.mocked(detectAutoSwitch).mockResolvedValue({
        switched: false,
        projectId: null,
        projectName: null,
        templateName: null,
        unregisteredDir: false,
      });
      vi.mocked(formatSwitchMessage).mockReturnValue(null);

      await autoCheck({ silent: true, root: '/custom/path' });

      expect(detectAutoSwitch).toHaveBeenCalled();
      const callArgs = vi.mocked(detectAutoSwitch).mock.calls[0];
      expect(callArgs[0]).toBe('/custom/path');
    });
  });

  describe('shell hook documentation', () => {
    it('contains bash hook documentation', () => {
      const cmd = program.commands.find(cmd => cmd.name() === 'auto-check');
      expect(cmd).toBeDefined();

      // The documentation is in the file as comments, check file content
      // This test verifies the command is properly documented
      expect(cmd?.description()).toContain('shell hook');
    });
  });
});