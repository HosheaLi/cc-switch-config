# Phase 11: Config CLI Commands - Pattern Map

**Mapped:** 2026-04-30
**Files analyzed:** 4 new/modified files
**Analogs found:** 4 / 4

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/cli/commands/config.ts` | CLI command | request-response | `src/cli/commands/template.ts` | exact |
| `src/cli/commands/config.test.ts` | test | unit test | `src/cli/commands/template.test.ts` | exact |
| `src/cli/index.ts` | config | request-response | `src/cli/index.ts` (modify) | self |
| `src/cli/prompts/wizards/config-wizard.ts` | deprecation | annotation | N/A (JSDoc pattern) | standard |

## Pattern Assignments

### `src/cli/commands/config.ts` (CLI command, request-response)

**Analog:** `src/cli/commands/template.ts`

**Imports pattern** (lines 16-23):
```typescript
import type { Command } from 'commander';
import chalk from 'chalk';
import { ApiService } from '../../lib/services/api-service.js';
import { handleCLIError } from '../output/error.js';
import { ApiConfigStore } from '../../lib/store/api-config.js';
import { readConfig, writeConfig } from '../../lib/store/config.js';
```

**registerXxxCommand pattern** (lines 30-34):
```typescript
export function registerConfigCommand(program: Command): void {
  const config = program
    .command('config')
    .alias('cfg')  // D-04: alias pattern from template.ts
    .description('Manage API configurations');
```

**Nested subcommand pattern** (lines 37-62):
```typescript
  // config list - show all configs
  config
    .command('list')
    .alias('l')
    .description('List all API configurations')
    .action(async () => {
      try {
        const apiConfigStore = new ApiConfigStore();
        const service = new ApiService(apiConfigStore, readConfig, writeConfig);
        const configs = await service.getAllConfigs();
        const names = Object.keys(configs);

        // D-07: Empty list handling
        if (names.length === 0) {
          console.log(chalk.yellow('No configurations saved.'));
          console.log(chalk.gray('Use cc-config config add to create a configuration.'));
          process.exit(0);
        }

        // D-05: Table format output
        console.log(chalk.bold('Saved Configurations:'));
        for (const name of names) {
          console.log(chalk.white(`  ${name}`));
        }
        console.log(chalk.gray(`\n${names.length} configuration(s).`));

      } catch (error) {
        handleCLIError(error);
      }
    });
```

**--force option pattern** (lines 137-161):
```typescript
  // config remove - delete config with confirmation (D-08/U5)
  config
    .command('remove <name>')
    .alias('rm')
    .description('Remove an API configuration')
    .option('-f, --force', 'skip confirmation prompt')
    .action(async (name: string, options: { force?: boolean }) => {
      try {
        // U5: Confirmation prompt for destructive action
        if (!options.force) {
          console.log(chalk.yellow(`Are you sure you want to remove config "${name}"?`));
          console.log(chalk.gray('Use --force to skip confirmation.'));
          console.log(chalk.gray('This action cannot be undone.'));
          process.exit(0);
        }

        const apiConfigStore = new ApiConfigStore();
        const service = new ApiService(apiConfigStore, readConfig, writeConfig);
        await service.deleteConfig(name);
        console.log(chalk.green(`✓ Configuration "${name}" removed.`));

      } catch (error) {
        handleCLIError(error);
      }
    });
```

**inputFullApiConfig integration** (from RESEARCH.md):
```typescript
  // config add - reuse inputFullApiConfig component (D-14)
  config
    .command('add')
    .description('Add a new API configuration')
    .action(async () => {
      try {
        const apiConfigStore = new ApiConfigStore();
        const service = new ApiService(apiConfigStore, readConfig, writeConfig);

        // D-14: Reuse inputFullApiConfig component
        const result = await inputFullApiConfig();
        if (!result) return; // Cancelled

        // Create config via ApiService
        const apiConfig: ApiConfig = {
          name: result.name,
          apiKey: result.apiKey,
          baseUrl: result.baseUrl,
          mode: 'unified',  // D-16: default mode
          modelName: result.modelName,
        };

        await service.createConfig(result.name, apiConfig);
        console.log(chalk.green(`✓ Configuration "${result.name}" created.`));

      } catch (error) {
        handleCLIError(error);
      }
    });
```

**Error handling pattern** (lines 59-61, 132-134):
```typescript
      } catch (error) {
        handleCLIError(error);
      }
```

---

### `src/cli/commands/config.test.ts` (test, unit test)

**Analog:** `src/cli/commands/template.test.ts`

**Imports pattern** (lines 1-5):
```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Command } from 'commander';
import chalk from 'chalk';
import { registerConfigCommand } from './config.js';
```

**Mock pattern** (lines 7-14):
```typescript
// Mock ApiService at the source module
vi.mock('../../lib/services/api-service.js', () => ({
  ApiService: vi.fn().mockImplementation(() => ({
    createConfig: vi.fn().mockResolvedValue(undefined),
    getConfig: vi.fn().mockResolvedValue(null),
    deleteConfig: vi.fn().mockResolvedValue(true),
    listConfigs: vi.fn().mockResolvedValue(['anthropic', 'openai']),
    getAllConfigs: vi.fn().mockResolvedValue({}),
  })),
}));
```

**Store/config mock pattern** (lines 25-33):
```typescript
// Mock ApiConfigStore
vi.mock('../../lib/store/api-config.js', () => ({
  ApiConfigStore: vi.fn(),
}));

