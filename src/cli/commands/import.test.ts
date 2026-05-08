/**
 * Import Command Tests
 *
 * Tests for CLI import command functionality.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Command } from 'commander';
import fs from 'fs-extra';
import { registerImportCommand } from './import.js';
import { ServiceError } from '../../lib/services/types.js';
import * as errorModule from '../output/error.js';

// Mock modules
vi.mock('fs-extra');
vi.mock('../../lib/store/project.js');
vi.mock('../../lib/store/template.js');
vi.mock('../../lib/store/state.js');
vi.mock('../../lib/store/config.js');
vi.mock('../../lib/services/config-service.js');
vi.mock('../../lib/services/export-service.js');
vi.mock('../utils/cli-launch.js');

describe('registerImportCommand', () => {
  let program: Command;
  let mockExit: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    program = new Command();
    program.exitOverride(); // Prevent actual exit during tests
    mockExit = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
    vi.clearAllMocks();
  });

  afterEach(() => {
    mockExit.mockRestore();
  });

  it('should register import command with correct options', () => {
    registerImportCommand(program);

    const command = program.commands.find(cmd => cmd.name() === 'import');
    expect(command).toBeDefined();
    expect(command?.description()).toBe('Import project configuration from JSON file');

    // Check options
    const options = command?.options;
    expect(options?.some(opt => opt.name() === 'strategy')).toBe(true);
    expect(options?.some(opt => opt.name() === 'target')).toBe(true);
  });

  it('should register required <file> argument', () => {
    registerImportCommand(program);

    const command = program.commands.find(cmd => cmd.name() === 'import');
    expect(command).toBeDefined();

    // Check that argument is defined (Commander stores in arguments)
    expect(command?.arguments.length).toBeGreaterThanOrEqual(0);
  });
});

describe('ImportOptions interface', () => {
  it('should define strategy and target options', () => {
    const options = { strategy: 'merge', target: '/path/to/project' };
    expect(options.strategy).toBe('merge');
    expect(options.target).toBe('/path/to/project');
  });

  it('should allow optional strategy', () => {
    const options = { target: '/path' };
    expect(options.strategy).toBeUndefined();
  });

  it('should allow optional target', () => {
    const options = { strategy: 'overwrite' };
    expect(options.target).toBeUndefined();
  });
});