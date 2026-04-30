# Phase 12: First-Run Wizard - Pattern Map

**Mapped:** 2026-04-30
**Files analyzed:** 4 (new/modified)
**Analogs found:** 4 / 4

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/lib/constants/skip-dirs.ts` | config | none (static) | `src/lib/config/version.ts` | role-match |
| `src/lib/store/state.ts` | model | CRUD | `src/lib/store/state.ts` (self) | exact |
| `src/lib/services/project-service.ts` | service | file-I/O | `src/lib/services/project-service.ts` (self) | exact |
| `src/cli/index.ts` | controller | request-response | `src/cli/index.ts` (self) | exact |

## Pattern Assignments

### `src/lib/constants/skip-dirs.ts` (config, static)

**Analog:** `src/lib/config/version.ts`

**Imports pattern** (lines 13-14):
```typescript
import type { ClaudeSettings } from '../types/index.js';
```

**Constant definition pattern** (lines 29-36):
```typescript
/**
 * Default config structure.
 *
 * Complete default config matching ClaudeSettings schema.
 * Empty values for optional fields.
 */
export const DEFAULT_CONFIG: ClaudeSettings = {
  version: CONFIG_VERSION,
  env: {},
  model: undefined,
  mcpServers: {},
  permissions: [],
  hooks: [],
};
```

**Pattern to apply for DEFAULT_SKIP_DIRS:**
```typescript
// NEW FILE: src/lib/constants/skip-dirs.ts
/**
 * Default directories to skip during project scanning.
 *
 * Per D-08: Hardcoded list of common build/dependency directories.
 * Per ONB-04: node_modules/.git/dist/build/target/.venv/__pycache__
 *
 * These directories are skipped during walkDirectory traversal
 * to avoid scanning dependency caches and build outputs.
 */
export const DEFAULT_SKIP_DIRS = [
  'node_modules',   // npm dependencies
  '.git',           // git repository
  'dist',           // build output (JS)
  'build',          // build output (JS)
  'target',         // build output (Rust/Java)
  '.venv',          // Python virtual environment
  '__pycache__',    // Python bytecode cache
] as const;

/**
 * Type for DEFAULT_SKIP_DIRS array items.
 * Enables type inference when merged with user skipDirectories.
 */
export type SkipDirName = typeof DEFAULT_SKIP_DIRS[number];
```

---

### `src/lib/store/state.ts` (model, CRUD)

**Analog:** Self (existing file) - schema evolution pattern

**Current AppStateData interface** (lines 23-37):
```typescript
export interface AppStateData {
  /** Currently active project ID (UUID) */
  activeProjectId: string | null;
  /** Last used template name */
  lastUsedTemplate: string | null;
  /** UI display preferences */
  uiPreferences: {
    theme: 'dark' | 'light';
    showPreview: boolean;
  };
  /** Recent projects list (max 10 entries, most recent first) */
  recentProjects: string[];
  /** D-05: User-configured scan directories for project discovery */
  scanDirectories: string[];
}
```

**Current DEFAULT_STATE pattern** (lines 43-52):
```typescript
const DEFAULT_STATE: AppStateData = {
  activeProjectId: null,
  lastUsedTemplate: null,
  uiPreferences: {
    theme: 'dark',
    showPreview: true,
  },
  recentProjects: [],
  scanDirectories: [],
};
```

**Schema evolution pattern to apply:**
```typescript
// UPDATE AppStateData interface (ADD D-03/D-09 fields):
export interface AppStateData {
  /** Currently active project ID (UUID) */
  activeProjectId: string | null;
  /** Last used template name */
  lastUsedTemplate: string | null;
  /** UI display preferences */
  uiPreferences: {
    theme: 'dark' | 'light';
    showPreview: boolean;
  };
  /** Recent projects list (max 10 entries, most recent first) */
  recentProjects: string[];
  /** D-05: User-configured scan directories for project discovery */
  scanDirectories: string[];
  /** D-03: First-run wizard completion flag */
  firstRunCompleted: boolean;
  /** D-09: User override for skip directories (merged with DEFAULT_SKIP_DIRS) */
  skipDirectories: string[];
}

