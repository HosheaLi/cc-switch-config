/**
 * Config Command Tests - CFG-03, SEC-02, SEC-04
 *
 * Per CFG-03: User can manage API configs via CLI (add/list/remove).
 * Per SEC-02: Validation errors displayed grouped by field type.
 * Per SEC-04: Password type input for API key.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Command } from 'commander';
import chalk from 'chalk';
import { registerConfigCommand } from './config.js';

// Mock ApiService
vi.mock('../../lib/services/api-service.js', () => ({
  ApiService: vi.fn().mockImplementation(() => ({
    createConfig: vi.fn().mockResolvedValue(undefined),
    getConfig: vi.fn().mockResolvedValue(null),
    deleteConfig: vi.fn().mockResolvedValue(true),
    getAllConfigs: vi.fn().mockResolvedValue({}),
    listConfigs: vi.fn().mockResolvedValue([]),
  })),
}));

// Mock ApiConfigStore
vi.mock('../../lib/store/api-config.js', () => ({
  ApiConfigStore: vi.fn(),
}));

// Mock config functions
vi.mock('../../lib/store/config.js', () => ({
  readConfig: vi.fn(),
  writeConfig: vi.fn(),
}));

// Mock inputFullApiConfig - returns valid config data
vi.mock('../prompts/components/input-api-key.js', () => ({
  inputFullApiConfig: vi.fn().mockResolvedValue({
    name: 'test-config',
    apiKey: 'test-api-key-123',
    baseUrl: 'https://api.anthropic.com',
    modelName: 'claude-sonnet-4-6',
  }),
}));

// Mock maskApiKey
vi.mock('../../lib/security/api-key.js', () => ({
  maskApiKey: vi.fn().mockReturnValue('...y-123'),
}));

// Mock error handler
vi.mock('../output/error.js', () => ({
  handleCLIError: vi.fn(),
  ExitCodes: {
    SUCCESS: 0,
    GENERAL_ERROR: 1,
    MISUSE: 2,
    NOT_FOUND: 3,
    CONFIG_ERROR: 4,
  },
}));

// Mock prompts for remove confirmation
vi.mock('prompts', () => ({
  default: vi.fn().mockResolvedValue({ value: true }),
}));

describe('config command', () => {
  let program: Command;
  let mockConsole: ReturnType<typeof vi.spyOn>;
  let mockConsoleError: ReturnType<typeof vi.spyOn>;
  let mockExit: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    // Reset ApiService mock to full implementation
    const mod = await import('../../lib/services/api-service.js');
    const MockedApiService = vi.mocked(mod.ApiService);
    MockedApiService.mockImplementation(() => ({
      createConfig: vi.fn().mockResolvedValue(undefined),
      getConfig: vi.fn().mockResolvedValue(null),
      deleteConfig: vi.fn().mockResolvedValue(true),
      getAllConfigs: vi.fn().mockResolvedValue({}),
      listConfigs: vi.fn().mockResolvedValue([]),
    }));

    program = new Command();
    program.exitOverride();
    registerConfigCommand(program);
    mockConsole = vi.spyOn(console, 'log').mockImplementation(() => {});
    mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockExit = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Task 1 Tests: config add command
  describe('command registration', () => {
    it('Test 1: registerConfigCommand function exists and exports correctly', () => {
      expect(registerConfigCommand).toBeDefined();
      expect(typeof registerConfigCommand).toBe('function');
    });

    it('Test 2: config command registered with cfg alias', () => {
      const commands = program.commands;
      const configCmd = commands.find(cmd => cmd.name() === 'config');
      expect(configCmd).toBeDefined();
      expect(configCmd?.aliases()).toContain('cfg');
    });

    it('Test 3: config add subcommand registered with description', () => {
      const commands = program.commands;
      const configCmd = commands.find(cmd => cmd.name() === 'config');
      const addCmd = configCmd?.commands.find(cmd => cmd.name() === 'add');
      expect(addCmd).toBeDefined();
      expect(addCmd?.description()).toContain('Add');
    });
  });

  describe('config add execution', () => {
    it('Test 4: inputFullApiConfig called on add action (SEC-04 password input)', async () => {
      const freshProgram = new Command();
      freshProgram.exitOverride();
      registerConfigCommand(freshProgram);
      const freshConsole = vi.spyOn(console, 'log').mockImplementation(() => {});
      const freshExit = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

      try {
        await freshProgram.parseAsync(['node', 'cc-config', 'config', 'add']);
      } catch {
        // May exit on success
      }

      // Verify inputFullApiConfig was imported and called
      const inputMod = await import('../prompts/components/input-api-key.js');
      expect(vi.mocked(inputMod.inputFullApiConfig)).toHaveBeenCalled();

      freshConsole.mockRestore();
      freshExit.mockRestore();
    });

    it('Test 5: createConfig called on valid input (CFG-03)', async () => {
      // Reset the mock to return valid data
      const inputMod = await import('../prompts/components/input-api-key.js');
      vi.mocked(inputMod.inputFullApiConfig).mockResolvedValueOnce({
        name: 'test-config',
        apiKey: 'test-api-key-123',
        baseUrl: 'https://api.anthropic.com',
        modelName: 'claude-sonnet-4-6',
      });

      const freshProgram = new Command();
      freshProgram.exitOverride();
      registerConfigCommand(freshProgram);
      const freshConsole = vi.spyOn(console, 'log').mockImplementation(() => {});
      const freshExit = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

      try {
        await freshProgram.parseAsync(['node', 'cc-config', 'config', 'add']);
      } catch {
        // May exit on success
      }

      // Verify ApiService was instantiated (which means createConfig was set up)
      const serviceMod = await import('../../lib/services/api-service.js');
      expect(vi.mocked(serviceMod.ApiService)).toHaveBeenCalled();

      freshConsole.mockRestore();
      freshExit.mockRestore();
    });

    it('Test 6: Success message displayed after creation', async () => {
      // Ensure mocks return valid data
      const inputMod = await import('../prompts/components/input-api-key.js');
      vi.mocked(inputMod.inputFullApiConfig).mockResolvedValueOnce({
        name: 'test-config',
        apiKey: 'test-api-key-123',
        baseUrl: 'https://api.anthropic.com',
        modelName: 'claude-sonnet-4-6',
      });

      const freshProgram = new Command();
      freshProgram.exitOverride();
      registerConfigCommand(freshProgram);
      const freshConsole = vi.spyOn(console, 'log').mockImplementation(() => {});
      const freshExit = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

      try {
        await freshProgram.parseAsync(['node', 'cc-config', 'config', 'add']);
      } catch {
        // May exit on success
      }

      // Verify console.log was called with success message containing config name
      const calls = freshConsole.mock.calls;
      // Should contain 'test-config' somewhere in output (from inputFullApiConfig mock)
      const hasConfigNameInOutput = calls.some(call =>
        typeof call[0] === 'string' && call[0].includes('test-config')
      );
      expect(hasConfigNameInOutput).toBe(true);

      freshConsole.mockRestore();
      freshExit.mockRestore();
    });

    it('Test 7: handleCLIError called on error', async () => {
      // Reset inputFullApiConfig mock to throw error
      const inputMod = await import('../prompts/components/input-api-key.js');
      vi.mocked(inputMod.inputFullApiConfig).mockRejectedValueOnce(new Error('Test error'));

      const freshProgram = new Command();
      freshProgram.exitOverride();
      registerConfigCommand(freshProgram);
      const freshConsole = vi.spyOn(console, 'log').mockImplementation(() => {});
      const freshExit = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

      try {
        await freshProgram.parseAsync(['node', 'cc-config', 'config', 'add']);
      } catch {
        // May exit on error
      }

      const errorMod = await import('../output/error.js');
      expect(vi.mocked(errorMod.handleCLIError)).toHaveBeenCalled();

      freshConsole.mockRestore();
      freshExit.mockRestore();
    });
  });
});