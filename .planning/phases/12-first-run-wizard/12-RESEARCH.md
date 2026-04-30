# Phase 12: First-Run Wizard - Research

**Researched:** 2026-04-30
**Domain:** CLI/TUI wizard flow, parallel directory scanning, first-run detection
**Confidence:** HIGH

## Summary

Phase 12 实现首次引导流程，让新用户安装后自动进入配置向导。核心改动包括：(1) CLI entry point 添加首次运行检测，(2) walkDirectory 改为 Promise.all 并行扫描，(3) 扩展跳过目录列表为硬编码常量，(4) AppState 添加 firstRunCompleted 和 skipDirectories 字段。

现有代码库已具备大部分所需组件：main-wizard.ts 提供完整的 wizard 框架（含 createSpinner），所有 prompt components 已实现并可复用。主要技术挑战在于并行扫描的错误处理设计和首次检测的触发时机。

**Primary recommendation:** 采用 D-05~D-14 锁定方案，使用 Promise.all + 独立 catch 模式，在 CLI index.ts args.length === 0 时检测 ApiConfigStore 和 ProjectIndex 双条件触发 first-run wizard。

## User Constraints (from CONTEXT.md)

### Locked Decisions

#### 首次检测触发
- **D-01:** 触发时机为 CLI entry point（`cc-config` 无参数调用时）
- **D-02:** 触发条件：ApiConfigStore 为空 + ProjectIndex 为空（双条件）
- **D-03:** AppState 添加 `firstRunCompleted: boolean` 字段
- **D-04:** wizard 完成后设置 `firstRunCompleted = true`

#### 扫描并行化
- **D-05:** walkDirectory L128 for-of 改为 Promise.all 并行扫描子目录
- **D-06:** 每个 subdirectory 独立 catch，失败不影响其他（部分失败继续）
- **D-07:** 保持 console.error 日志记录失败目录

#### 跳过目录扩展
- **D-08:** 硬编码 DEFAULT_SKIP_DIRS 常量：
  ```
  node_modules, .git, dist, build, target, .venv, __pycache__
  ```
- **D-09:** AppState 添加 `skipDirectories: string[]` 字段（可覆盖默认）
- **D-10:** 合并策略：DEFAULT_SKIP_DIRS + user skipDirectories

#### 进度指示器样式
- **D-11:** 保持现有 spinner 实现（main-wizard.ts L22-45 自定义实现）
- **D-12:** 后期根据用户反馈决定是否安装 ora 或增加实时计数
- **D-13:** 完成时显示发现项目数（现有行为）

#### Wizard 流程顺序
- **D-14:** 按 ROADMAP ONB-01 顺序：
  1. 检测是否首次运行
  2. API 配置输入（复用 inputFullApiConfig）
  3. 扫描目录选择（复用 selectDirectory）
  4. 执行扫描（并行化）
  5. 选择项目注册（复用 selectFromScanResults）
  6. 选择配置应用（复用 selectTemplate）
  7. 确认应用
  8. 设置 firstRunCompleted = true

### Claude's Discretion

- walkDirectory Promise.all 具体实现细节
- DEFAULT_SKIP_DIRS 常量命名和位置
- spinner 帧率和样式
- firstRunCompleted 检测在 CLI index.ts 中的位置

### Deferred Ideas (OUT OF SCOPE)

