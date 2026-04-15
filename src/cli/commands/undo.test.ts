/**
 * Undo Command Tests
 *
 * Tests CLI undo command functionality.
 * Per D-07: CLI undo command (TUI U key in next plan).
 * Per U2: Undo support for config modifications.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Command } from 'commander';
import { registerUndoCommand, executeUndoCommand } from './undo.js';
import { UndoService } from '../../lib/services/undo-service.js';
import { AppState } from '../../lib/store/state.js';
import { ProjectIndex } from '../../lib/store/project.js';
import { ServiceError } from '../../lib/services/types.js';
import * as errorModule from '../output/error.js';

// Mock modules
vi.mock('../../lib/services/undo-service.js');
vi.mock('../../lib/store/state.js');
vi.mock('../../lib/store/project.js');
vi.mock('../output/error.js', () => ({
  handleCLIError: vi.fn(),
  ExitCodes: {
    SUCCESS: 0,
    GENERAL_ERROR: 1,
    NOT_FOUND: 3,
    CONFIG_ERROR: 4,
  },
}));

describe('registerUndoCommand', () => {
  let program: Command;
  let mockExit: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    program = new Command();
    program.exitOverride();
    mockExit = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
    vi.clearAllMocks();
  });

  afterEach(() => {
    mockExit.mockRestore();
  });

  it('Test 8: CLI undo registered in index.ts', () => {
    registerUndoCommand(program);

    const command = program.commands.find(cmd => cmd.name() === 'undo');
    expect(command).toBeDefined();
    expect(command?.description()).toContain('Undo');
  });

  it('registers undo command with correct description', () => {
    registerUndoCommand(program);

    const command = program.commands.find(cmd => cmd.name() === 'undo');
    expect(command).toBeDefined();
    expect(command?.description()).toBe('Undo the last configuration modification');
  });

  it('has no alias (per D-07)', () => {
    registerUndoCommand(program);

    const command = program.commands.find(cmd => cmd.name() === 'undo');
    expect(command).toBeDefined();

    // Check that no alias is defined (Commander aliases array)
    const aliases = command?.aliases();
    expect(aliases?.length).toBe(0);
  });
});

describe('executeUndoCommand', () => {
  let mockConsoleLog: ReturnType<typeof vi.spyOn>;
  let mockConsoleError: ReturnType<typeof vi.spyOn>;
  let mockExit: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    mockConsoleLog = vi.spyOn(console, 'log').mockImplementation(() => {});
    mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockExit = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
    vi.clearAllMocks();
  });

  afterEach(() => {
    mockConsoleLog.mockRestore();
    mockConsoleError.mockRestore();
    mockExit.mockRestore();
  });

  it('Test 4: CLI undo command calls UndoService.undo() for active project', async () => {
    // Mock AppState returns active project
    const mockAppState = {
      getActiveProject: vi.fn().mockReturnValue('project-uuid-123'),
    };

    // Mock ProjectIndex returns project
    const mockProjectIndex = {
      getById: vi.fn().mockResolvedValue({
        id: 'project-uuid-123',
        path: '/path/to/project',
        activeConfig: 'template-name',
        lastModified: '2026-04-15T10:00:00Z',
      }),
    };

    // Mock UndoService.undo returns success
    const mockUndoService = {
      undo: vi.fn().mockResolvedValue({
        backupTime: new Date('2026-04-15T10:30:00Z'),
        backupFilename: 'settings.json.2026-04-15T10-30-00-123Z',
        restored: true,
      }),
    };

    vi.mocked(AppState).mockImplementation(() => mockAppState as unknown as AppState);
    vi.mocked(ProjectIndex).mockImplementation(() => mockProjectIndex as unknown as ProjectIndex);
    vi.mocked(UndoService).mockImplementation(() => mockUndoService as unknown as UndoService);

    // Execute
    await executeUndoCommand();

    // Verify UndoService.undo was called with project path
    expect(mockUndoService.undo).toHaveBeenCalledWith('/path/to/project');
  });

  it('Test 5: CLI undo outputs "Restored settings.json from backup:" on success', async () => {
    // Mock AppState returns active project
    const mockAppState = {
      getActiveProject: vi.fn().mockReturnValue('project-uuid-123'),
    };

    const mockProjectIndex = {
      getById: vi.fn().mockResolvedValue({
        id: 'project-uuid-123',
        path: '/path/to/project',
        activeConfig: 'template-name',
        lastModified: '2026-04-15T10:00:00Z',
      }),
    };

    const mockUndoService = {
      undo: vi.fn().mockResolvedValue({
        backupTime: new Date('2026-04-15T10:30:00Z'),
        backupFilename: 'settings.json.2026-04-15T10-30-00-123Z',
        restored: true,
      }),
    };

    vi.mocked(AppState).mockImplementation(() => mockAppState as unknown as AppState);
    vi.mocked(ProjectIndex).mockImplementation(() => mockProjectIndex as unknown as ProjectIndex);
    vi.mocked(UndoService).mockImplementation(() => mockUndoService as unknown as UndoService);

    await executeUndoCommand();

    // Verify output contains success message
    expect(mockConsoleLog).toHaveBeenCalled();
    const output = mockConsoleLog.mock.calls.map(call => call.join(' ')).join('\n');
    expect(output).toContain('Restored settings.json from backup');
  });

  it('Test 6: CLI undo outputs "No backup available to undo" on failure', async () => {
    // Mock AppState returns active project
    const mockAppState = {
      getActiveProject: vi.fn().mockReturnValue('project-uuid-123'),
    };

    const mockProjectIndex = {
      getById: vi.fn().mockResolvedValue({
        id: 'project-uuid-123',
        path: '/path/to/project',
        activeConfig: 'template-name',
        lastModified: '2026-04-15T10:00:00Z',
      }),
    };

    // Mock UndoService.undo throws NO_BACKUP error
    const mockUndoService = {
      undo: vi.fn().mockRejectedValue(new ServiceError('No backup available to undo', 'NO_BACKUP')),
    };

    vi.mocked(AppState).mockImplementation(() => mockAppState as unknown as AppState);
    vi.mocked(ProjectIndex).mockImplementation(() => mockProjectIndex as unknown as ProjectIndex);
    vi.mocked(UndoService).mockImplementation(() => mockUndoService as unknown as UndoService);

    await executeUndoCommand();

    // Verify output contains no backup message
    expect(mockConsoleLog).toHaveBeenCalled();
    const output = mockConsoleLog.mock.calls.map(call => call.join(' ')).join('\n');
    expect(output).toContain('No backup available to undo');
  });

  it('Test 7: CLI undo shows backup filename and timing ("2 minutes ago")', async () => {
    // Mock AppState returns active project
    const mockAppState = {
      getActiveProject: vi.fn().mockReturnValue('project-uuid-123'),
    };

    const mockProjectIndex = {
      getById: vi.fn().mockResolvedValue({
        id: 'project-uuid-123',
        path: '/path/to/project',
        activeConfig: 'template-name',
        lastModified: '2026-04-15T10:00:00Z',
      }),
    };

    // Use a date 2 minutes ago
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
    const mockUndoService = {
      undo: vi.fn().mockResolvedValue({
        backupTime: twoMinutesAgo,
        backupFilename: 'settings.json.2026-04-15T10-30-00-123Z',
        restored: true,
      }),
    };

    vi.mocked(AppState).mockImplementation(() => mockAppState as unknown as AppState);
    vi.mocked(ProjectIndex).mockImplementation(() => mockProjectIndex as unknown as ProjectIndex);
    vi.mocked(UndoService).mockImplementation(() => mockUndoService as unknown as UndoService);

    await executeUndoCommand();

    // Verify output contains filename and timing
    expect(mockConsoleLog).toHaveBeenCalled();
    const output = mockConsoleLog.mock.calls.map(call => call.join(' ')).join('\n');
    expect(output).toContain('Backup: settings.json.2026-04-15T10-30-00-123Z');
    expect(output).toContain('2 minutes ago');
  });

  it('handles no active project gracefully', async () => {
    // Mock AppState returns no active project
    const mockAppState = {
      getActiveProject: vi.fn().mockReturnValue(null),
    };

    vi.mocked(AppState).mockImplementation(() => mockAppState as unknown as AppState);

    await executeUndoCommand();

    // Verify output contains no active project message
    expect(mockConsoleLog).toHaveBeenCalled();
    const output = mockConsoleLog.mock.calls.map(call => call.join(' ')).join('\n');
    expect(output).toContain('No active project set');
    expect(mockExit).toHaveBeenCalledWith(0);
  });

  it('handles project not found gracefully', async () => {
    // Mock AppState returns active project
    const mockAppState = {
      getActiveProject: vi.fn().mockReturnValue('project-uuid-123'),
    };

    // Mock ProjectIndex returns null (project not found)
    const mockProjectIndex = {
      getById: vi.fn().mockResolvedValue(null),
    };

    vi.mocked(AppState).mockImplementation(() => mockAppState as unknown as AppState);
    vi.mocked(ProjectIndex).mockImplementation(() => mockProjectIndex as unknown as ProjectIndex);

    await executeUndoCommand();

    // Verify output contains not found message
    expect(mockConsoleLog).toHaveBeenCalled();
    const output = mockConsoleLog.mock.calls.map(call => call.join(' ')).join('\n');
    expect(output).toContain('not found');
    expect(mockExit).toHaveBeenCalledWith(0);
  });
});