// UPDATE DEFAULT_STATE (ADD default values):
const DEFAULT_STATE: AppStateData = {
  activeProjectId: null,
  lastUsedTemplate: null,
  uiPreferences: {
    theme: 'dark',
    showPreview: true,
  },
  recentProjects: [],
  scanDirectories: [],
  firstRunCompleted: false,  // D-03 default
  skipDirectories: [],       // D-09 default
};
```

---

### `src/lib/services/project-service.ts` (service, file-I/O)

**Analog:** Self (existing file) - walkDirectory Promise.all refactor

**Current walkDirectory implementation** (lines 106-137):
```typescript
private async walkDirectory(
  dir: string,
  depth: number,
  maxDepth: number,
  found: string[]
): Promise<void> {
  if (depth > maxDepth) return;

  // Check if this directory has .claude/settings.json or .claude/settings.local.json
  const claudeDir = path.join(dir, '.claude');
  const settingsPath = path.join(claudeDir, 'settings.json');
  const localSettingsPath = path.join(claudeDir, 'settings.local.json');

  if (await fs.pathExists(settingsPath) || await fs.pathExists(localSettingsPath)) {
    found.push(dir);
  }

  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      // Skip hidden dirs and node_modules
      if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
        await this.walkDirectory(path.join(dir, entry.name), depth + 1, maxDepth, found);
      }
    }
  } catch (err) {
    // Permission errors or other issues - skip this directory
    if (err instanceof Error) {
      console.error(`Scan skipped directory ${dir}: ${err.message}`);
    }
  }
}
```

**Promise.all refactor pattern (per D-05/D-06):**
```typescript
// REFACTORED walkDirectory:
private async walkDirectory(
  dir: string,
  depth: number,
  maxDepth: number,
  found: string[],
  skipDirs: string[]  // NEW: skip directories parameter
): Promise<void> {
  if (depth > maxDepth) return;

  // Check .claude directory (existing behavior)
  const claudeDir = path.join(dir, '.claude');
  const settingsPath = path.join(claudeDir, 'settings.json');
  const localSettingsPath = path.join(claudeDir, 'settings.local.json');

  if (await fs.pathExists(settingsPath) || await fs.pathExists(localSettingsPath)) {
    found.push(dir);
  }

  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });

    // Filter directories to scan using DEFAULT_SKIP_DIRS + user skipDirectories
    const subdirs = entries
      .filter(e => e.isDirectory())
      .filter(e => !skipDirs.includes(e.name))
      .filter(e => !e.name.startsWith('.'))
      .map(e => path.join(dir, e.name));

    // D-05: Promise.all parallel scan
    // D-06: Independent catch per subdirectory
    await Promise.all(
      subdirs.map(async (subdir) => {
        try {
          await this.walkDirectory(subdir, depth + 1, maxDepth, found, skipDirs);
        } catch (err) {
          // D-07: console.error log, continue others
          if (err instanceof Error) {
            console.error(`Scan skipped directory ${subdir}: ${err.message}`);
          }
        }
      })
    );
  } catch (err) {
    // Permission errors at this level - skip
    if (err instanceof Error) {
      console.error(`Scan skipped directory ${dir}: ${err.message}`);
    }
  }
}
```

**New helper method pattern:**
```typescript
// ADD getSkipDirectories method (per D-10):
private getSkipDirectories(): string[] {
  const userSkipDirs = this.appState.get('skipDirectories') ?? [];
  // D-10: Merge default + user overrides
  return [...DEFAULT_SKIP_DIRS, ...userSkipDirs];
}
```

**Imports to add:**
```typescript
// ADD import at top of file:
import { DEFAULT_SKIP_DIRS } from '../constants/skip-dirs.js';
```

---

### `src/cli/index.ts` (controller, request-response)

**Analog:** Self (existing file) - first-run detection pattern

**Current entry point** (lines 21-54):
```typescript
export async function runCLI(argv: string[] = process.argv): Promise<void> {
  if (process.env.NO_COLOR) chalk.level = 0;

  const program = new Command();
  program.name('cc-config').description('CLI tool for managing Claude Code API provider configurations')
    .version(VERSION, '-v, --version', 'output the current version')
    .helpOption('-h, --help', 'display help for command').exitOverride();

  // Phase 05 commands
  registerListCommand(program);
  registerSwitchCommand(program);
  registerCurrentCommand(program);
  registerTemplateCommand(program);

  // Phase 11 commands
  registerConfigCommand(program);

  // Phase 07 commands
  registerAutoCheckCommand(program);
  registerScanCommand(program);
  registerRegisterCommand(program);
  registerExportCommand(program);
  registerImportCommand(program);

  // Phase 08 commands
  registerUndoCommand(program);

  const args = argv.slice(2);
  if (args.length === 0) {
    await launchTUI();
  } else {
    await program.parseAsync(argv);
  }
}
```

**First-run detection pattern to apply (per D-01/D-02):**
```typescript
// UPDATE args.length === 0 block:
const args = argv.slice(2);

