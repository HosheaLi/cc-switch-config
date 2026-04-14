import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Command } from 'commander';
import { registerSwitchCommand } from './switch.js';
import { ServiceError } from '../../lib/services/types.js';

// Mock TemplateService (barrel export path)
vi.mock('../../lib/services/index.js', () => ({
  TemplateService: vi.fn().mockImplementation(() => ({
    applyTemplate: vi.fn().mockResolvedValue(undefined),
  })),
}));

// Mock TemplateStore
vi.mock('../../lib/store/template.js', () => ({
  TemplateStore: vi.fn(),
}));

// Mock config functions
vi.mock('../../lib/store/config.js', () => ({
  readConfig: vi.fn(),
  writeConfig: vi.fn(),
}));

// Mock TUI launcher
vi.mock('../utils/tui-launch.js', () => ({
  selectTemplateInTUI: vi.fn().mockResolvedValue(null),
}));

// Mock error handler
vi.mock('../output/error.js', () => ({
  handleCLIError: vi.fn(),
}));

describe('switch command', () => {
  let program: Command;
  let mockConsole: ReturnType<typeof vi.spyOn>;
  let mockExit: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    program = new Command();
    program.exitOverride();
    registerSwitchCommand(program);
    mockConsole = vi.spyOn(console, 'log').mockImplementation(() => {});
    mockExit = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('command registration', () => {
    it('registers switch command', () => {
      const commands = program.commands;
      const switchCmd = commands.find(cmd => cmd.name() === 'switch');
      expect(switchCmd).toBeDefined();
    });

    it('registers sw alias', () => {
      const commands = program.commands;
      const switchCmd = commands.find(cmd => cmd.name() === 'switch');
      expect(switchCmd?.aliases()).toContain('sw');
    });

    it('accepts optional template-name argument', () => {
      const commands = program.commands;
      const switchCmd = commands.find(cmd => cmd.name() === 'switch');
      // Commander v14 stores arguments in _args
      expect(switchCmd?._args.length).toBe(1);
      expect(switchCmd?._args[0]._name).toBe('template-name');
    });
  });

  describe('command execution', () => {
    it('calls applyTemplate with provided template name', async () => {
      const mockApplyTemplate = vi.fn().mockResolvedValue(undefined);
      const MockTemplateService = vi.mocked(await import('../../lib/services/index.js')).TemplateService;
      MockTemplateService.mockImplementation(() => ({
        applyTemplate: mockApplyTemplate,
      }) as any);

      try {
        await program.parseAsync(['node', 'cc-config', 'switch', 'my-template']);
      } catch {
        // May exit on success
      }

      expect(mockApplyTemplate).toHaveBeenCalledWith(process.cwd(), 'my-template');
    });

    it('calls selectTemplateInTUI when no argument', async () => {
      const mockSelect = vi.mocked(await import('../utils/tui-launch.js')).selectTemplateInTUI;

      try {
        await program.parseAsync(['node', 'cc-config', 'switch']);
      } catch {
        // May exit when TUI returns null
      }

      expect(mockSelect).toHaveBeenCalled();
    });

    it('outputs success message after switching', async () => {
      const mockApplyTemplate = vi.fn().mockResolvedValue(undefined);
      const MockTemplateService = vi.mocked(await import('../../lib/services/index.js')).TemplateService;
      MockTemplateService.mockImplementation(() => ({
        applyTemplate: mockApplyTemplate,
      }) as any);

      try {
        await program.parseAsync(['node', 'cc-config', 'switch', 'my-template']);
      } catch {
        // May exit on success
      }

      expect(mockConsole.mock.calls.some(call =>
        call[0].includes('Switched to template')
      )).toBe(true);
    });

    it('handles TEMPLATE_NOT_FOUND error', async () => {
      const mockHandleError = vi.mocked(await import('../output/error.js')).handleCLIError;
      const mockApplyTemplate = vi.fn().mockRejectedValue(
        new ServiceError('Template not found', 'TEMPLATE_NOT_FOUND')
      );
      const MockTemplateService = vi.mocked(await import('../../lib/services/index.js')).TemplateService;
      MockTemplateService.mockImplementation(() => ({
        applyTemplate: mockApplyTemplate,
      }) as any);

      try {
        await program.parseAsync(['node', 'cc-config', 'switch', 'nonexistent']);
      } catch {
        // Error handling may throw
      }

      expect(mockHandleError).toHaveBeenCalled();
    });
  });
});