// Mock config functions
vi.mock('../../lib/store/config.js', () => ({
  readConfig: vi.fn(),
  writeConfig: vi.fn(),
}));
```

**Error handler mock pattern** (lines 36-38):
```typescript
// Mock error handler
vi.mock('../output/error.js', () => ({
  handleCLIError: vi.fn(),
}));
```

**Test setup pattern** (lines 45-61):
```typescript
  beforeEach(async () => {
    // Reset ApiService mock to full implementation
    const mod = await import('../../lib/services/api-service.js');
    const MockedApiService = vi.mocked(mod.ApiService);
    MockedApiService.mockImplementation(() => ({
      createConfig: vi.fn().mockResolvedValue(undefined),
      getConfig: vi.fn().mockResolvedValue(null),
      deleteConfig: vi.fn().mockResolvedValue(true),
      listConfigs: vi.fn().mockResolvedValue(['anthropic', 'openai']),
      getAllConfigs: vi.fn().mockResolvedValue({
        anthropic: { name: 'anthropic', apiKey: 'test', baseUrl: 'url', mode: 'unified', modelName: 'claude-3' },
      }),
    }));

    program = new Command();
    program.exitOverride();
    registerConfigCommand(program);
    mockConsole = vi.spyOn(console, 'log').mockImplementation(() => {});
    mockExit = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });
