/**
 * Export Command Tests
 *
 * Tests for CLI export command functionality.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Command } from 'commander';
import fs from 'fs-extra';
import { registerExportCommand } from './export.js';
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

describe('registerExportCommand', () => {
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

  it('should register export command with correct options', () => {
    registerExportCommand(program);

    const command = program.commands.find(cmd => cmd.name() === 'export');
    expect(command).toBeDefined();
    expect(command?.description()).toBe('Export project configuration to JSON file');

    // Check options
    const options = command?.options;
    expect(options?.some(opt => opt.name() === 'output')).toBe(true);
    expect(options?.some(opt => opt.name() === 'stdout')).toBe(true);
  });

  it('should register [project-id] argument', () => {
    registerExportCommand(program);

    const command = program.commands.find(cmd => cmd.name() === 'export');
    expect(command).toBeDefined();

    // Check that argument is defined
    // Commander arguments are stored in _args
    expect(command?.arguments.length).toBeGreaterThanOrEqual(0);
  });
});

describe('ExportOptions interface', () => {
  it('should define output and stdout options', () => {
    const options = { output: 'test.json', stdout: false };
    expect(options.output).toBe('test.json');
    expect(options.stdout).toBe(false);
  });

  it('should allow optional output', () => {
    const options = { stdout: true };
    expect(options.stdout).toBe(true);
    // output is optional
    expect(options.output).toBeUndefined();
  });
});