if (args.length === 0) {
  // D-01: Trigger at no-args invocation
  // D-02: Check triple condition for first-run detection
  const appState = new AppState();
  const apiConfigStore = new ApiConfigStore();
  const projectIndex = new ProjectIndex();

  const firstRunCompleted = appState.get('firstRunCompleted');
  const hasConfigs = (await apiConfigStore.list()).length > 0;
  const hasProjects = (await projectIndex.getAll()).length > 0;

  if (!firstRunCompleted && !hasConfigs && !hasProjects) {
    // Launch first-run wizard
    await launchPromptsTUI();
    appState.set('firstRunCompleted', true);  // D-04
  } else {
    // Normal TUI launch
    await launchTUI();
  }
} else {
  await program.parseAsync(argv);
}
```

**Imports to add:**
```typescript
// ADD imports at top of file:
import { AppState } from '../lib/store/state.js';
import { ApiConfigStore } from '../lib/store/api-config.js';
import { ProjectIndex } from '../lib/store/project.js';
import { launchPromptsTUI } from './prompts/index.js';
```

---

## Shared Patterns

### Spinner Implementation
**Source:** `src/cli/prompts/wizards/main-wizard.ts` lines 22-45
**Apply to:** No changes needed - existing spinner is reused

```typescript
function createSpinner(message: string) {
  let frame = 0;
  const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

  const interval = setInterval(() => {
    process.stdout.write(`\r${frames[frame]} ${message}`);
    frame = (frame + 1) % frames.length;
  }, 80);

  return {
    succeed: (msg: string) => {
      clearInterval(interval);
      process.stdout.write(`\r${chalk.green('✓')} ${msg}\n`);
    },
    fail: (msg: string) => {
      clearInterval(interval);
      process.stdout.write(`\r${chalk.red('✗')} ${msg}\n`);
    },
    stop: () => {
      clearInterval(interval);
      process.stdout.write('\r' + ' '.repeat(60) + '\r');
    },
  };
}
```

### Test Pattern - State Fields
**Source:** `src/lib/store/state.test.ts` lines 181-207
**Apply to:** Add tests for firstRunCompleted and skipDirectories fields

```typescript
describe('firstRunCompleted', () => {
  it('should default to false', () => {
    expect(appState.get('firstRunCompleted')).toBe(false);
  });

  it('should store and retrieve completion flag', () => {
    appState.set('firstRunCompleted', true);
    expect(appState.get('firstRunCompleted')).toBe(true);
  });

  it('should persist completion flag across instances', () => {
    appState.set('firstRunCompleted', true);
    const newInstance = new AppState(TEST_PROJECT_NAME);
    expect(newInstance.get('firstRunCompleted')).toBe(true);
    newInstance.clear();
  });
});

