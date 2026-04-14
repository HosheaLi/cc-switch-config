import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Command } from 'commander';

vi.mock('../../lib/services/index.js', () => ({
  ProjectService: vi.fn().mockImplementation(() => ({
    listProjects: vi.fn().mockResolvedValue([
      { id: 'test-1', path: '/test/project1', activeConfig: 'template-a', lastModified: '2026-04-14T00:00:00Z' },
      { id: 'test-2', path: '/test/project2', activeConfig: null, lastModified: '2026-04-14T00:00:00Z' },
    ]),
  })),
}));

vi.mock('../../lib/store/project.js', () => ({
  ProjectIndex: vi.fn(),
}));

vi.mock('../../lib/store/state.js', () => ({
  AppState: vi.fn(),
}));

vi.mock('../output/table.js', () => ({
  formatProjectTable: vi.fn().mockReturnValue('formatted-table'),
}));

vi.mock('../output/error.js', () => ({
  handleCLIError: vi.fn(),
}));

import { registerListCommand } from './list.js';

describe('list command', () => {
  let program: Command;

  beforeEach(() => {
    vi.clearAllMocks();
    program = new Command();
    program.exitOverride();
    registerListCommand(program);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('command registration', () => {
    it('registers list command', () => {
      const listCmd = program.commands.find(cmd => cmd.name() === 'list');
      expect(listCmd).toBeDefined();
    });

    it('registers ls alias', () => {
      const listCmd = program.commands.find(cmd => cmd.name() === 'list');
      expect(listCmd?.aliases()).toContain('ls');
    });

    it('registers --json option', () => {
      const listCmd = program.commands.find(cmd => cmd.name() === 'list');
      expect(listCmd?.options.some(opt => opt.long === '--json')).toBe(true);
    });

    it('has correct description', () => {
      const listCmd = program.commands.find(cmd => cmd.name() === 'list');
      expect(listCmd?.description()).toContain('projects');
    });
  });
});
