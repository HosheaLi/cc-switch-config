/**
 * Unregister Command Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import path from 'path';
import os from 'os';
import { Command } from 'commander';

vi.mock('../utils/service-factory.js', () => ({
  createServices: vi.fn().mockReturnValue({
    projectIndex: {
      resolve: vi.fn().mockResolvedValue({
        id: 'test-uuid',
        name: 'test-project',
        path: '/test/project',
        activeConfig: null,
        lastModified: new Date().toISOString(),
      }),
    },
    projectService: {
      removeProject: vi.fn().mockResolvedValue(true),
    },
  }),
}));

vi.mock('../prompts/components/confirm-action.js', () => ({
  confirmAction: vi.fn().mockResolvedValue(true),
}));

import { registerUnregisterCommand, executeUnregister } from './unregister.js';
import { confirmAction } from '../prompts/components/confirm-action.js';

describe('registerUnregisterCommand', () => {
  let program: Command;

  beforeEach(() => {
    program = new Command();
    program.exitOverride();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('registers unregister command', () => {
    registerUnregisterCommand(program);
    const commands = program.commands;
    expect(commands.some(c => c.name() === 'unregister')).toBe(true);
  });

  it('unregister command has correct description', () => {
    registerUnregisterCommand(program);
    const cmd = program.commands.find(c => c.name() === 'unregister');
    expect(cmd?.description()).toContain('index');
  });

  it('unregister command has --force option', () => {
    registerUnregisterCommand(program);
    const cmd = program.commands.find(c => c.name() === 'unregister');
    expect(cmd?.options.some(o => o.long === '--force')).toBe(true);
  });

  it('unregister command accepts project argument', () => {
    registerUnregisterCommand(program);
    const cmd = program.commands.find(c => c.name() === 'unregister');
    const args = cmd?.registeredArguments;
    expect(args?.some(a => a.name() === 'project')).toBe(true);
  });
});

describe('executeUnregister', () => {
  let mockExit: ReturnType<typeof vi.spyOn>;
  let mockConsoleError: ReturnType<typeof vi.spyOn>;
  let mockConsoleLog: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    mockExit = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
    mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockConsoleLog = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('unregisters a project by name', async () => {
    await executeUnregister('test-project', { force: true });

    const { createServices } = await import('../utils/service-factory.js');
    expect(vi.mocked(createServices)).toHaveBeenCalled();
  });

  it('calls confirmAction without --force', async () => {
    await executeUnregister('test-project', {});

    expect(vi.mocked(confirmAction)).toHaveBeenCalled();
  });

  it('skips confirmAction with --force', async () => {
    vi.clearAllMocks();
    await executeUnregister('test-project', { force: true });

    expect(vi.mocked(confirmAction)).not.toHaveBeenCalled();
  });

  it('exits with NOT_FOUND when project not resolved', async () => {
    const { createServices } = await import('../utils/service-factory.js');
    const mockedServices = vi.mocked(createServices);
    mockedServices.mockReturnValueOnce({
      ...mockedServices(),
      projectIndex: {
        resolve: vi.fn().mockResolvedValue(null),
      },
    } as never);

    await executeUnregister('nonexistent', { force: true });

    expect(mockExit).toHaveBeenCalledWith(3); // ExitCodes.NOT_FOUND
  });
});
