/**
 * Scan Command Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Command } from 'commander';
import { registerScanCommand, scanProjectsCLI } from './scan.js';

// Use vi.hoisted so the variable is available in the hoisted vi.mock factory
const scanProjectsMock = vi.hoisted(() => vi.fn().mockResolvedValue([
  { path: '/test/project1', isNew: true },
  { path: '/test/project2', isNew: false },
]));

vi.mock('../utils/service-factory.js', () => ({
  createServices: vi.fn(() => ({
    projectService: {
      scanProjects: scanProjectsMock,
      registerProject: vi.fn().mockResolvedValue({
        id: 'test-uuid', name: 'test-project', path: '/test/project',
        activeConfig: null, lastModified: new Date().toISOString(),
      }),
    },
    projectIndex: {},
    apiConfigStore: {},
    appState: {},
    apiService: {},
  })),
}));

vi.mock('../utils/cli-launch.js', () => ({
  launchScanTUI: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../output/error.js', () => ({
  handleCLIError: vi.fn(),
}));

describe('scan command', () => {
  let program: Command;

  beforeEach(() => {
    vi.clearAllMocks();
    program = new Command();
    program.exitOverride();
    registerScanCommand(program);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('command registration', () => {
    it('registers scan command', () => {
      const commands = program.commands;
      const scanCmd = commands.find(cmd => cmd.name() === 'scan');
      expect(scanCmd).toBeDefined();
    });

    it('has correct description', () => {
      const commands = program.commands;
      const scanCmd = commands.find(cmd => cmd.name() === 'scan');
      expect(scanCmd?.description()).toContain('Scan directories');
    });

    it('registers --root option', () => {
      const commands = program.commands;
      const scanCmd = commands.find(cmd => cmd.name() === 'scan');
      expect(scanCmd?.options.some(opt => opt.long === '--root')).toBe(true);
    });

    it('registers --depth option with default 3', () => {
      const commands = program.commands;
      const scanCmd = commands.find(cmd => cmd.name() === 'scan');
      const depthOpt = scanCmd?.options.find(opt => opt.long === '--depth');
      expect(depthOpt).toBeDefined();
      expect(depthOpt?.defaultValue).toBe('3');
    });

    it('registers --tui option', () => {
      const commands = program.commands;
      const scanCmd = commands.find(cmd => cmd.name() === 'scan');
      expect(scanCmd?.options.some(opt => opt.long === '--tui')).toBe(true);
    });

    it('registers --json option', () => {
      const commands = program.commands;
      const scanCmd = commands.find(cmd => cmd.name() === 'scan');
      expect(scanCmd?.options.some(opt => opt.long === '--json')).toBe(true);
    });

    it('registers -r alias for root', () => {
      const commands = program.commands;
      const scanCmd = commands.find(cmd => cmd.name() === 'scan');
      expect(scanCmd?.options.some(opt => opt.short === '-r')).toBe(true);
    });

    it('registers -d alias for depth', () => {
      const commands = program.commands;
      const scanCmd = commands.find(cmd => cmd.name() === 'scan');
      expect(scanCmd?.options.some(opt => opt.short === '-d')).toBe(true);
    });

    it('registers -t alias for tui', () => {
      const commands = program.commands;
      const scanCmd = commands.find(cmd => cmd.name() === 'scan');
      expect(scanCmd?.options.some(opt => opt.short === '-t')).toBe(true);
    });

    it('registers -j alias for json', () => {
      const commands = program.commands;
      const scanCmd = commands.find(cmd => cmd.name() === 'scan');
      expect(scanCmd?.options.some(opt => opt.short === '-j')).toBe(true);
    });
  });

  describe('scanProjectsCLI function', () => {
    it('exports scanProjectsCLI function', () => {
      expect(scanProjectsCLI).toBeDefined();
      expect(typeof scanProjectsCLI).toBe('function');
    });

    it('calls ProjectService.scanProjects with depth', async () => {
      scanProjectsMock.mockResolvedValue([{ path: '/test/project1', isNew: true }]);

      await scanProjectsCLI({ depth: 5 });

      expect(scanProjectsMock).toHaveBeenCalledWith(5, undefined);
    });

    it('uses default depth 3 when not specified', async () => {
      scanProjectsMock.mockResolvedValue([]);

      await scanProjectsCLI({});

      expect(scanProjectsMock).toHaveBeenCalledWith(3, undefined);
    });

    it('passes --root as overrideDirs to scanProjects', async () => {
      scanProjectsMock.mockResolvedValue([]);

      await scanProjectsCLI({ root: '/custom/path' });

      expect(scanProjectsMock).toHaveBeenCalledWith(3, ['/custom/path']);
    });

    it('calls launchScanTUI when --tui option is set', async () => {
      scanProjectsMock.mockResolvedValue([
        { path: '/test/project1', isNew: true },
      ]);

      await scanProjectsCLI({ tui: true });

      const { launchScanTUI } = await import('../utils/cli-launch.js');
      expect(vi.mocked(launchScanTUI)).toHaveBeenCalled();
    });

    it('outputs JSON when --json option is set', async () => {
      const mockConsole = vi.spyOn(console, 'log').mockImplementation(() => {});

      const mockResults = [
        { path: '/test/project1', isNew: true },
        { path: '/test/project2', isNew: false },
      ];
      scanProjectsMock.mockResolvedValue(mockResults);

      await scanProjectsCLI({ json: true });

      expect(mockConsole).toHaveBeenCalled();
      const output = mockConsole.mock.calls[0][0];
      expect(output).toContain('/test/project1');

      mockConsole.mockRestore();
    });
  });
});