- ora 库安装 + 实时计数 — 后期根据用户反馈
- fuzzy 搜索集成 — v3 FUZZ-01
- wizard 状态持久化（中断恢复） — v2 STATE-01

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| ONB-01 | User experiences first-run wizard (API config → scan directory → scan → main interface) | main-wizard.ts provides complete wizard framework; all components reusable |
| ONB-02 | System detects firstRunCompleted flag in AppState | AppState needs schema evolution (add firstRunCompleted + skipDirectories) |
| ONB-03 | System scans directories with Promise.all parallel traversal | walkDirectory L106-137 needs refactoring from for-of to Promise.all |
| ONB-04 | System skips node_modules/.git/dist/build/target/.venv/__pycache__ | DEFAULT_SKIP_DIRS constant pattern needed (similar to DEFAULT_STATE) |
| ONB-05 | User sees progress indicator during scan operations | createSpinner L22-45 already implemented in main-wizard.ts |

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| First-run detection | CLI entry point | AppState | Entry point owns invocation decision; AppState stores flag |
| Directory scanning | Services/ProjectService | — | Service layer owns traversal logic per Clean Architecture (M4) |
| Skip directory configuration | AppState | Services | AppState owns user preference; Services reads via DI |
| Wizard orchestration | CLI/Prompts Wizards | — | Wizard layer owns flow control and user interaction |
| Progress display | CLI/Prompts Utils | — | Utility layer owns spinner implementation |
| API config storage | ApiConfigStore | — | Store layer owns persistence per R1/R2 |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| prompts | 2.4.2 [VERIFIED: npm registry] | Terminal-native prompts | npm-style list selection, j/k navigation, TUI-01~05 |
| chalk | 5.6.2 [VERIFIED: npm registry] | Terminal coloring | OpenCode aesthetic (UI-01), NO_COLOR support (UI-05) |
| fs-extra | 11.3.4 [VERIFIED: package.json] | File system operations | walkDirectory needs readdir/pathExists |
| zod | 4.3.6 [VERIFIED: package.json] | Schema validation | AppState schema evolution validation |
| conf | 15.1.0 [VERIFIED: package.json] | XDG-compliant state storage | AppState persistence backend |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Fuse.js | 7.3.0 [VERIFIED: package.json] | Fuzzy search for autocomplete | Large project lists (>20 items) - TUI-04 |
| vitest | 3.2.4 [VERIFIED: package.json] | Test framework | Unit tests for walkDirectory refactor |
| commander | 14.0.3 [VERIFIED: package.json] | CLI framework | Entry point detection logic |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Custom spinner (L22-45) | ora 9.4.0 | ora provides more features but adds dependency; custom spinner sufficient per D-11 |
| for-of serial scan | Promise.all | Promise.all faster but needs error handling per directory; D-06 locks decision |

**Installation:**
All dependencies already installed in package.json. No new packages required for Phase 12.

**Version verification:**
```bash
npm view prompts version  # 2.4.2
npm view chalk version    # 5.6.2
npm view ora version      # 9.4.0 (optional, not installed)
```

## Architecture Patterns

### System Architecture Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                         CLI Entry Point                           │
│                   (src/cli/index.ts)                              │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ args.length === 0                                            │ │
│  │   → Check AppState.firstRunCompleted                        │ │
│  │   → Check ApiConfigStore.list().length === 0                │ │
│  │   → Check ProjectIndex.getAll().length === 0                │ │
│  │   → If all true: launch first-run wizard                    │ │
│  │   → Else: launch normal TUI                                  │ │
│  └─────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────┬───────────────────────────────┘
                                   │
                                   ▼
┌──────────────────────────────────────────────────────────────────┐
│                    First-Run Wizard                               │
│              (src/cli/prompts/wizards/main-wizard.ts)             │
│                                                                   │
│  Flow:                                                            │
│  1. inputFullApiConfig → Create ApiConfig                        │
│  2. selectDirectory → Choose scan root                           │
│  3. createSpinner → Start progress indicator                     │
│  4. ProjectService.scanProjects() → Parallel scan                │
│  5. selectFromScanResults → Choose projects                      │
│  6. registerProject → Persist selections                         │
│  7. selectTemplate → Choose config                               │
│  8. confirmAction → Final confirmation                           │
│  9. AppState.set('firstRunCompleted', true)                      │
│  └──────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────┬───────────────────────────────┘
                                   │
                                   ▼