```

**Command registration test pattern** (lines 67-78):
```typescript
  describe('command registration', () => {
    it('registers config command', () => {
      const commands = program.commands;
      const configCmd = commands.find(cmd => cmd.name() === 'config');
      expect(configCmd).toBeDefined();
    });

    it('registers cfg alias', () => {
      const commands = program.commands;
      const configCmd = commands.find(cmd => cmd.name() === 'config');
      expect(configCmd?.aliases()).toContain('cfg');
    });
```

**Subcommand registration test pattern** (lines 80-93):
```typescript
    it('registers nested list command', () => {
      const commands = program.commands;
      const configCmd = commands.find(cmd => cmd.name() === 'config');
      const listCmd = configCmd?.commands.find(cmd => cmd.name() === 'list');
      expect(listCmd).toBeDefined();
    });

    it('registers nested list with l alias', () => {
      const commands = program.commands;
      const configCmd = commands.find(cmd => cmd.name() === 'config');
      const listCmd = configCmd?.commands.find(cmd => cmd.name() === 'list');
      expect(listCmd?.aliases()).toContain('l');
    });
```

**Execution test pattern** (lines 123-150):
```typescript
  describe('config list execution', () => {
    it('outputs configuration names', async () => {
      const MockApiService = vi.mocked(await import('../../lib/services/index.js')).ApiService;
      MockApiService.mockImplementation(() => ({
        getAllConfigs: vi.fn().mockResolvedValue({
          anthropic: { name: 'anthropic', apiKey: 'key', baseUrl: 'url', mode: 'unified', modelName: 'claude-3' },
          openai: { name: 'openai', apiKey: 'key2', baseUrl: 'url2', mode: 'unified', modelName: 'gpt-4' },
        }),
      }) as any);

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

      expect(freshConsole.mock.calls.some(call =>
        call[0].includes('anthropic') || call[0].includes('Saved Configurations')
      )).toBe(true);

      freshConsole.mockRestore();
      freshExit.mockRestore();
    });
```

**Empty list test pattern** (lines 180-205):
```typescript
    it('outputs no configs message when empty', async () => {
      const MockApiService = vi.mocked(await import('../../lib/services/index.js')).ApiService;
      MockApiService.mockImplementation(() => ({
        getAllConfigs: vi.fn().mockResolvedValue({}),
      }) as any);

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

      expect(freshConsole.mock.calls.some(call =>
        call[0].includes('No configurations saved')
      )).toBe(true);

      freshConsole.mockRestore();
      freshExit.mockRestore();
    });
```

**--force test pattern** (lines 252-289):
```typescript
  describe('config remove execution', () => {
    it('requires confirmation without --force', async () => {
      try {
        await program.parseAsync(['node', 'cc-config', 'config', 'remove', 'my-config']);
      } catch {
        // May exit for confirmation
      }

      expect(mockConsole.mock.calls.some(call =>
        call[0].includes('Are you sure')
      )).toBe(true);
    });

    it('calls deleteConfig with --force', async () => {
      const mockDelete = vi.fn().mockResolvedValue(true);
      const MockApiService = vi.mocked(await import('../../lib/services/index.js')).ApiService;
      MockApiService.mockImplementation(() => ({
        deleteConfig: mockDelete,
      }) as any);

      const freshProgram = new Command();
      freshProgram.exitOverride();
      registerConfigCommand(freshProgram);
      const freshConsole = vi.spyOn(console, 'log').mockImplementation(() => {});
      const freshExit = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

      try {
        await freshProgram.parseAsync(['node', 'cc-config', 'config', 'remove', 'my-config', '--force']);
      } catch {
        // May exit on success
      }

      expect(mockDelete).toHaveBeenCalledWith('my-config');

      freshConsole.mockRestore();
      freshExit.mockRestore();
    });
```

---

### `src/cli/index.ts` (modify)

**Current pattern** (lines 10, 29):
```typescript
import { registerTemplateCommand } from './commands/template.js';
...
registerTemplateCommand(program);
```

**Add pattern** (add 2 lines):
```typescript
import { registerConfigCommand } from './commands/config.js';
...
registerConfigCommand(program);
```

---

### `src/cli/prompts/wizards/config-wizard.ts` (modify, add deprecation)

**Deprecation annotation pattern** (add at top of file, after existing imports block):
```typescript
/**
 * @deprecated
 *
 * This wizard is deprecated and will be removed in Phase 15.
 * Use CLI commands instead:
 * - `cc-config config add` to create configurations
 * - `cc-config config list` to view configurations
 * - `cc-config config remove` to delete configurations
 *
 * Migration guide:
 * - The new CLI commands use ApiService (Phase 10) instead of TemplateService
 * - Configurations are stored as ApiConfig (unified/granular) instead of TemplateConfig
 * - Password input is handled via prompts password type (SEC-04)
 *
 * See Phase 11 ROADMAP.md for details.
 */
```

---

## Shared Patterns

### Service Instantiation
**Source:** `src/cli/commands/template.ts` lines 43-44
**Apply to:** All config command actions
```typescript
const apiConfigStore = new ApiConfigStore();
const service = new ApiService(apiConfigStore, readConfig, writeConfig);
```

### Error Handling
**Source:** `src/cli/output/error.ts` lines 40-55
**Apply to:** All config command actions
```typescript
} catch (error) {
  handleCLIError(error);
}
```

### Empty List Message
**Source:** `src/cli/commands/template.ts` lines 47-50
**Apply to:** config list command
```typescript
if (names.length === 0) {
  console.log(chalk.yellow('No configurations saved.'));
  console.log(chalk.gray('Use cc-config config add to create a configuration.'));
  process.exit(0);
}
```

### Confirmation Prompt
**Source:** `src/cli/commands/template.ts` lines 145-149
**Apply to:** config remove command (without --force)
```typescript
if (!options.force) {
  console.log(chalk.yellow(`Are you sure you want to remove config "${name}"?`));
  console.log(chalk.gray('Use --force to skip confirmation.'));
  console.log(chalk.gray('This action cannot be undone.'));
  process.exit(0);
}
```

### API Key Masking
**Source:** `src/lib/security/api-key.ts` lines 32-34
**Apply to:** config list output display
```typescript
import { maskApiKey } from '../../lib/security/api-key.js';
const maskedKey = maskApiKey(cfg.apiKey);
```

### Password Input
**Source:** `src/cli/prompts/components/input-api-key.ts` lines 127-151
**Apply to:** config add command (via inputFullApiConfig)
```typescript
import { inputFullApiConfig } from '../prompts/components/input-api-key.js';

const result = await inputFullApiConfig();
if (!result) return; // Cancelled
```

### Command Aliases
**Source:** `src/cli/commands/template.ts` lines 32-33, 39, 67, 139
**Apply to:** config command and subcommands
```typescript
.command('config')
.alias('cfg')  // Main command alias

.command('list')
.alias('l')  // Subcommand alias

.command('add')  // No alias needed

.command('remove <name>')
.alias('rm')  // Subcommand alias
```

---

## No Analog Found

Files with standard patterns (no codebase analog needed):

| File | Role | Pattern | Source |
|------|------|---------|--------|
| `src/cli/prompts/wizards/config-wizard.ts` | deprecation | @deprecated JSDoc | TypeScript standard |

---

## Metadata

**Analog search scope:**
- `src/cli/commands/` — CLI command patterns
- `src/cli/prompts/components/` — Prompt components
- `src/cli/output/` — Error handling
- `src/lib/services/` — Service layer
- `src/lib/security/` — Security utilities
- `src/cli/index.ts` — CLI entry point

**Files scanned:** 8 files
- `src/cli/commands/template.ts` (182 lines)
- `src/cli/commands/template.test.ts` (317 lines)
- `src/cli/prompts/components/input-api-key.ts` (152 lines)
- `src/cli/output/error.ts` (82 lines)
- `src/lib/services/api-service.ts` (220 lines)
- `src/lib/security/api-key.ts` (112 lines)
- `src/cli/index.ts` (51 lines)
- `src/cli/prompts/utils/theme.ts` (94 lines)

**Pattern extraction date:** 2026-04-30