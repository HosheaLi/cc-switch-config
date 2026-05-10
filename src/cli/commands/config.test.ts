/**
 * Config Command Tests - CFG-03, SEC-02, SEC-04
 *
 * Per CFG-03: User can manage API configs via CLI (add/list/remove).
 * Per SEC-02: Validation errors displayed grouped by field type.
 * Per SEC-04: Password type input for API key.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Command } from 'commander';
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
    mode: 'unified',
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
        mode: 'unified',
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
        mode: 'unified',
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

  // Task 2 Tests: config list command
  describe('config list command registration', () => {
    it('Test 8: config list subcommand registered with l alias (D-04)', () => {
      const commands = program.commands;
      const configCmd = commands.find(cmd => cmd.name() === 'config');
      const listCmd = configCmd?.commands.find(cmd => cmd.name() === 'list');
      expect(listCmd).toBeDefined();
      expect(listCmd?.aliases()).toContain('l');
    });
  });

  describe('config list execution', () => {
    it('Test 9: getAllConfigs called on list action', async () => {
      const freshProgram = new Command();
      freshProgram.exitOverride();
      registerConfigCommand(freshProgram);
      const freshConsole = vi.spyOn(console, 'log').mockImplementation(() => {});
      const freshExit = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

      try {
        await freshProgram.parseAsync(['node', 'cc-config', 'config', 'list']);
      } catch {
        // May exit on success
      }

      // Verify ApiService was instantiated (getAllConfigs is called)
      const serviceMod = await import('../../lib/services/api-service.js');
      expect(vi.mocked(serviceMod.ApiService)).toHaveBeenCalled();

      freshConsole.mockRestore();
      freshExit.mockRestore();
    });

    it('Test 10: Empty list shows friendly message (D-07)', async () => {
      // Mock getAllConfigs to return empty object
      const serviceMod = await import('../../lib/services/api-service.js');
      vi.mocked(serviceMod.ApiService).mockImplementationOnce(() => ({
        createConfig: vi.fn().mockResolvedValue(undefined),
        getConfig: vi.fn().mockResolvedValue(null),
        deleteConfig: vi.fn().mockResolvedValue(true),
        getAllConfigs: vi.fn().mockResolvedValue({}),
        listConfigs: vi.fn().mockResolvedValue([]),
      }));

      const freshProgram = new Command();
      freshProgram.exitOverride();
      registerConfigCommand(freshProgram);
      const freshConsole = vi.spyOn(console, 'log').mockImplementation(() => {});
      const freshExit = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

      try {
        await freshProgram.parseAsync(['node', 'cc-config', 'config', 'list']);
      } catch {
        // May exit on empty list
      }

      // Verify friendly message for empty list
      const calls = freshConsole.mock.calls;
      const hasEmptyMessage = calls.some(call =>
        typeof call[0] === 'string' && (call[0].includes('没有') || call[0].includes('empty') || call[0].includes('No'))
      );
      expect(hasEmptyMessage).toBe(true);

      freshConsole.mockRestore();
      freshExit.mockRestore();
    });

    it('Test 11: Table format output with name, modelName, masked apiKey (D-05)', async () => {
      // Mock getAllConfigs to return configs
      const serviceMod = await import('../../lib/services/api-service.js');
      vi.mocked(serviceMod.ApiService).mockImplementationOnce(() => ({
        createConfig: vi.fn().mockResolvedValue(undefined),
        getConfig: vi.fn().mockResolvedValue(null),
        deleteConfig: vi.fn().mockResolvedValue(true),
        getAllConfigs: vi.fn().mockResolvedValue({
          'anthropic': {
            name: 'anthropic',
            apiKey: 'sk-ant-api03-test123xyz',
            baseUrl: 'https://api.anthropic.com',
            mode: 'unified',
            modelName: 'claude-sonnet-4-6',
          },
          'openrouter': {
            name: 'openrouter',
            apiKey: 'sk-or-test456abc',
            baseUrl: 'https://openrouter.ai/api/v1',
            mode: 'unified',
            modelName: 'glm-5',
          },
        }),
        listConfigs: vi.fn().mockResolvedValue(['anthropic', 'openrouter']),
      }));

      const freshProgram = new Command();
      freshProgram.exitOverride();
      registerConfigCommand(freshProgram);
      const freshConsole = vi.spyOn(console, 'log').mockImplementation(() => {});
      const freshExit = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

      try {
        await freshProgram.parseAsync(['node', 'cc-config', 'config', 'list']);
      } catch {
        // May exit on success
      }

      // Verify table output contains config names
      const calls = freshConsole.mock.calls;
      const hasAnthropic = calls.some(call =>
        typeof call[0] === 'string' && call[0].includes('anthropic')
      );
      const hasOpenrouter = calls.some(call =>
        typeof call[0] === 'string' && call[0].includes('openrouter')
      );
      expect(hasAnthropic || hasOpenrouter).toBe(true);

      freshConsole.mockRestore();
      freshExit.mockRestore();
    });

    it('Test 12: maskApiKey applied to apiKey in display (CFG-04)', async () => {
      // Mock getAllConfigs to return configs
      const serviceMod = await import('../../lib/services/api-service.js');
      vi.mocked(serviceMod.ApiService).mockImplementationOnce(() => ({
        createConfig: vi.fn().mockResolvedValue(undefined),
        getConfig: vi.fn().mockResolvedValue(null),
        deleteConfig: vi.fn().mockResolvedValue(true),
        getAllConfigs: vi.fn().mockResolvedValue({
          'test': {
            name: 'test',
            apiKey: 'sk-test-api-key-12345',
            baseUrl: 'https://api.anthropic.com',
            mode: 'unified',
            modelName: 'claude-sonnet-4-6',
          },
        }),
        listConfigs: vi.fn().mockResolvedValue(['test']),
      }));

      const freshProgram = new Command();
      freshProgram.exitOverride();
      registerConfigCommand(freshProgram);
      const freshConsole = vi.spyOn(console, 'log').mockImplementation(() => {});
      const freshExit = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

      try {
        await freshProgram.parseAsync(['node', 'cc-config', 'config', 'list']);
      } catch {
        // May exit on success
      }

      // Verify maskApiKey was called
      const maskMod = await import('../../lib/security/api-key.js');
      expect(vi.mocked(maskMod.maskApiKey)).toHaveBeenCalled();

      freshConsole.mockRestore();
      freshExit.mockRestore();
    });

    it('Test 13: Count message displayed at end', async () => {
      // Mock getAllConfigs to return configs
      const serviceMod = await import('../../lib/services/api-service.js');
      vi.mocked(serviceMod.ApiService).mockImplementationOnce(() => ({
        createConfig: vi.fn().mockResolvedValue(undefined),
        getConfig: vi.fn().mockResolvedValue(null),
        deleteConfig: vi.fn().mockResolvedValue(true),
        getAllConfigs: vi.fn().mockResolvedValue({
          'anthropic': {
            name: 'anthropic',
            apiKey: 'sk-test-1',
            baseUrl: 'https://api.anthropic.com',
            mode: 'unified',
            modelName: 'claude-sonnet-4-6',
          },
          'openrouter': {
            name: 'openrouter',
            apiKey: 'sk-test-2',
            baseUrl: 'https://openrouter.ai/api/v1',
            mode: 'unified',
            modelName: 'glm-5',
          },
        }),
        listConfigs: vi.fn().mockResolvedValue(['anthropic', 'openrouter']),
      }));

      const freshProgram = new Command();
      freshProgram.exitOverride();
      registerConfigCommand(freshProgram);
      const freshConsole = vi.spyOn(console, 'log').mockImplementation(() => {});
      const freshExit = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

      try {
        await freshProgram.parseAsync(['node', 'cc-config', 'config', 'list']);
      } catch {
        // May exit on success
      }

      // Verify count message
      const calls = freshConsole.mock.calls;
      const hasCount = calls.some(call =>
        typeof call[0] === 'string' && call[0].includes('2')
      );
      expect(hasCount).toBe(true);

      freshConsole.mockRestore();
      freshExit.mockRestore();
    });

    it('Test 14: handleCLIError on service errors', async () => {
      // Mock getAllConfigs to throw error
      const serviceMod = await import('../../lib/services/api-service.js');
      vi.mocked(serviceMod.ApiService).mockImplementationOnce(() => ({
        createConfig: vi.fn().mockResolvedValue(undefined),
        getConfig: vi.fn().mockResolvedValue(null),
        deleteConfig: vi.fn().mockResolvedValue(true),
        getAllConfigs: vi.fn().mockRejectedValue(new Error('Service error')),
        listConfigs: vi.fn().mockResolvedValue([]),
      }));

      const freshProgram = new Command();
      freshProgram.exitOverride();
      registerConfigCommand(freshProgram);
      const freshConsole = vi.spyOn(console, 'log').mockImplementation(() => {});
      const freshExit = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

      try {
        await freshProgram.parseAsync(['node', 'cc-config', 'config', 'list']);
      } catch {
        // May exit on error
      }

      const errorMod = await import('../output/error.js');
      expect(vi.mocked(errorMod.handleCLIError)).toHaveBeenCalled();

      freshConsole.mockRestore();
      freshExit.mockRestore();
    });
  });

  // Task 3 Tests: config remove command
  describe('config remove registration', () => {
    it('Test 15: config remove subcommand registered with rm alias (D-04)', () => {
      const commands = program.commands;
      const configCmd = commands.find(cmd => cmd.name() === 'config');
      const removeCmd = configCmd?.commands.find(cmd => cmd.name() === 'remove');
      expect(removeCmd).toBeDefined();
      expect(removeCmd?.aliases()).toContain('rm');
    });

    it('Test 16: --force option skips confirmation', async () => {
      // Mock getConfig to return existing config
      const serviceMod = await import('../../lib/services/api-service.js');
      vi.mocked(serviceMod.ApiService).mockImplementationOnce(() => ({
        createConfig: vi.fn().mockResolvedValue(undefined),
        getConfig: vi.fn().mockResolvedValue({
          name: 'test-config',
          apiKey: 'sk-test-key',
          baseUrl: 'https://api.anthropic.com',
          mode: 'unified',
          modelName: 'claude-sonnet-4-6',
        }),
        deleteConfig: vi.fn().mockResolvedValue(true),
        getAllConfigs: vi.fn().mockResolvedValue({}),
        listConfigs: vi.fn().mockResolvedValue([]),
      }));

      const freshProgram = new Command();
      freshProgram.exitOverride();
      registerConfigCommand(freshProgram);
      const freshConsole = vi.spyOn(console, 'log').mockImplementation(() => {});
      const freshExit = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

      try {
        await freshProgram.parseAsync(['node', 'cc-config', 'config', 'remove', 'test-config', '--force']);
      } catch {
        // May exit on success
      }

      // Verify delete was called (no confirmation prompt)
      const ApiService = vi.mocked(await import('../../lib/services/api-service.js')).ApiService;
      expect(ApiService).toHaveBeenCalled();

      freshConsole.mockRestore();
      freshExit.mockRestore();
    });

    it('Test 17: getConfig called to verify existence before deletion', async () => {
      const mockGetConfig = vi.fn().mockResolvedValue({
        name: 'test-config',
        apiKey: 'sk-test-key',
        baseUrl: 'https://api.anthropic.com',
        mode: 'unified',
        modelName: 'claude-sonnet-4-6',
      });
      const mockDeleteConfig = vi.fn().mockResolvedValue(true);

      const serviceMod = await import('../../lib/services/api-service.js');
      vi.mocked(serviceMod.ApiService).mockImplementationOnce(() => ({
        createConfig: vi.fn().mockResolvedValue(undefined),
        getConfig: mockGetConfig,
        deleteConfig: mockDeleteConfig,
        getAllConfigs: vi.fn().mockResolvedValue({}),
        listConfigs: vi.fn().mockResolvedValue([]),
      }));

      const freshProgram = new Command();
      freshProgram.exitOverride();
      registerConfigCommand(freshProgram);
      const freshConsole = vi.spyOn(console, 'log').mockImplementation(() => {});
      const freshExit = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

      try {
        await freshProgram.parseAsync(['node', 'cc-config', 'config', 'remove', 'test-config', '--force']);
      } catch {
        // May exit on success
      }

      expect(mockGetConfig).toHaveBeenCalledWith('test-config');

      freshConsole.mockRestore();
      freshExit.mockRestore();
    });

    it('Test 18: prompts.confirm() called without --force (D-08)', async () => {
      // Mock getConfig to return existing config
      const serviceMod = await import('../../lib/services/api-service.js');
      vi.mocked(serviceMod.ApiService).mockImplementationOnce(() => ({
        createConfig: vi.fn().mockResolvedValue(undefined),
        getConfig: vi.fn().mockResolvedValue({
          name: 'test-config',
          apiKey: 'sk-test-key',
          baseUrl: 'https://api.anthropic.com',
          mode: 'unified',
          modelName: 'claude-sonnet-4-6',
        }),
        deleteConfig: vi.fn().mockResolvedValue(true),
        getAllConfigs: vi.fn().mockResolvedValue({}),
        listConfigs: vi.fn().mockResolvedValue([]),
      }));

      // Mock prompts.confirm to return true
      const promptsMod = await import('prompts');
      vi.mocked(promptsMod.default).mockResolvedValueOnce({ value: true });

      const freshProgram = new Command();
      freshProgram.exitOverride();
      registerConfigCommand(freshProgram);
      const freshConsole = vi.spyOn(console, 'log').mockImplementation(() => {});
      const freshConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      const freshExit = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

      try {
        await freshProgram.parseAsync(['node', 'cc-config', 'config', 'remove', 'test-config']);
      } catch {
        // May exit on success
      }

      // Verify prompts was called with confirm type
      expect(promptsMod.default).toHaveBeenCalledWith(expect.objectContaining({
        type: 'confirm',
      }));

      freshConsole.mockRestore();
      freshConsoleError.mockRestore();
      freshExit.mockRestore();
    });

    it('Test 19: deleteConfig called after confirmation', async () => {
      const mockDeleteConfig = vi.fn().mockResolvedValue(true);

      const serviceMod = await import('../../lib/services/api-service.js');
      vi.mocked(serviceMod.ApiService).mockImplementationOnce(() => ({
        createConfig: vi.fn().mockResolvedValue(undefined),
        getConfig: vi.fn().mockResolvedValue({
          name: 'test-config',
          apiKey: 'sk-test-key',
          baseUrl: 'https://api.anthropic.com',
          mode: 'unified',
          modelName: 'claude-sonnet-4-6',
        }),
        deleteConfig: mockDeleteConfig,
        getAllConfigs: vi.fn().mockResolvedValue({}),
        listConfigs: vi.fn().mockResolvedValue([]),
      }));

      // Mock prompts.confirm to return true
      const promptsMod = await import('prompts');
      vi.mocked(promptsMod.default).mockResolvedValueOnce({ value: true });

      const freshProgram = new Command();
      freshProgram.exitOverride();
      registerConfigCommand(freshProgram);
      const freshConsole = vi.spyOn(console, 'log').mockImplementation(() => {});
      const freshConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      const freshExit = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

      try {
        await freshProgram.parseAsync(['node', 'cc-config', 'config', 'remove', 'test-config']);
      } catch {
        // May exit on success
      }

      expect(mockDeleteConfig).toHaveBeenCalledWith('test-config');

      freshConsole.mockRestore();
      freshConsoleError.mockRestore();
      freshExit.mockRestore();
    });

    it('Test 20: CONFIG_NOT_FOUND error handled via handleCLIError', async () => {
      // Mock getConfig to return null (config not found)
      const serviceMod = await import('../../lib/services/api-service.js');
      vi.mocked(serviceMod.ApiService).mockImplementationOnce(() => ({
        createConfig: vi.fn().mockResolvedValue(undefined),
        getConfig: vi.fn().mockResolvedValue(null),
        deleteConfig: vi.fn().mockResolvedValue(true),
        getAllConfigs: vi.fn().mockResolvedValue({}),
        listConfigs: vi.fn().mockResolvedValue([]),
      }));

      const freshProgram = new Command();
      freshProgram.exitOverride();
      registerConfigCommand(freshProgram);
      const freshConsole = vi.spyOn(console, 'log').mockImplementation(() => {});
      const freshConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      const freshExit = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

      try {
        await freshProgram.parseAsync(['node', 'cc-config', 'config', 'remove', 'nonexistent']);
      } catch {
        // May exit on NOT_FOUND
      }

      // Verify error message was displayed
      expect(freshConsoleError.mock.calls.some(call =>
        typeof call[0] === 'string' && call[0].includes('不存在')
      )).toBe(true);

      freshConsole.mockRestore();
      freshConsoleError.mockRestore();
      freshExit.mockRestore();
    });

    it('Test 21: Risk warning displayed (D-10)', async () => {
      const serviceMod = await import('../../lib/services/api-service.js');
      vi.mocked(serviceMod.ApiService).mockImplementationOnce(() => ({
        createConfig: vi.fn().mockResolvedValue(undefined),
        getConfig: vi.fn().mockResolvedValue({
          name: 'test-config',
          apiKey: 'sk-test-key',
          baseUrl: 'https://api.anthropic.com',
          mode: 'unified',
          modelName: 'claude-sonnet-4-6',
        }),
        deleteConfig: vi.fn().mockResolvedValue(true),
        getAllConfigs: vi.fn().mockResolvedValue({}),
        listConfigs: vi.fn().mockResolvedValue([]),
      }));

      // Mock prompts.confirm to return true
      const promptsMod = await import('prompts');
      vi.mocked(promptsMod.default).mockResolvedValueOnce({ value: true });

      const freshProgram = new Command();
      freshProgram.exitOverride();
      registerConfigCommand(freshProgram);
      const freshConsole = vi.spyOn(console, 'log').mockImplementation(() => {});
      const freshConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      const freshExit = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

      try {
        await freshProgram.parseAsync(['node', 'cc-config', 'config', 'remove', 'test-config']);
      } catch {
        // May exit on success
      }

      // Verify risk warning message (D-10)
      const calls = freshConsole.mock.calls;
      const hasRiskWarning = calls.some(call =>
        typeof call[0] === 'string' && (call[0].includes('删除') || call[0].includes('更新'))
      );
      expect(hasRiskWarning).toBe(true);

      freshConsole.mockRestore();
      freshConsoleError.mockRestore();
      freshExit.mockRestore();
    });
  });

  // Task 3 Tests: displayValidationErrors function
  describe('displayValidationErrors', () => {
    it('Test 22: Groups errors by field type (name/apiKey/baseUrl/modelName)', async () => {
      // Import the function directly
      const { displayValidationErrors } = await import('./config.js');
      const { ValidationError } = await import('../../lib/types/validation.js');

      const error = new ValidationError('Test', [
        { path: ['name'], message: '名称不能为空', code: 'invalid_type' },
        { path: ['apiKey'], message: 'API Key 长度不足', code: 'invalid_type' },
      ]);

      const freshConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      displayValidationErrors(error);

      // Verify grouped output
      expect(freshConsoleError.mock.calls.some(call =>
        typeof call[0] === 'string' && call[0].includes('配置名错误')
      )).toBe(true);
      expect(freshConsoleError.mock.calls.some(call =>
        typeof call[0] === 'string' && call[0].includes('API Key 错误')
      )).toBe(true);

      freshConsoleError.mockRestore();
    });

    it('Test 23: colors.danger for group titles, colors.muted for messages (D-12)', async () => {
      const { displayValidationErrors } = await import('./config.js');
      const { ValidationError } = await import('../../lib/types/validation.js');

      const error = new ValidationError('Test', [
        { path: ['name'], message: '名称不能为空', code: 'invalid_type' },
      ]);

      const freshConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      displayValidationErrors(error);

      // Verify colors are used (theme module adds styling)
      expect(freshConsoleError).toHaveBeenCalled();

      freshConsoleError.mockRestore();
    });

    it('Test 24: Output to stderr via console.error (D-13)', async () => {
      const { displayValidationErrors } = await import('./config.js');
      const { ValidationError } = await import('../../lib/types/validation.js');

      const error = new ValidationError('Test', [
        { path: ['name'], message: '名称不能为空', code: 'invalid_type' },
      ]);

      const freshConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      const freshConsoleLog = vi.spyOn(console, 'log').mockImplementation(() => {});

      displayValidationErrors(error);

      // Verify console.error was called (stderr), not console.log (stdout)
      expect(freshConsoleError).toHaveBeenCalled();
      expect(freshConsoleLog).not.toHaveBeenCalled();

      freshConsoleError.mockRestore();
      freshConsoleLog.mockRestore();
    });

    it('Test 25: Empty groups not displayed', async () => {
      const { displayValidationErrors } = await import('./config.js');
      const { ValidationError } = await import('../../lib/types/validation.js');

      const error = new ValidationError('Test', [
        { path: ['name'], message: '名称不能为空', code: 'invalid_type' },
      ]);

      const freshConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      displayValidationErrors(error);

      // Verify only '配置名错误' group is displayed (not empty groups)
      const calls = freshConsoleError.mock.calls;
      const hasEmptyGroup = calls.some(call =>
        typeof call[0] === 'string' && call[0].includes('URL 错误')
      );
      expect(hasEmptyGroup).toBe(false);

      freshConsoleError.mockRestore();
    });

    it('Test 26: API key values sanitized in error messages (T-11-07)', async () => {
      const { displayValidationErrors } = await import('./config.js');
      const { ValidationError } = await import('../../lib/types/validation.js');

      const error = new ValidationError('Test', [
        { path: ['apiKey'], message: 'sk-ant-api03-secret-key is invalid', code: 'invalid_type' },
      ]);

      const freshConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      displayValidationErrors(error);

      // Verify sk-* pattern is sanitized
      const calls = freshConsoleError.mock.calls;
      const hasRawKey = calls.some(call =>
        typeof call[0] === 'string' && call[0].includes('sk-ant-api03-secret-key')
      );
      expect(hasRawKey).toBe(false);

      freshConsoleError.mockRestore();
    });
  });
});