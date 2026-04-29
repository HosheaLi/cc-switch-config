import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Command } from 'commander';

// Hoisted mock functions
const mockGetActiveProject = vi.hoisted(() => vi.fn().mockReturnValue('test-project-id'));
const mockGetProjectById = vi.hoisted(() => vi.fn().mockResolvedValue({
  id: 'test-project-id',
  path: '/Users/test/my-project',
  activeConfig: 'anthropic-template',
  lastModified: '2026-04-14T00:00:00Z',
}));

// Mock chalk to return simple strings for easier testing
vi.mock('chalk', () => ({
  default: {
    bold: (str: string) => `[bold]${str}`,
    white: (str: string) => str,
    green: (str: string) => `[green]${str}`,
    gray: (str: string) => str,
    yellow: (str: string) => `[yellow]${str}`,
    red: (str: string) => `[red]${str}`,
  },
}));

// Mock AppState
vi.mock('../../lib/store/state.js', () => ({
  AppState: vi.fn().mockImplementation(() => ({
    getActiveProject: mockGetActiveProject,
  })),
}));

// Mock services barrel export
vi.mock('../../lib/services/index.js', () => ({
  ProjectService: vi.fn().mockImplementation(() => ({
    getProjectById: mockGetProjectById,
  })),
}));

// Mock ProjectIndex
vi.mock('../../lib/store/project.js', () => ({
  ProjectIndex: vi.fn(),
}));

// Mock error handler
vi.mock('../output/error.js', () => ({
  handleCLIError: vi.fn(),
}));

import { registerCurrentCommand, executeCurrentCommand } from './current.js';
import type { ProjectEntry } from '../../lib/store/project.js';
import type { AppState } from '../../lib/store/state.js';
import type { ProjectService } from '../../lib/services/index.js';

describe('current command', () => {
  let mockConsole: ReturnType<typeof vi.spyOn>;
  let mockExit: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mocks to default values
    mockGetActiveProject.mockReturnValue('test-project-id');
    mockGetProjectById.mockResolvedValue({
      id: 'test-project-id',
      name: 'my-project',
      path: '/Users/test/my-project',
      activeConfig: 'anthropic-template',
      lastModified: '2026-04-14T00:00:00Z',
    } as ProjectEntry);

    mockConsole = vi.spyOn(console, 'log').mockImplementation(() => {});
    // Mock process.exit to throw so code doesn continue
    mockExit = vi.spyOn(process, 'exit').mockImplementation((code: number) => {
      throw new Error(`process.exit:${code}`);
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('command registration', () => {
    it('registers current command', () => {
      const program = new Command();
      registerCurrentCommand(program);
      const currentCmd = program.commands.find(cmd => cmd.name() === 'current');
      expect(currentCmd).toBeDefined();
    });

    it('registers cur alias', () => {
      const program = new Command();
      registerCurrentCommand(program);
      const currentCmd = program.commands.find(cmd => cmd.name() === 'current');
      expect(currentCmd?.aliases()).toContain('cur');
    });

    it('has correct description', () => {
      const program = new Command();
      registerCurrentCommand(program);
      const currentCmd = program.commands.find(cmd => cmd.name() === 'current');
      expect(currentCmd?.description()).toContain('active');
    });
  });

  describe('executeCurrentCommand', () => {
    it('displays active project path', async () => {
      const mockAppState = { getActiveProject: mockGetActiveProject } as AppState;
      const mockProjectService = { getProjectById: mockGetProjectById } as ProjectService;

      await executeCurrentCommand(mockAppState, mockProjectService);

      const output = mockConsole.mock.calls.flat().join(' ');
      expect(output).toContain('/Users/test/my-project');
    });

    it('displays template name when activeConfig exists', async () => {
      const mockAppState = { getActiveProject: mockGetActiveProject } as AppState;
      const mockProjectService = { getProjectById: mockGetProjectById } as ProjectService;

      await executeCurrentCommand(mockAppState, mockProjectService);

      const output = mockConsole.mock.calls.flat().join(' ');
      expect(output).toContain('anthropic-template');
    });

    it('displays no active project message when none set', async () => {
      mockGetActiveProject.mockReturnValue(null);
      const mockAppState = { getActiveProject: mockGetActiveProject } as AppState;
      const mockProjectService = { getProjectById: mockGetProjectById } as ProjectService;

      try {
        await executeCurrentCommand(mockAppState, mockProjectService);
      } catch (e) {
        // Expected: process.exit throws
      }

      const output = mockConsole.mock.calls.flat().join(' ');
      expect(output).toContain('No active project');
      expect(mockExit).toHaveBeenCalledWith(0);
    });

    it('displays template none when no activeConfig', async () => {
      mockGetProjectById.mockResolvedValue({
        id: 'test-project-id',
        name: 'my-project',
        path: '/Users/test/my-project',
        activeConfig: null,
        lastModified: '2026-04-14T00:00:00Z',
      } as ProjectEntry);

      const mockAppState = { getActiveProject: mockGetActiveProject } as AppState;
      const mockProjectService = { getProjectById: mockGetProjectById } as ProjectService;

      await executeCurrentCommand(mockAppState, mockProjectService);

      const output = mockConsole.mock.calls.flat().join(' ');
      expect(output).toContain('Template: none');
    });

    it('displays last modified timestamp', async () => {
      const mockAppState = { getActiveProject: mockGetActiveProject } as AppState;
      const mockProjectService = { getProjectById: mockGetProjectById } as ProjectService;

      await executeCurrentCommand(mockAppState, mockProjectService);

      const output = mockConsole.mock.calls.flat().join(' ');
      expect(output).toContain('2026-04-14');
    });

    it('displays project not found message when project ID invalid', async () => {
      mockGetProjectById.mockResolvedValue(null);
      const mockAppState = { getActiveProject: mockGetActiveProject } as AppState;
      const mockProjectService = { getProjectById: mockGetProjectById } as ProjectService;

      try {
        await executeCurrentCommand(mockAppState, mockProjectService);
      } catch (e) {
        // Expected: process.exit throws
      }

      const output = mockConsole.mock.calls.flat().join(' ');
      expect(output).toContain('not found');
      expect(mockExit).toHaveBeenCalledWith(0);
    });
  });
});