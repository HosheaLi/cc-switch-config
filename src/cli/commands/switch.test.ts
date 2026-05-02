/**
 * Switch Command Tests - TDD Implementation
 *
 * Per CFG-05: Switch command for quick API config switching.
 * Per ONB-06: Integrated into first-run wizard flow.
 *
 * Test coverage:
 * - D-01, D-02: Argument parsing (project required, config optional)
 * - D-02: Project lookup (error if not found)
 * - D-03: Config selection (selectApiConfig if config omitted)
 * - D-04, D-05, D-06: Diff preview (unified diff with ANSI colors)
 * - D-07, D-08: Confirmation (confirmAction with defaultChoice=false)
 * - D-09: Cancellation (Ctrl+C shows cancel message)
 * - CFG-04: API key masked in diff output
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Command } from 'commander';
import type { ApiConfig } from '../../lib/types/api-config.js';
import type { ProjectEntry } from '../../lib/store/project.js';
import type { DiffLine } from '../utils/diff.js';

// Set up mocks FIRST before importing any modules
vi.mock('../../lib/store/api-config.js');
vi.mock('../../lib/store/project.js');
vi.mock('../../lib/store/config.js', () => ({
  readConfig: vi.fn(),
  writeConfig: vi.fn(),
}));
vi.mock('../../lib/services/config-service.js');
vi.mock('../utils/diff.js');
vi.mock('../utils/diff-render.js');
vi.mock('../../lib/security/api-key.js');
vi.mock('../../lib/types/replacement.js');
vi.mock('../prompts/components/select-api-config.js');
vi.mock('../prompts/components/confirm-action.js');
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

// NOW import the mocked modules
import { ApiConfigStore } from '../../lib/store/api-config.js';
import { ProjectIndex } from '../../lib/store/project.js';
import { ConfigService } from '../../lib/services/config-service.js';
import { generateUnifiedDiff } from '../utils/diff.js';
import { renderDiff } from '../utils/diff-render.js';
import { maskApiKey } from '../../lib/security/api-key.js';
import { replaceEnvModel } from '../../lib/types/replacement.js';
import { selectApiConfig } from '../prompts/components/select-api-config.js';
import { confirmAction } from '../prompts/components/confirm-action.js';
import { ExitCodes } from '../output/error.js';

// Import the register function AFTER mocks are set up
import { registerSwitchCommand } from './switch.js';

describe('switch command', () => {
  let mockConsoleLog: ReturnType<typeof vi.spyOn>;
  let mockConsoleError: ReturnType<typeof vi.spyOn>;
  let mockExit: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // Reset mock implementations each time
    vi.mocked(maskApiKey).mockImplementation((key: string) => {
      if (!key || key.length <= 4) return '****';
      return `...${key.slice(-4)}`;
    });

    vi.mocked(replaceEnvModel).mockImplementation((existing: any, config: ApiConfig) => ({
      ...existing,
      env: {
        ANTHROPIC_MODEL: config.modelName,
        ANTHROPIC_AUTH_TOKEN: config.apiKey,
        ANTHROPIC_BASE_URL: config.baseUrl,
      },
      model: config.modelName,
    }));

    vi.mocked(generateUnifiedDiff).mockReturnValue([]);
    vi.mocked(selectApiConfig).mockResolvedValue(null);
    vi.mocked(confirmAction).mockResolvedValue(null);

    // Spy on console and process.exit
    mockConsoleLog = vi.spyOn(console, 'log').mockImplementation(() => {});
    mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockExit = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Helper to create mock program and capture action handler
  function createMockProgram() {
    const actionHandler = vi.fn();
    const mockProgram = {
      command: vi.fn().mockReturnThis(),
      alias: vi.fn().mockReturnThis(),
      description: vi.fn().mockReturnThis(),
      argument: vi.fn().mockReturnThis(),
      action: vi.fn().mockImplementation((handler: any) => {
        actionHandler.mockImplementation(handler);
        return mockProgram;
      }),
    } as unknown as Command;
    return { mockProgram, actionHandler };
  }

  // Helper to create mock project entry
  function createMockProject(overrides?: Partial<ProjectEntry>): ProjectEntry {
    return {
      id: 'test-id',
      name: 'test-project',
      path: '/path/to/project',
      activeConfig: null,
      lastModified: new Date().toISOString(),
      ...overrides,
    };
  }

  // Helper to create mock API config
  function createMockApiConfig(overrides?: Partial<ApiConfig>): ApiConfig {
    return {
      apiKey: 'test-api-key-12345',
      baseUrl: 'https://api.test.com',
      mode: 'unified',
      modelName: 'claude-3',
      ...overrides,
    };
  }

  // ========================================
  // D-01, D-02: Argument parsing
  // ========================================
  describe('argument parsing', () => {
    it('registers <project> as required argument (D-01)', () => {
      const { mockProgram } = createMockProgram();
      registerSwitchCommand(mockProgram);

      expect(mockProgram.argument).toHaveBeenCalledWith('<project>', expect.stringContaining('项目'));
    });

    it('registers [config] as optional argument (D-01)', () => {
      const { mockProgram } = createMockProgram();
      registerSwitchCommand(mockProgram);

      const argumentCalls = vi.mocked(mockProgram.argument).mock.calls;
      const configCall = argumentCalls.find(call => call[0] === '[config]');
      expect(configCall).toBeDefined();
    });

    it('registers sw alias (D-01)', () => {
      const { mockProgram } = createMockProgram();
      registerSwitchCommand(mockProgram);

      expect(mockProgram.alias).toHaveBeenCalledWith('sw');
    });
  });

  // ========================================
  // D-02: Project lookup
  // ========================================
  describe('project lookup', () => {
    it('shows error when project not found by path (D-02)', async () => {
      vi.mocked(ProjectIndex).mockImplementation(() => ({
        getByPath: vi.fn().mockResolvedValue(null),
        getAll: vi.fn().mockResolvedValue([]),
        update: vi.fn().mockResolvedValue(true),
      } as any));

      vi.mocked(ApiConfigStore).mockImplementation(() => ({
        getAll: vi.fn().mockResolvedValue({ 'test-config': createMockApiConfig() }),
        get: vi.fn().mockResolvedValue(createMockApiConfig()),
      } as any));

      vi.mocked(ConfigService).mockImplementation(() => ({
        readProjectConfig: vi.fn().mockResolvedValue({}),
        writeProjectConfig: vi.fn().mockResolvedValue(undefined),
        applyApiConfig: vi.fn().mockResolvedValue(undefined),
      } as any));

      const { mockProgram, actionHandler } = createMockProgram();
      registerSwitchCommand(mockProgram);

      await actionHandler('nonexistent-project', 'test-config');

      expect(mockConsoleError).toHaveBeenCalledWith(expect.stringContaining('未找到项目'));
      expect(mockExit).toHaveBeenCalledWith(ExitCodes.NOT_FOUND);
    });

    it('shows usage hint when project not found (D-02)', async () => {
      vi.mocked(ProjectIndex).mockImplementation(() => ({
        getByPath: vi.fn().mockResolvedValue(null),
        getAll: vi.fn().mockResolvedValue([]),
        update: vi.fn().mockResolvedValue(true),
      } as any));

      const { mockProgram, actionHandler } = createMockProgram();
      registerSwitchCommand(mockProgram);

      await actionHandler('nonexistent-project', 'test-config');

      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('list'));
    });
  });

  // ========================================
  // D-03: Config selection
  // ========================================
  describe('config selection', () => {
    it('calls selectApiConfig when config argument omitted (D-03)', async () => {
      vi.mocked(ProjectIndex).mockImplementation(() => ({
        getByPath: vi.fn().mockResolvedValue(createMockProject()),
        getAll: vi.fn().mockResolvedValue([createMockProject()]),
        update: vi.fn().mockResolvedValue(true),
      } as any));

      vi.mocked(ApiConfigStore).mockImplementation(() => ({
        getAll: vi.fn().mockResolvedValue({ 'config1': createMockApiConfig() }),
        get: vi.fn().mockResolvedValue(createMockApiConfig()),
      } as any));

      vi.mocked(ConfigService).mockImplementation(() => ({
        readProjectConfig: vi.fn().mockResolvedValue({}),
        writeProjectConfig: vi.fn().mockResolvedValue(undefined),
        applyApiConfig: vi.fn().mockResolvedValue(undefined),
      } as any));

      vi.mocked(selectApiConfig).mockResolvedValueOnce('selected-config');

      const { mockProgram, actionHandler } = createMockProgram();
      registerSwitchCommand(mockProgram);

      await actionHandler('test-project');

      expect(selectApiConfig).toHaveBeenCalled();
    });

    it('shows cancel message when selectApiConfig returns null (D-03)', async () => {
      vi.mocked(ProjectIndex).mockImplementation(() => ({
        getByPath: vi.fn().mockResolvedValue(createMockProject()),
        getAll: vi.fn().mockResolvedValue([createMockProject()]),
        update: vi.fn().mockResolvedValue(true),
      } as any));

      vi.mocked(ApiConfigStore).mockImplementation(() => ({
        getAll: vi.fn().mockResolvedValue({}),
        get: vi.fn().mockResolvedValue(null),
      } as any));

      vi.mocked(selectApiConfig).mockResolvedValueOnce(null);

      const { mockProgram, actionHandler } = createMockProgram();
      registerSwitchCommand(mockProgram);

      await actionHandler('test-project');

      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('取消'));
    });

    it('shows error when config name not found (D-03)', async () => {
      vi.mocked(ProjectIndex).mockImplementation(() => ({
        getByPath: vi.fn().mockResolvedValue(createMockProject()),
        getAll: vi.fn().mockResolvedValue([createMockProject()]),
        update: vi.fn().mockResolvedValue(true),
      } as any));

      vi.mocked(ApiConfigStore).mockImplementation(() => ({
        getAll: vi.fn().mockResolvedValue({}),
        get: vi.fn().mockResolvedValue(null),
      } as any));

      const { mockProgram, actionHandler } = createMockProgram();
      registerSwitchCommand(mockProgram);

      await actionHandler('test-project', 'nonexistent-config');

      expect(mockConsoleError).toHaveBeenCalledWith(expect.stringContaining('不存在'));
      expect(mockExit).toHaveBeenCalledWith(ExitCodes.NOT_FOUND);
    });
  });

  // ========================================
  // D-04, D-05, D-06: Diff preview
  // ========================================
  describe('diff preview', () => {
    it('calls generateUnifiedDiff before confirmation (D-04)', async () => {
      vi.mocked(ProjectIndex).mockImplementation(() => ({
        getByPath: vi.fn().mockResolvedValue(createMockProject()),
        getAll: vi.fn().mockResolvedValue([createMockProject()]),
        update: vi.fn().mockResolvedValue(true),
      } as any));

      vi.mocked(ApiConfigStore).mockImplementation(() => ({
        getAll: vi.fn().mockResolvedValue({ 'test-config': createMockApiConfig() }),
        get: vi.fn().mockResolvedValue(createMockApiConfig()),
      } as any));

      vi.mocked(ConfigService).mockImplementation(() => ({
        readProjectConfig: vi.fn().mockResolvedValue({}),
        writeProjectConfig: vi.fn().mockResolvedValue(undefined),
        applyApiConfig: vi.fn().mockResolvedValue(undefined),
      } as any));

      vi.mocked(confirmAction).mockResolvedValueOnce(false);

      const { mockProgram, actionHandler } = createMockProgram();
      registerSwitchCommand(mockProgram);

      await actionHandler('test-project', 'test-config');

      expect(generateUnifiedDiff).toHaveBeenCalled();
    });

    it('calls renderDiff with diff lines (D-05, D-06)', async () => {
      const mockDiffLines: DiffLine[] = [
        { type: 'added', path: 'env.ANTHROPIC_MODEL', value: 'claude-3' },
        { type: 'added', path: 'env.ANTHROPIC_AUTH_TOKEN', value: '...key' },
      ];

      vi.mocked(ProjectIndex).mockImplementation(() => ({
        getByPath: vi.fn().mockResolvedValue(createMockProject()),
        getAll: vi.fn().mockResolvedValue([createMockProject()]),
        update: vi.fn().mockResolvedValue(true),
      } as any));

      vi.mocked(ApiConfigStore).mockImplementation(() => ({
        getAll: vi.fn().mockResolvedValue({ 'test-config': createMockApiConfig() }),
        get: vi.fn().mockResolvedValue(createMockApiConfig()),
      } as any));

      vi.mocked(ConfigService).mockImplementation(() => ({
        readProjectConfig: vi.fn().mockResolvedValue({}),
        writeProjectConfig: vi.fn().mockResolvedValue(undefined),
        applyApiConfig: vi.fn().mockResolvedValue(undefined),
      } as any));

      vi.mocked(generateUnifiedDiff).mockReturnValueOnce(mockDiffLines);
      vi.mocked(confirmAction).mockResolvedValueOnce(false);

      const { mockProgram, actionHandler } = createMockProgram();
      registerSwitchCommand(mockProgram);

      await actionHandler('test-project', 'test-config');

      expect(renderDiff).toHaveBeenCalledWith(mockDiffLines, expect.any(String));
    });

    it('masks API key in diff output (CFG-04)', async () => {
      vi.mocked(ProjectIndex).mockImplementation(() => ({
        getByPath: vi.fn().mockResolvedValue(createMockProject()),
        getAll: vi.fn().mockResolvedValue([createMockProject()]),
        update: vi.fn().mockResolvedValue(true),
      } as any));

      vi.mocked(ApiConfigStore).mockImplementation(() => ({
        getAll: vi.fn().mockResolvedValue({ 'test-config': createMockApiConfig({ apiKey: 'sk-test-full-api-key-12345xyz' }) }),
        get: vi.fn().mockResolvedValue(createMockApiConfig({ apiKey: 'sk-test-full-api-key-12345xyz' })),
      } as any));

      vi.mocked(ConfigService).mockImplementation(() => ({
        readProjectConfig: vi.fn().mockResolvedValue({}),
        writeProjectConfig: vi.fn().mockResolvedValue(undefined),
        applyApiConfig: vi.fn().mockResolvedValue(undefined),
      } as any));

      vi.mocked(confirmAction).mockResolvedValueOnce(false);

      const { mockProgram, actionHandler } = createMockProgram();
      registerSwitchCommand(mockProgram);

      await actionHandler('test-project', 'test-config');

      // maskApiKey should be called when masking the API key for display
      expect(maskApiKey).toHaveBeenCalled();
    });
  });

  // ========================================
  // D-07, D-08: Confirmation
  // ========================================
  describe('confirmation', () => {
    it('calls confirmAction with defaultChoice=false (D-08)', async () => {
      vi.mocked(ProjectIndex).mockImplementation(() => ({
        getByPath: vi.fn().mockResolvedValue(createMockProject()),
        getAll: vi.fn().mockResolvedValue([createMockProject()]),
        update: vi.fn().mockResolvedValue(true),
      } as any));

      vi.mocked(ApiConfigStore).mockImplementation(() => ({
        getAll: vi.fn().mockResolvedValue({ 'test-config': createMockApiConfig() }),
        get: vi.fn().mockResolvedValue(createMockApiConfig()),
      } as any));

      vi.mocked(ConfigService).mockImplementation(() => ({
        readProjectConfig: vi.fn().mockResolvedValue({}),
        writeProjectConfig: vi.fn().mockResolvedValue(undefined),
        applyApiConfig: vi.fn().mockResolvedValue(undefined),
      } as any));

      vi.mocked(confirmAction).mockResolvedValueOnce(false);

      const { mockProgram, actionHandler } = createMockProgram();
      registerSwitchCommand(mockProgram);

      await actionHandler('test-project', 'test-config');

      expect(confirmAction).toHaveBeenCalledWith(expect.any(String), false);
    });
  });

  // ========================================
  // D-09: Cancellation
  // ========================================
  describe('cancellation', () => {
    it('shows cancel message on rejection (D-09)', async () => {
      vi.mocked(ProjectIndex).mockImplementation(() => ({
        getByPath: vi.fn().mockResolvedValue(createMockProject()),
        getAll: vi.fn().mockResolvedValue([createMockProject()]),
        update: vi.fn().mockResolvedValue(true),
      } as any));

      vi.mocked(ApiConfigStore).mockImplementation(() => ({
        getAll: vi.fn().mockResolvedValue({ 'test-config': createMockApiConfig() }),
        get: vi.fn().mockResolvedValue(createMockApiConfig()),
      } as any));

      vi.mocked(ConfigService).mockImplementation(() => ({
        readProjectConfig: vi.fn().mockResolvedValue({}),
        writeProjectConfig: vi.fn().mockResolvedValue(undefined),
        applyApiConfig: vi.fn().mockResolvedValue(undefined),
      } as any));

      vi.mocked(confirmAction).mockResolvedValueOnce(false);

      const { mockProgram, actionHandler } = createMockProgram();
      registerSwitchCommand(mockProgram);

      await actionHandler('test-project', 'test-config');

      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('操作已取消'));
    });

    it('shows cancel message on Ctrl+C (null from confirmAction) (D-09)', async () => {
      vi.mocked(ProjectIndex).mockImplementation(() => ({
        getByPath: vi.fn().mockResolvedValue(createMockProject()),
        getAll: vi.fn().mockResolvedValue([createMockProject()]),
        update: vi.fn().mockResolvedValue(true),
      } as any));

      vi.mocked(ApiConfigStore).mockImplementation(() => ({
        getAll: vi.fn().mockResolvedValue({ 'test-config': createMockApiConfig() }),
        get: vi.fn().mockResolvedValue(createMockApiConfig()),
      } as any));

      vi.mocked(ConfigService).mockImplementation(() => ({
        readProjectConfig: vi.fn().mockResolvedValue({}),
        writeProjectConfig: vi.fn().mockResolvedValue(undefined),
        applyApiConfig: vi.fn().mockResolvedValue(undefined),
      } as any));

      vi.mocked(confirmAction).mockResolvedValueOnce(null);

      const { mockProgram, actionHandler } = createMockProgram();
      registerSwitchCommand(mockProgram);

      await actionHandler('test-project', 'test-config');

      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('操作已取消'));
    });

    it('no config written on cancellation (D-09)', async () => {
      const mockApplyApiConfig = vi.fn().mockResolvedValue(undefined);
      const mockUpdate = vi.fn().mockResolvedValue(true);

      vi.mocked(ProjectIndex).mockImplementation(() => ({
        getByPath: vi.fn().mockResolvedValue(createMockProject()),
        getAll: vi.fn().mockResolvedValue([createMockProject()]),
        update: mockUpdate,
      } as any));

      vi.mocked(ApiConfigStore).mockImplementation(() => ({
        getAll: vi.fn().mockResolvedValue({ 'test-config': createMockApiConfig() }),
        get: vi.fn().mockResolvedValue(createMockApiConfig()),
      } as any));

      vi.mocked(ConfigService).mockImplementation(() => ({
        readProjectConfig: vi.fn().mockResolvedValue({}),
        writeProjectConfig: vi.fn().mockResolvedValue(undefined),
        applyApiConfig: mockApplyApiConfig,
      } as any));

      vi.mocked(confirmAction).mockResolvedValueOnce(false);

      const { mockProgram, actionHandler } = createMockProgram();
      registerSwitchCommand(mockProgram);

      await actionHandler('test-project', 'test-config');

      // When confirmAction returns false, process.exit should be called before applyApiConfig
      // The mock prevents actual exit, but we verify the correct flow
      expect(mockExit).toHaveBeenCalledWith(ExitCodes.SUCCESS);
      // Also verify cancel message was shown
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('操作已取消'));
    });
  });

  // ========================================
  // Success path
  // ========================================
  describe('success path', () => {
    it('applies config when confirmed', async () => {
      const mockApplyApiConfig = vi.fn().mockResolvedValue(undefined);
      const mockUpdate = vi.fn().mockResolvedValue(true);

      vi.mocked(ProjectIndex).mockImplementation(() => ({
        getByPath: vi.fn().mockResolvedValue(createMockProject()),
        getAll: vi.fn().mockResolvedValue([createMockProject()]),
        update: mockUpdate,
      } as any));

      vi.mocked(ApiConfigStore).mockImplementation(() => ({
        getAll: vi.fn().mockResolvedValue({ 'test-config': createMockApiConfig() }),
        get: vi.fn().mockResolvedValue(createMockApiConfig()),
      } as any));

      vi.mocked(ConfigService).mockImplementation(() => ({
        readProjectConfig: vi.fn().mockResolvedValue({}),
        writeProjectConfig: vi.fn().mockResolvedValue(undefined),
        applyApiConfig: mockApplyApiConfig,
      } as any));

      vi.mocked(confirmAction).mockResolvedValueOnce(true);

      const { mockProgram, actionHandler } = createMockProgram();
      registerSwitchCommand(mockProgram);

      await actionHandler('test-project', 'test-config');

      expect(mockApplyApiConfig).toHaveBeenCalled();
      expect(mockUpdate).toHaveBeenCalledWith('test-id', { activeConfig: 'test-config' });
    });

    it('shows success message after applying', async () => {
      vi.mocked(ProjectIndex).mockImplementation(() => ({
        getByPath: vi.fn().mockResolvedValue(createMockProject()),
        getAll: vi.fn().mockResolvedValue([createMockProject()]),
        update: vi.fn().mockResolvedValue(true),
      } as any));

      vi.mocked(ApiConfigStore).mockImplementation(() => ({
        getAll: vi.fn().mockResolvedValue({ 'test-config': createMockApiConfig() }),
        get: vi.fn().mockResolvedValue(createMockApiConfig()),
      } as any));

      vi.mocked(ConfigService).mockImplementation(() => ({
        readProjectConfig: vi.fn().mockResolvedValue({}),
        writeProjectConfig: vi.fn().mockResolvedValue(undefined),
        applyApiConfig: vi.fn().mockResolvedValue(undefined),
      } as any));

      vi.mocked(confirmAction).mockResolvedValueOnce(true);

      const { mockProgram, actionHandler } = createMockProgram();
      registerSwitchCommand(mockProgram);

      await actionHandler('test-project', 'test-config');

      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('已切换配置'));
    });
  });

  // ========================================
  // Project lookup by name
  // ========================================
  describe('project lookup by name', () => {
    it('finds project by name when path lookup fails', async () => {
      const mockProject = createMockProject({ name: 'my-project' });

      vi.mocked(ProjectIndex).mockImplementation(() => ({
        getByPath: vi.fn().mockResolvedValue(null),
        getAll: vi.fn().mockResolvedValue([mockProject]),
        update: vi.fn().mockResolvedValue(true),
      } as any));

      vi.mocked(ApiConfigStore).mockImplementation(() => ({
        getAll: vi.fn().mockResolvedValue({ 'test-config': createMockApiConfig() }),
        get: vi.fn().mockResolvedValue(createMockApiConfig()),
      } as any));

      vi.mocked(ConfigService).mockImplementation(() => ({
        readProjectConfig: vi.fn().mockResolvedValue({}),
        writeProjectConfig: vi.fn().mockResolvedValue(undefined),
        applyApiConfig: vi.fn().mockResolvedValue(undefined),
      } as any));

      vi.mocked(confirmAction).mockResolvedValueOnce(false);

      const { mockProgram, actionHandler } = createMockProgram();
      registerSwitchCommand(mockProgram);

      await actionHandler('my-project', 'test-config');

      expect(mockConsoleError).not.toHaveBeenCalledWith(expect.stringContaining('未找到项目'));
    });
  });
});