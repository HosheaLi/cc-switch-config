/**
 * Scan Command Tests
 *
 * Tests CLI scan command per F10.
 * Tests command registration per D-08.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Command } from 'commander';
import { registerScanCommand, scanProjectsCLI } from './scan.js';

// Mock ProjectService (barrel export path)
vi.mock('../../lib/services/index.js', () => ({
  ProjectService: vi.fn().mockImplementation(() => ({
    scanProjects: vi.fn().mockResolvedValue([
      { path: '/test/project1', isNew: true },
      { path: '/test/project2', isNew: false },
    ]),
  })),
}));

// Mock ProjectIndex
vi.mock('../../lib/store/project.js', () => ({
  ProjectIndex: vi.fn(),
}));

// Mock AppState
vi.mock('../../lib/store/state.js', () => ({
  AppState: vi.fn().mockImplementation(() => ({
    get: vi.fn().mockReturnValue([]),
    set: vi.fn(),
  })),
}));

// Mock CLI launch
vi.mock('../utils/cli-launch.js', () => ({
  launchScanTUI: vi.fn().mockResolvedValue(undefined),
}));

// Mock error handler
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
      const mockScanProjects = vi.fn().mockResolvedValue([
        { path: '/test/project1', isNew: true },
      ]);
      const MockProjectService = vi.mocked(await import('../../lib/services/index.js')).ProjectService;
      MockProjectService.mockImplementation(() => ({
        scanProjects: mockScanProjects,
      }) as any);

      await scanProjectsCLI({ depth: 5 });

      expect(mockScanProjects).toHaveBeenCalledWith(5, undefined);
    });

    it('uses default depth 3 when not specified', async () => {
      const mockScanProjects = vi.fn().mockResolvedValue([]);
      const MockProjectService = vi.mocked(await import('../../lib/services/index.js')).ProjectService;
      MockProjectService.mockImplementation(() => ({
        scanProjects: mockScanProjects,
      }) as any);

      await scanProjectsCLI({});

      expect(mockScanProjects).toHaveBeenCalledWith(3, undefined);
    });

    it('passes --root as overrideDirs to scanProjects without persisting', async () => {
      const mockSet = vi.fn();
      const MockAppState = vi.mocked(await import('../../lib/store/state.js')).AppState;
      MockAppState.mockImplementation(() => ({
        get: vi.fn().mockReturnValue([]),
        set: mockSet,
      }) as any);

      const mockScanProjects = vi.fn().mockResolvedValue([]);
      const MockProjectService = vi.mocked(await import('../../lib/services/index.js')).ProjectService;
      MockProjectService.mockImplementation(() => ({
        scanProjects: mockScanProjects,
      }) as any);

      await scanProjectsCLI({ root: '/custom/path' });

      expect(mockScanProjects).toHaveBeenCalledWith(3, ['/custom/path']);
      expect(mockSet).not.toHaveBeenCalled();
    });

    it('does not call AppState.set when --root is used', async () => {
      const mockSet = vi.fn();
      const MockAppState = vi.mocked(await import('../../lib/store/state.js')).AppState;
      MockAppState.mockImplementation(() => ({
        get: vi.fn().mockReturnValue(['/existing/path', '/custom/path']),
        set: mockSet,
      }) as any);

      const mockScanProjects = vi.fn().mockResolvedValue([]);
      const MockProjectService = vi.mocked(await import('../../lib/services/index.js')).ProjectService;
      MockProjectService.mockImplementation(() => ({
        scanProjects: mockScanProjects,
      }) as any);

      await scanProjectsCLI({ root: '/custom/path' });

      expect(mockSet).not.toHaveBeenCalled();
      expect(mockScanProjects).toHaveBeenCalledWith(3, ['/custom/path']);
    });

    it('calls launchScanTUI when --tui option is set', async () => {
      const mockLaunchScanTUI = vi.mocked(await import('../utils/cli-launch.js')).launchScanTUI;

      const mockScanProjects = vi.fn().mockResolvedValue([
        { path: '/test/project1', isNew: true },
      ]);
      const MockProjectService = vi.mocked(await import('../../lib/services/index.js')).ProjectService;
      MockProjectService.mockImplementation(() => ({
        scanProjects: mockScanProjects,
      }) as any);

      await scanProjectsCLI({ tui: true });

      expect(mockLaunchScanTUI).toHaveBeenCalled();
    });

    it('outputs JSON when --json option is set', async () => {
      const mockConsole = vi.spyOn(console, 'log').mockImplementation(() => {});

      const mockResults = [
        { path: '/test/project1', isNew: true },
        { path: '/test/project2', isNew: false },
      ];

      const mockScanProjects = vi.fn().mockResolvedValue(mockResults);
      const MockProjectService = vi.mocked(await import('../../lib/services/index.js')).ProjectService;
      MockProjectService.mockImplementation(() => ({
        scanProjects: mockScanProjects,
      }) as any);

      await scanProjectsCLI({ json: true });

      expect(mockConsole).toHaveBeenCalled();
      const output = mockConsole.mock.calls[0][0];
      expect(output).toContain('/test/project1');

      mockConsole.mockRestore();
    });
  });
});