┌──────────────────────────────────────────────────────────────────┐
│                  ProjectService.scanProjects                      │
│           (src/lib/services/project-service.ts)                   │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ getSkipDirectories()                                         │ │
│  │   → DEFAULT_SKIP_DIRS + AppState.skipDirectories            │ │
│  │                                                              │ │
│  │ walkDirectory(dir, depth, maxDepth, found)                  │ │
│  │   → Check .claude/settings.json or settings.local.json      │ │
│  │   → readdir(dir) → entries                                   │ │
│  │   → Filter by skip directories                              │ │
│  │   → Promise.all(subdirs.map(walkSubdir))                    │ │
│  │     → Each subdir independent try/catch                     │ │
│  │     → console.error on failure, continue others             │ │
│  └─────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
```

### Recommended Project Structure
```
src/
├── cli/
│   ├── index.ts                    # Add first-run detection logic
│   └── prompts/
│       ├── wizards/
│       │   ├── main-wizard.ts      # Existing - no changes needed
│       │   └── first-run-wizard.ts # NEW - optional wrapper
│       └── components/             # Existing - all reusable
│           ├── input-api-key.ts    # SEC-04 password input
│           ├── select-directory.ts # Directory selection
│           ├── select-project.ts   # Project selection
│           ├── select-template.ts  # Config selection
│           └── confirm-action.ts   # Confirmation
│       └── utils/
│           ├── theme.ts            # OpenCode aesthetic
│           ├── handle-cancel.ts    # Ctrl+C handling
│           └── autocomplete.ts     # AUTOCOMPLETE_THRESHOLD=20
├── lib/
│   ├── constants/
│   │   └── skip-dirs.ts            # NEW - DEFAULT_SKIP_DIRS constant
│   ├── services/
│   │   ├── project-service.ts      # REFACTOR - walkDirectory Promise.all
│   │   └── project-service.test.ts # UPDATE - test parallel scanning
│   ├── store/
│   │   ├── state.ts                # UPDATE - add firstRunCompleted + skipDirectories
│   │   ├── state.test.ts           # UPDATE - test new fields
│   │   ├── api-config.ts           # Check if empty for first-run
│   │   └── project.ts              # Check if empty for first-run
│   └── types/
│       └── api-config.ts           # Existing - ApiConfig schema
```

### Pattern 1: Promise.all Parallel Scan with Independent Error Handling

**What:** Parallel directory traversal with per-directory error isolation
**When to use:** Scanning multiple subdirectories where failures should not block others
**Example:**
```typescript
// Source: [VERIFIED: src/lib/services/project-service.ts L106-137] - current implementation
// AFTER refactor per D-05/D-06:

private async walkDirectory(
  dir: string,
  depth: number,
  maxDepth: number,
  found: string[],
  skipDirs: string[]
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
    
    // Filter directories to scan
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

### Pattern 2: First-Run Detection at CLI Entry Point

**What:** Detect first-run condition in CLI entry before launching wizard
**When to use:** Phase 12 ONB-02 - check if user needs onboarding
**Example:**
```typescript
// Source: [VERIFIED: src/cli/index.ts L21-54] - existing entry point
// ADD detection logic per D-01/D-02:

export async function runCLI(argv: string[] = process.argv): Promise<void> {
  if (process.env.NO_COLOR) chalk.level = 0;

  const program = new Command();
  program.name('cc-config')
    .description('CLI tool for managing Claude Code API provider configurations')
    .version(VERSION, '-v, --version', 'output the current version')
    .helpOption('-h, --help', 'display help for command')
    .exitOverride();

  // Register all commands...

  const args = argv.slice(2);
  
  if (args.length === 0) {
    // D-01: Trigger at no-args invocation
    // D-02: Check dual conditions
    const appState = new AppState();
    const apiConfigStore = new ApiConfigStore();
    const projectIndex = new ProjectIndex();
    
    const firstRunCompleted = appState.get('firstRunCompleted');
    const hasConfigs = (await apiConfigStore.list()).length > 0;
    const hasProjects = (await projectIndex.getAll()).length > 0;
    
    if (!firstRunCompleted && !hasConfigs && !hasProjects) {
      // Launch first-run wizard
      await runMainWizard();
      appState.set('firstRunCompleted', true);
    } else {
      // Normal TUI launch
      await launchPromptsTUI();
    }
  } else {
    await program.parseAsync(argv);
  }
}
```

### Pattern 3: Skip Directories Configuration

**What:** Hardcoded default skip directories with user override capability
**When to use:** Phase 12 ONB-04 - skip common build/dependency directories
**Example:**
```typescript
// Source: [ASSUMED] - new file pattern similar to DEFAULT_STATE in state.ts

// src/lib/constants/skip-dirs.ts
/**
 * Default directories to skip during project scanning.
 * Per D-08: Hardcoded list of common build/dependency directories.
 * Per ONB-04: node_modules/.git/dist/build/target/.venv/__pycache__
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

// Usage in project-service.ts:
private getSkipDirectories(): string[] {
  const userSkipDirs = this.appState.get('skipDirectories') ?? [];
  // D-10: Merge default + user overrides
  return [...DEFAULT_SKIP_DIRS, ...userSkipDirs];
}
```

### Anti-Patterns to Avoid

- **Promise.all without error isolation:** Using single catch block will abort entire scan on first failure. Must use per-directory catch per D-06.
- **Checking firstRunCompleted alone:** If flag is false but configs exist, wizard would re-trigger. Must check triple condition per D-02.
- **Modifying AppState without schema validation:** Adding fields without updating AppStateData interface violates Zod validation. Must update schema.
- **Skip directories hardcoded in walkDirectory:** Violates D-09/D-10 which require user override capability via AppState.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Spinner/progress indicator | Custom setInterval animation | createSpinner in main-wizard.ts L22-45 | Already implemented, D-11 locks decision |
| Prompt cancel handling | Manual process.exit(0) | promptWithCancel + defaultOnCancel | Existing pattern handles Ctrl+C gracefully |
| Directory selection | Custom prompt logic | selectDirectory component | Existing component with custom path input |
| API config input | Manual prompts chain | inputFullApiConfig | Existing flow with SEC-04 password masking |
| First-run flag storage | Custom JSON file | AppState with conf package | XDG-compliant persistence, atomic writes |

**Key insight:** All wizard components exist and are reusable. Only parallel scanning and detection logic need implementation.

## Runtime State Inventory

> Phase 12 is NOT a rename/refactor/migration phase - skip this section.

## Common Pitfalls

### Pitfall 1: Promise.all Abort on First Error

**What goes wrong:** Using `await Promise.all(subdirs.map(...))` without per-item catch causes entire scan to fail when one directory has permission error.

**Why it happens:** Promise.all rejects immediately on first rejection by default.

**How to avoid:** Wrap each subdirectory scan in independent try/catch per D-06. Failed directories log error but others continue.

**Warning signs:** Scan stops prematurely; only partial results; permission errors in logs.

### Pitfall 2: First-Run Detection False Positive

**What goes wrong:** Wizard triggers for users who already have configs but firstRunCompleted flag is false (e.g., from previous version).

**Why it happens:** Only checking firstRunCompleted flag without verifying ApiConfigStore and ProjectIndex state.

**How to avoid:** Triple condition check per D-02: firstRunCompleted === false AND ApiConfigStore.list() === 0 AND ProjectIndex.getAll() === 0.

**Warning signs:** Wizard appears unexpectedly for existing users; configs/projects disappear.

### Pitfall 3: AppState Schema Evolution Breaking Existing Users

**What goes wrong:** Adding firstRunCompleted/skipDirectories fields without defaults causes undefined errors for users with existing state file.

**Why it happens:** AppState loads existing JSON without new fields; get('firstRunCompleted') returns undefined.

**How to avoid:** Update DEFAULT_STATE object with default values (false for firstRunCompleted, [] for skipDirectories). conf package will merge defaults per existing behavior.

**Warning signs:** TypeError accessing undefined; wizard hangs on first-run check.

### Pitfall 4: Skip Directory List Incomplete

**What goes wrong:** Scanning traverses .venv or __pycache__ directories, wasting time on Python projects.

**Why it happens:** Current L127 only checks node_modules and hidden directories (startsWith('.')).

**How to avoid:** Add complete DEFAULT_SKIP_DIRS per D-08 covering node_modules/.git/dist/build/target/.venv/__pycache__.

**Warning signs:** Slow scans on Python/Rust projects; found includes cache directories.

## Code Examples

### AppState Schema Evolution (D-03/D-09)

```typescript
// Source: [VERIFIED: src/lib/store/state.ts L23-52]
// UPDATE AppStateData interface:

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

// UPDATE DEFAULT_STATE:
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

### Spinner Implementation (D-11)

```typescript
// Source: [VERIFIED: src/cli/prompts/wizards/main-wizard.ts L22-45]
// Existing implementation - NO CHANGES needed

function createSpinner(message: string) {
  let frame = 0;
  const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

  const interval = setInterval(() => {
    process.stdout.write(`\r${frames[frame]} ${message}`);
    frame = (frame + 1) % frames.length;
  }, 80);  // 80ms frame rate - Claude's discretion for tuning

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

// Usage:
const spinner = createSpinner('扫描中...');
const results = await projectService.scanProjects(undefined, [directory]);
spinner.succeed(`扫描完成: ${results.length} 个项目`);  // D-13
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Ink React TUI | prompts terminal-native | Phase 09 (v2.0) | npm-style selection, j/k navigation |
| for-of serial scan | Promise.all parallel | Phase 12 (v2.0) | Faster scanning, independent error handling |
| Hardcoded node_modules skip | DEFAULT_SKIP_DIRS constant | Phase 12 (v2.0) | Covers Python/Rust/Java build dirs |
| No first-run detection | AppState.firstRunCompleted flag | Phase 12 (v2.0) | New user onboarding experience |

**Deprecated/outdated:**
- config-wizard.ts: Marked @deprecated per L16, will be removed in Phase 15
- TemplateStore/TemplateService: Will be replaced by ApiConfigStore/ApiService per CFG-06

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | DEFAULT_SKIP_DIRS constant placement in src/lib/constants/skip-dirs.ts | Pattern 3 | Alternative: place in project-service.ts inline; acceptable tradeoff |
| A2 | Spinner frame rate 80ms is optimal | Code Examples | User feedback may request adjustment; D-12 allows later optimization |
| A3 | firstRunCompleted default false is correct for new users | Pattern 2 | If true, wizard never triggers; verified by D-03 locking |

**Verification needed:**
- All other claims verified via code reading (VERIFIED) or npm registry (VERIFIED: npm)

## Open Questions

1. **Should first-run wizard be a separate file or reuse main-wizard.ts?**
   - What we know: main-wizard.ts already implements full flow L60-175
   - What's unclear: Whether to add detection wrapper or create first-run-wizard.ts wrapper
   - Recommendation: Reuse main-wizard.ts with detection in CLI entry point - simpler, avoids duplication

2. **Should DEFAULT_SKIP_DIRS use as const for type safety?**
   - What we know: Pattern 3 shows as const usage for immutable array
   - What's unclear: Whether TypeScript inference sufficient without explicit as const
   - Recommendation: Use as const per existing DEFAULT_STATE pattern - enables type inference in getSkipDirectories

## Environment Availability

> Phase 12 has external dependencies (fs.readdir, file system operations).

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js fs module | walkDirectory readdir | ✓ | 18.17+ (package.json engines) | — |
| fs-extra | pathExists, readdir | ✓ | 11.3.4 (package.json) | — |
| conf package | AppState persistence | ✓ | 15.1.0 (package.json) | — |
| prompts library | Wizard components | ✓ | 2.4.2 (package.json) | — |
| chalk | Spinner coloring | ✓ | 5.6.2 (package.json) | — |

**Missing dependencies with no fallback:**
- None - all required packages installed

**Missing dependencies with fallback:**
- None - no optional dependencies needed for Phase 12 core implementation

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 3.2.4 [VERIFIED: package.json] |
| Config file | vitest.config.ts [VERIFIED] |
| Quick run command | `npm test` or `vitest run` |
| Full suite command | `npm run test:coverage` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ONB-01 | First-run wizard launches | integration | `vitest run src/cli/index.test.ts` | ✅ Update needed |
| ONB-02 | firstRunCompleted flag detection | unit | `vitest run src/lib/store/state.test.ts` | ✅ Update needed |
| ONB-03 | Promise.all parallel scan | unit | `vitest run src/lib/services/project-service.test.ts` | ✅ Update needed |
| ONB-04 | Skip directories filtering | unit | `vitest run src/lib/services/project-service.test.ts` | ✅ Update needed |
| ONB-05 | Spinner displays during scan | integration | Manual verification (visual) | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `vitest run src/lib/services/project-service.test.ts -t "scanProjects"`
- **Per wave merge:** `vitest run src/lib/services/project-service.test.ts`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `src/cli/index.test.ts` — Add first-run detection integration test
- [ ] `src/lib/store/state.test.ts` — Add firstRunCompleted/skipDirectories field tests
- [ ] `src/lib/constants/skip-dirs.ts` — New file, needs constant tests
- [ ] `src/lib/services/project-service.test.ts` — Update parallel scan tests
- [ ] Manual test: Spinner visual verification during first-run wizard

*(Existing test infrastructure covers walkDirectory behavior, needs update for parallel scanning)*

## Security Domain

> Phase 12 has no authentication/crypto changes - skip detailed ASVS analysis.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | — (uses existing ApiConfigStore, SEC-01/SEC-04 already implemented) |
| V3 Session Management | no | — (CLI tool, no session state) |
| V4 Access Control | no | — (single-user local tool) |
| V5 Input Validation | yes | prompts validate + zod schema (SEC-02) |
| V6 Cryptography | no | — (no new crypto operations) |

### Known Threat Patterns for CLI/Prompts Stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Path traversal in scan | Tampering | walkDirectory depth limit (maxDepth=3) + skipDirs filtering |
| Directory permission escalation | Elevation | Independent try/catch per D-06, graceful skip on EACCES |
| Input injection in prompts | Tampering | prompts validate function + zod ApiConfigSchema |

## Sources

### Primary (HIGH confidence)
- [VERIFIED: npm registry] - prompts 2.4.2, chalk 5.6.2, ora 9.4.0
- [VERIFIED: src/lib/services/project-service.ts] - walkDirectory L106-137, scanProjects L70-95
- [VERIFIED: src/lib/store/state.ts] - AppStateData L23-37, DEFAULT_STATE L43-52
- [VERIFIED: src/cli/prompts/wizards/main-wizard.ts] - createSpinner L22-45, runMainWizard L60-175
- [VERIFIED: src/cli/index.ts] - runCLI L21-54 entry point structure
- [VERIFIED: src/cli/prompts/utils/handle-cancel.ts] - promptWithCancel pattern

### Secondary (MEDIUM confidence)
- [CITED: package.json] - All dependencies verified in manifest

### Tertiary (LOW confidence)
- None - all claims verified or marked [ASSUMED] in Assumptions Log

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All packages verified via npm registry and package.json
- Architecture: HIGH - Existing code patterns well-documented, wizard components verified
- Pitfalls: HIGH - Promise.all error handling well-known pattern, detection logic verified in CONTEXT.md

**Research date:** 2026-04-30
**Valid until:** 30 days (stable CLI patterns, no fast-moving dependencies)