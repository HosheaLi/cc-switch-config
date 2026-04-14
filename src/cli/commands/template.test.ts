import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Command } from 'commander';
import chalk from 'chalk';
import { registerTemplateCommand } from './template.js';

// Mock TemplateService at the source module (actual class definition)
vi.mock('../../lib/services/template-service.js', () => ({
  TemplateService: vi.fn().mockImplementation(() => ({
    listTemplates: vi.fn().mockResolvedValue(['anthropic', 'openai', 'groq']),
    deleteTemplate: vi.fn().mockResolvedValue(true),
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

// Mock error handler
vi.mock('../output/error.js', () => ({
  handleCLIError: vi.fn(),
}));

describe('template command', () => {
  let program: Command;
  let mockConsole: ReturnType<typeof vi.spyOn>;
  let mockExit: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    program = new Command();
    program.exitOverride();
    registerTemplateCommand(program);
    mockConsole = vi.spyOn(console, 'log').mockImplementation(() => {});
    mockExit = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('command registration', () => {
    it('registers template command', () => {
      const commands = program.commands;
      const templateCmd = commands.find(cmd => cmd.name() === 'template');
      expect(templateCmd).toBeDefined();
    });

    it('registers tpl alias', () => {
      const commands = program.commands;
      const templateCmd = commands.find(cmd => cmd.name() === 'template');
      expect(templateCmd?.aliases()).toContain('tpl');
    });

    it('registers nested list command', () => {
      const commands = program.commands;
      const templateCmd = commands.find(cmd => cmd.name() === 'template');
      const listCmd = templateCmd?.commands.find(cmd => cmd.name() === 'list');
      expect(listCmd).toBeDefined();
    });

    it('registers nested list with l alias', () => {
      const commands = program.commands;
      const templateCmd = commands.find(cmd => cmd.name() === 'template');
      const listCmd = templateCmd?.commands.find(cmd => cmd.name() === 'list');
      expect(listCmd?.aliases()).toContain('l');
    });

    it('registers nested create command', () => {
      const commands = program.commands;
      const templateCmd = commands.find(cmd => cmd.name() === 'template');
      const createCmd = templateCmd?.commands.find(cmd => cmd.name() === 'create');
      expect(createCmd).toBeDefined();
    });

    it('registers nested create with c alias', () => {
      const commands = program.commands;
      const templateCmd = commands.find(cmd => cmd.name() === 'template');
      const createCmd = templateCmd?.commands.find(cmd => cmd.name() === 'create');
      expect(createCmd?.aliases()).toContain('c');
    });

    it('registers nested delete command', () => {
      const commands = program.commands;
      const templateCmd = commands.find(cmd => cmd.name() === 'template');
      const deleteCmd = templateCmd?.commands.find(cmd => cmd.name() === 'delete');
      expect(deleteCmd).toBeDefined();
    });

    it('registers nested delete with d alias', () => {
      const commands = program.commands;
      const templateCmd = commands.find(cmd => cmd.name() === 'template');
      const deleteCmd = templateCmd?.commands.find(cmd => cmd.name() === 'delete');
      expect(deleteCmd?.aliases()).toContain('d');
    });
  });

  describe('template list execution', () => {
    it('outputs template names', async () => {
      // Ensure TemplateService mock returns templates (re-apply mock)
      const MockTemplateService = vi.mocked(await import('../../lib/services/index.js')).TemplateService;
      MockTemplateService.mockImplementation(() => ({
        listTemplates: vi.fn().mockResolvedValue(['anthropic', 'openai', 'groq']),
      }) as any);

      // Create fresh program and mocks for this test
      const freshProgram = new Command();
      freshProgram.exitOverride();
      registerTemplateCommand(freshProgram);
      const freshConsole = vi.spyOn(console, 'log').mockImplementation(() => {});
      const freshExit = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

      try {
        await freshProgram.parseAsync(['node', 'cc-config', 'template', 'list']);
      } catch {
        // May exit on success
      }

      expect(freshConsole.mock.calls.some(call =>
        call[0].includes('anthropic') || call[0].includes('Saved Templates')
      )).toBe(true);

      freshConsole.mockRestore();
      freshExit.mockRestore();
    });

    it('outputs count summary', async () => {
      // Ensure TemplateService mock returns templates (re-apply mock)
      const MockTemplateService = vi.mocked(await import('../../lib/services/index.js')).TemplateService;
      MockTemplateService.mockImplementation(() => ({
        listTemplates: vi.fn().mockResolvedValue(['anthropic', 'openai', 'groq']),
      }) as any);

      // Create fresh program and mocks for this test
      const freshProgram = new Command();
      freshProgram.exitOverride();
      registerTemplateCommand(freshProgram);
      const freshConsole = vi.spyOn(console, 'log').mockImplementation(() => {});
      const freshExit = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

      try {
        await freshProgram.parseAsync(['node', 'cc-config', 'template', 'list']);
      } catch {
        // May exit on success
      }

      expect(freshConsole.mock.calls.some(call =>
        call[0].includes('3 template')
      )).toBe(true);

      freshConsole.mockRestore();
      freshExit.mockRestore();
    });

    it('outputs no templates message when empty', async () => {
      const MockTemplateService = vi.mocked(await import('../../lib/services/index.js')).TemplateService;
      MockTemplateService.mockImplementation(() => ({
        listTemplates: vi.fn().mockResolvedValue([]),
      }) as any);

      // Re-register with fresh mock
      const freshProgram = new Command();
      freshProgram.exitOverride();
      registerTemplateCommand(freshProgram);
      const freshConsole = vi.spyOn(console, 'log').mockImplementation(() => {});
      const freshExit = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

      try {
        await freshProgram.parseAsync(['node', 'cc-config', 'template', 'list']);
      } catch {
        // May exit on success
      }

      expect(freshConsole.mock.calls.some(call =>
        call[0].includes('No templates saved')
      )).toBe(true);

      freshConsole.mockRestore();
      freshExit.mockRestore();
    });
  });

  describe('template create execution', () => {
    it('outputs placeholder message', async () => {
      try {
        await program.parseAsync(['node', 'cc-config', 'template', 'create', 'my-template']);
      } catch {
        // May exit on success
      }

      expect(mockConsole.mock.calls.some(call =>
        call[0].includes('Phase 06')
      )).toBe(true);
    });

    it('outputs template name', async () => {
      try {
        await program.parseAsync(['node', 'cc-config', 'template', 'create', 'my-template']);
      } catch {
        // May exit on success
      }

      expect(mockConsole.mock.calls.some(call =>
        call[0].includes('my-template')
      )).toBe(true);
    });
  });

  describe('template delete execution', () => {
    it('requires confirmation without --force', async () => {
      try {
        await program.parseAsync(['node', 'cc-config', 'template', 'delete', 'my-template']);
      } catch {
        // May exit for confirmation
      }

      expect(mockConsole.mock.calls.some(call =>
        call[0].includes('Are you sure')
      )).toBe(true);
    });

    it('calls deleteTemplate with --force', async () => {
      const mockDelete = vi.fn().mockResolvedValue(true);
      const MockTemplateService = vi.mocked(await import('../../lib/services/index.js')).TemplateService;
      MockTemplateService.mockImplementation(() => ({
        deleteTemplate: mockDelete,
      }) as any);

      // Re-register with fresh mock
      const freshProgram = new Command();
      freshProgram.exitOverride();
      registerTemplateCommand(freshProgram);
      const freshConsole = vi.spyOn(console, 'log').mockImplementation(() => {});
      const freshExit = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

      try {
        await freshProgram.parseAsync(['node', 'cc-config', 'template', 'delete', 'my-template', '--force']);
      } catch {
        // May exit on success
      }

      expect(mockDelete).toHaveBeenCalledWith('my-template');

      freshConsole.mockRestore();
      freshExit.mockRestore();
    });

    it('outputs success message after delete', async () => {
      const MockTemplateService = vi.mocked(await import('../../lib/services/index.js')).TemplateService;
      MockTemplateService.mockImplementation(() => ({
        deleteTemplate: vi.fn().mockResolvedValue(true),
      }) as any);

      // Re-register with fresh mock
      const freshProgram = new Command();
      freshProgram.exitOverride();
      registerTemplateCommand(freshProgram);
      const freshConsole = vi.spyOn(console, 'log').mockImplementation(() => {});
      const freshExit = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

      try {
        await freshProgram.parseAsync(['node', 'cc-config', 'template', 'delete', 'my-template', '--force']);
      } catch {
        // May exit on success
      }

      expect(freshConsole.mock.calls.some(call =>
        call[0].includes('deleted')
      )).toBe(true);

      freshConsole.mockRestore();
      freshExit.mockRestore();
    });
  });
});