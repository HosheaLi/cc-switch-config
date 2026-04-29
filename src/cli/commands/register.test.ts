/**
 * Register Command Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { Command } from 'commander';

// Mock the services before importing the module
vi.mock('../../lib/store/project.js', () => ({
  ProjectIndex: vi.fn().mockImplementation(() => ({
    register: vi.fn().mockResolvedValue({
      id: 'test-uuid',
      name: 'test-project',
      path: '/test/project',
      activeConfig: null,
      lastModified: new Date().toISOString(),
    }),
    update: vi.fn().mockResolvedValue(true),
    getAll: vi.fn().mockResolvedValue([]),
    clearCache: vi.fn(),
  })),
}));

vi.mock('../../lib/store/state.js', () => ({
  AppState: vi.fn().mockImplementation(() => ({
    get: vi.fn().mockReturnValue([]),
    set: vi.fn(),
    clear: vi.fn(),
  })),
}));

vi.mock('../../lib/services/index.js', () => ({
  ProjectService: vi.fn().mockImplementation(() => ({
    registerProject: vi.fn().mockResolvedValue({
      id: 'test-uuid',
      name: 'test-project',
      path: '/test/project',
      activeConfig: null,
      lastModified: new Date().toISOString(),
    }),
  })),
}));

import { registerRegisterCommand, executeRegister } from './register.js';

describe('registerRegisterCommand', () => {
  let program: Command;
  let tempDir: string;

  beforeEach(async () => {
    program = new Command();
    program.exitOverride(); // Prevent actual exit during tests
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

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'register-exec-test-'));
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

    // The mock should have been called
    const { ProjectService } = await import('../../lib/services/index.js');
    expect(vi.mocked(ProjectService)).toHaveBeenCalled();
  });

  it('registers a project with .claude/settings.local.json', async () => {
    const projectPath = path.join(tempDir, 'project2');
    await fs.ensureDir(path.join(projectPath, '.claude'));
    await fs.writeJSON(path.join(projectPath, '.claude', 'settings.local.json'), {});

    await executeRegister(projectPath, {});

    const { ProjectService } = await import('../../lib/services/index.js');
    expect(vi.mocked(ProjectService)).toHaveBeenCalled();
  });

  it('registers a project without .claude directory', async () => {
    const projectPath = path.join(tempDir, 'project3');
    await fs.ensureDir(projectPath);

    // Should succeed but with warning
    await executeRegister(projectPath, {});

    const { ProjectService } = await import('../../lib/services/index.js');
    expect(vi.mocked(ProjectService)).toHaveBeenCalled();
  });

  it('throws error for non-existent path', async () => {
    const nonExistentPath = path.join(tempDir, 'nonexistent');

    await expect(executeRegister(nonExistentPath, {})).rejects.toThrow();
  });
});