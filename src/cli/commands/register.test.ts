/**
 * Register Command Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { Command } from 'commander';

vi.mock('../utils/service-factory.js', () => ({
  createServices: vi.fn().mockReturnValue({
    projectIndex: {
      update: vi.fn().mockResolvedValue(true),
      getAll: vi.fn().mockResolvedValue([]),
    },
    appState: {
      get: vi.fn().mockReturnValue([]),
      set: vi.fn(),
      clear: vi.fn(),
    },
    projectService: {
      registerProject: vi.fn().mockResolvedValue({
        id: 'test-uuid',
        name: 'test-project',
        path: '/test/project',
        activeConfig: null,
        lastModified: new Date().toISOString(),
      }),
    },
    apiConfigStore: {},
    apiService: {},
  }),
}));

import { registerRegisterCommand, executeRegister } from './register.js';

describe('registerRegisterCommand', () => {
  let program: Command;
  let tempDir: string;

  beforeEach(async () => {
    program = new Command();
    program.exitOverride();
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'register-test-'));
  });

  afterEach(async () => {
    await fs.remove(tempDir);
    vi.clearAllMocks();
  });

  it('registers register command', () => {
    registerRegisterCommand(program);
    const commands = program.commands;
    expect(commands.some(c => c.name() === 'register')).toBe(true);
  });

  it('register command has correct description', () => {
    registerRegisterCommand(program);
    const cmd = program.commands.find(c => c.name() === 'register');
    expect(cmd?.description()).toContain('project');
  });

  it('register command has --template option', () => {
    registerRegisterCommand(program);
    const cmd = program.commands.find(c => c.name() === 'register');
    expect(cmd?.options.some(o => o.long === '--template')).toBe(true);
  });

  it('register command has -t alias for template', () => {
    registerRegisterCommand(program);
    const cmd = program.commands.find(c => c.name() === 'register');
    expect(cmd?.options.some(o => o.short === '-t')).toBe(true);
  });
});

describe('executeRegister', () => {
  let tempDir: string;
  let mockExit: ReturnType<typeof vi.spyOn>;
  let mockConsoleError: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'register-exec-test-'));
    mockExit = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
    mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(async () => {
    await fs.remove(tempDir);
    vi.clearAllMocks();
  });

  it('registers a project with .claude/settings.json', async () => {
    const projectPath = path.join(tempDir, 'project1');
    await fs.ensureDir(path.join(projectPath, '.claude'));
    await fs.writeJSON(path.join(projectPath, '.claude', 'settings.json'), {});

    await executeRegister(projectPath, {});

    const { createServices } = await import('../utils/service-factory.js');
    expect(vi.mocked(createServices)).toHaveBeenCalled();
  });

  it('registers a project with .claude/settings.local.json', async () => {
    const projectPath = path.join(tempDir, 'project2');
    await fs.ensureDir(path.join(projectPath, '.claude'));
    await fs.writeJSON(path.join(projectPath, '.claude', 'settings.local.json'), {});

    await executeRegister(projectPath, {});

    const { createServices } = await import('../utils/service-factory.js');
    expect(vi.mocked(createServices)).toHaveBeenCalled();
  });

  it('rejects project without .claude directory', async () => {
    const projectPath = path.join(tempDir, 'project3');
    await fs.ensureDir(projectPath);

    await executeRegister(projectPath, {});

    expect(mockExit).toHaveBeenCalledWith(2); // ExitCodes.MISUSE
    expect(mockConsoleError).toHaveBeenCalled();
  });

  it('throws error for non-existent path', async () => {
    const nonExistentPath = path.join(tempDir, 'nonexistent');

    await expect(executeRegister(nonExistentPath, {})).rejects.toThrow();
  });
});