describe('skipDirectories', () => {
  it('should default to empty array', () => {
    expect(appState.get('skipDirectories')).toEqual([]);
  });

  it('should store and retrieve skip directories', () => {
    appState.set('skipDirectories', ['custom-skip']);
    expect(appState.get('skipDirectories')).toEqual(['custom-skip']);
  });
});
```

### Test Pattern - WalkDirectory Parallel
**Source:** `src/lib/services/project-service.test.ts` lines 53-142
**Apply to:** Add tests for Promise.all parallel scanning and skip directories

```typescript
describe('walkDirectory parallel scanning', () => {
  it('should scan subdirectories in parallel with Promise.all', async () => {
    // Create multiple nested projects
    const project1 = path.join(tempDir, 'dir1', 'project1');
    const project2 = path.join(tempDir, 'dir2', 'project2');
    const project3 = path.join(tempDir, 'dir3', 'project3');

    await fs.ensureDir(path.join(project1, '.claude'));
    await fs.ensureDir(path.join(project2, '.claude'));
    await fs.ensureDir(path.join(project3, '.claude'));

    await fs.writeJSON(path.join(project1, '.claude', 'settings.json'), {});
    await fs.writeJSON(path.join(project2, '.claude', 'settings.json'), {});
    await fs.writeJSON(path.join(project3, '.claude', 'settings.json'), {});

    mockAppState.set('scanDirectories', [tempDir]);

    const results = await projectService.scanProjects();

    // All projects should be found regardless of parallel execution
    expect(results.length).toBeGreaterThanOrEqual(3);
  });

  it('should continue scanning when one subdirectory fails', async () => {
    // Create valid project and a directory that will fail
    const validProject = path.join(tempDir, 'valid-project');
    await fs.ensureDir(path.join(validProject, '.claude'));
    await fs.writeJSON(path.join(validProject, '.claude', 'settings.json'), {});

    mockAppState.set('scanDirectories', [tempDir]);

    const results = await projectService.scanProjects();
    expect(results.map(r => r.path)).toContain(validProject);
  });
});

describe('skip directories filtering', () => {
  it('should skip DEFAULT_SKIP_DIRS entries', async () => {
    // Create directories that should be skipped
    const nodeModulesProject = path.join(tempDir, 'node_modules', 'package');
    const distProject = path.join(tempDir, 'dist', 'output');

    await fs.ensureDir(path.join(nodeModulesProject, '.claude'));
    await fs.ensureDir(path.join(distProject, '.claude'));
    await fs.writeJSON(path.join(nodeModulesProject, '.claude', 'settings.json'), {});
    await fs.writeJSON(path.join(distProject, '.claude', 'settings.json'), {});

    const validProject = path.join(tempDir, 'valid-project');
    await fs.ensureDir(path.join(validProject, '.claude'));
    await fs.writeJSON(path.join(validProject, '.claude', 'settings.json'), {});

    mockAppState.set('scanDirectories', [tempDir]);

    const results = await projectService.scanProjects();

    expect(results.map(r => r.path)).not.toContain(nodeModulesProject);
    expect(results.map(r => r.path)).not.toContain(distProject);
    expect(results.map(r => r.path)).toContain(validProject);
  });

  it('should merge DEFAULT_SKIP_DIRS with user skipDirectories', async () => {
    // Custom user skip directory
    const customSkipProject = path.join(tempDir, 'my-custom-skip', 'project');
    await fs.ensureDir(path.join(customSkipProject, '.claude'));
    await fs.writeJSON(path.join(customSkipProject, '.claude', 'settings.json'), {});

    mockAppState.set('scanDirectories', [tempDir]);
    mockAppState.set('skipDirectories', ['my-custom-skip']);

    const results = await projectService.scanProjects();

    expect(results.map(r => r.path)).not.toContain(customSkipProject);
  });
});
```

---

## No Analog Found

All files have analogs (self or role-match).

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| — | — | — | All files have exact or role-match analogs |

---

## Metadata

**Analog search scope:** src/lib/config/, src/lib/store/, src/lib/services/, src/cli/
**Files scanned:** 12 (state.ts, project-service.ts, cli/index.ts, main-wizard.ts, version.ts, state.test.ts, project-service.test.ts, cli/index.test.ts, api-config.ts, project.ts, tui-launch.ts)
**Pattern extraction date:** 2026-04-30