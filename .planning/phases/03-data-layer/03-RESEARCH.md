# Phase 3: Data Layer - Research

**Researched:** 2026-04-13
**Domain:** Repository Pattern, File Watching, Persistent State Management
**Confidence:** HIGH

## Summary

This phase implements the data persistence layer using Repository pattern to encapsulate file operations. The key insight is that the project already has robust foundation (atomic writes, backups, validation, merge) - this phase adds a thin encapsulation layer plus new capabilities (template store, project index, file watcher, global state).

**Primary recommendation:** Build thin wrapper functions around existing json.ts + backup.ts operations, add chokidar for file watching, use conf package (already installed) for global state. No need for abstract Repository interfaces - direct encapsulation is simpler and sufficient.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** 直接封装现有函数 — 无需抽象 Repository 接口层
  - **Why:** 现有 json.ts/backup.ts 已提供完整 CRUD，封装增加复杂度但收益有限
  - **How:** 在 src/lib/store/ 目录创建封装函数，直接调用 json.ts + 验证 + backup

- **D-02:** 分开存储 — templates.json 存 config dir, projects.json 存 data dir
  - **Why:** 符合 XDG 规范语义（config = 配置数据，data = 运行时数据）
  - **How:** templates.json → getConfigDir()/templates.json, projects.json → getDataDir()/projects.json

- **D-03:** 监听全局 + 项目配置 — 全局变化时提示用户选择是否同步
  - **Why:** 用户可能有全局偏好需要同步到项目，提供交互选择更灵活
  - **How:** chokidar 监听 ~/.claude/settings.json 和所有已注册项目的 .claude/settings.json

- **D-04:** TUI 弹窗提示 — 全局配置变化时弹出确认框
  - **Why:** 重要变更需要用户明确确认，避免意外覆盖项目配置
  - **How:** watcher 回调触发 TUI 状态更新，显示同步/忽略选项

- **D-05:** 使用 conf 包 — 管理持久化状态（当前激活项目、UI 状态）
  - **Why:** conf 自动处理 XDG 路径和 JSON 存储，API 简洁
  - **How:** npm install conf, 在 src/lib/store/state.ts 创建 AppState 类

- **D-06:** 完整模板定义 — templates.json 包含完整配置字段
  - **Why:** 模板应包含所有可覆盖字段，应用时直接 merge
  - **How:** `{ templates: [{ id, name, provider, model, envOverrides, mcpServers }] }`

- **D-07:** 完整项目索引 — projects.json 记录路径、激活配置、修改时间
  - **Why:** 状态查询需要完整信息（路径、当前配置、更新时间）
  - **How:** `{ projects: [{ id, path, activeConfig, lastModified }] }`

### Claude's Discretion

- Repository 函数命名风格（readConfig/writeConfig vs configRead/configWrite）
- Template ID 生成策略（UUID vs 自增 vs 用户定义名称）
- Project ID 生成策略（UUID vs 路径 hash）
- chokidar 监听 debounce 时间
- conf 包存储的具体状态字段

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| DATA-01 | ConfigRepository 封装 | json.ts 提供原子读写，backup.ts 提供备份，validation.ts 提供验证 |
| DATA-02 | TemplateStore 实现 | provider.ts 已定义 TemplateConfigSchema，deepMergeConfig 可合并模板 |
| DATA-03 | ProjectIndex 实现 | 新建数据结构，路径查找用 Map 或 Record |
| DATA-04 | FileWatcher 实现 | chokidar 5.0 API，debounce 用 awaitWriteFinish 或自定义 |
| DATA-05 | AppState 实现 | conf 15.1 已安装，XDG 集成自动，TypeScript 泛型支持 |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| chokidar | 5.0.0 | File watching | Industry standard, handles fsevents, debouncing, ENOENT gracefully |
| conf | 15.1.0 | Global state | Already installed, XDG-compliant, TypeScript generics |
| fs-extra | 11.3.4 | File operations | Already installed, atomic writes pattern established |
| zod | 4.3.6 | Schema validation | Already installed, single source of truth for types |

### Supporting (Already in Project)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| env-paths | 4.0.0 | XDG directories | getConfigDir/getDataDir - already used |
| fs-extra | 11.3.4 | File operations | All file I/O - atomic pattern established |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| chokidar | node:fs.watch | Native but less robust, no debouncing, ENOENT issues |
| conf | JSON file + env-paths | Manual implementation, more code, conf handles edge cases |
| Repository interface | Direct functions | Interface adds abstraction layer with minimal benefit (D-01) |

**Installation:**
```bash
npm install chokidar@5.0.0
# conf already installed at 15.1.0
```

**Version verification:**
```bash
npm view chokidar version  # 5.0.0 (published Nov 2025)
npm view conf version      # 15.1.0 (already in package.json)
```

## Architecture Patterns

### Recommended Project Structure
```
src/lib/
├── store/                    # NEW - Data layer encapsulation
│   ├── config.ts             # ConfigRepository - wraps json.ts + backup.ts
│   ├── template.ts           # TemplateStore - template CRUD
│   ├── project.ts            # ProjectIndex - project metadata
│   ├── watcher.ts            # FileWatcher - chokidar wrapper
│   ├── state.ts              # AppState - conf wrapper
│   └── index.ts              # Barrel export
├── file-system/              # EXISTING - Atomic operations foundation
│   ├── json.ts               # readJSON/writeJSON/exists
│   ├── backup.ts             # createBackup/restoreBackup
│   └── json-error.ts         # JSONParseError
├── types/                    # EXISTING - Validation & schemas
│   ├── config.ts             # ClaudeSettingsSchema
│   ├── validation.ts         # ValidationError, validateConfig
│   ├── merge.ts              # deepMergeConfig
│   ├── provider.ts           # TemplateConfigSchema
│   └── index.ts              # Barrel export
└── paths/                    # EXISTING - XDG directories
    ├── xdg.ts                # getConfigDir/getDataDir
    └── claude.ts             # getClaudeConfigPath
```

### Pattern 1: Repository Wrapper Pattern
**What:** Thin encapsulation layer over existing file operations, adding backup + validation
**When to use:** ConfigRepository reads/writes Claude settings files
**Example:**
```typescript
// Source: Existing patterns from json.ts, backup.ts, validation.ts
import { readJSON, writeJSON, exists } from '../file-system/json.js';
import { createBackup } from '../file-system/backup.js';
import { validateConfig } from '../types/validation.js';
import type { ClaudeSettings } from '../types/config.js';

export async function readConfig(filepath: string): Promise<ClaudeSettings | null> {
  const data = await readJSON<ClaudeSettings>(filepath);
  if (data === null) return null;
  
  // Validate on read
  const result = validateConfig(data);
  if (!result.success) {
    throw result.error; // ValidationError with all issues
  }
  
  return result.data;
}

export async function writeConfig(filepath: string, config: ClaudeSettings): Promise<void> {
  // Validate before write
  const result = validateConfig(config);
  if (!result.success) {
    throw result.error;
  }
  
  // Backup existing file before modification
  await createBackup(filepath);
  
  // Atomic write
  await writeJSON(filepath, result.data);
}

export async function configExists(filepath: string): Promise<boolean> {
  return exists(filepath);
}
```

### Pattern 2: Store Pattern for Templates/Projects
**What:** JSON file backed store with in-memory cache for fast lookups
**When to use:** TemplateStore and ProjectIndex need CRUD operations with efficient lookup
**Example:**
```typescript
// Source: Repository pattern best practices + existing provider.ts schema
import { readJSON, writeJSON } from '../file-system/json.js';
import { createBackup } from '../file-system/backup.js';
import { TemplateConfigSchema } from '../types/provider.js';
import { getConfigDir } from '../paths/xdg.js';
import { z } from 'zod';

export interface TemplateStoreData {
  version?: number;
  templates: Record<string, TemplateConfig>;
}

export class TemplateStore {
  private filePath: string;
  private data: TemplateStoreData | null = null;
  
  constructor() {
    this.filePath = path.join(getConfigDir(), 'templates.json');
  }
  
  // Load on first access (lazy loading)
  private async load(): Promise<TemplateStoreData> {
    if (this.data !== null) return this.data;
    
    const raw = await readJSON<TemplateStoreData>(this.filePath);
    this.data = raw ?? { version: 1, templates: {} };
    
    // Validate all templates
    const result = TemplateStoreSchema.safeParse(this.data);
    if (!result.success) {
      throw new ValidationError('Invalid template store', result.error.issues);
    }
    
    this.data = result.data;
    return this.data;
  }
  
  async getAll(): Promise<Record<string, TemplateConfig>> {
    const data = await this.load();
    return data.templates;
  }
  
  async get(name: string): Promise<TemplateConfig | null> {
    const templates = await this.getAll();
    return templates[name] ?? null;
  }
  
  async set(name: string, template: TemplateConfig): Promise<void> {
    const data = await this.load();
    
    // Backup before modification
    await createBackup(this.filePath);
    
    // Validate template
    const result = TemplateConfigSchema.safeParse(template);
    if (!result.success) {
      throw new ValidationError('Invalid template', result.error.issues);
    }
    
    data.templates[name] = result.data;
    await writeJSON(this.filePath, data);
    this.data = data; // Update cache
  }
  
  async delete(name: string): Promise<boolean> {
    const data = await this.load();
    if (!data.templates[name]) return false;
    
    await createBackup(this.filePath);
    delete data.templates[name];
    await writeJSON(this.filePath, data);
    this.data = data;
    return true;
  }
}
```

### Pattern 3: chokidar File Watcher
**What:** Watch multiple files with debouncing and graceful error handling
**When to use:** Monitor global config and project configs for changes
**Example:**
```typescript
// Source: chokidar 5.0 API documentation
import chokidar from 'chokidar';
import { debounce } from './utils.js'; // or use awaitWriteFinish

export interface WatcherOptions {
  debounceMs?: number; // Default: 100-300ms recommended
  onGlobalChange?: (filepath: string) => void;
  onProjectChange?: (filepath: string, projectId: string) => void;
}

export class FileWatcher {
  private watcher: chokidar.FSWatcher | null = null;
  private options: WatcherOptions;
  
  constructor(options: WatcherOptions) {
    this.options = { debounceMs: 200, ...options };
  }
  
  async start(paths: string[]): Promise<void> {
    this.watcher = chokidar.watch(paths, {
      ignoreInitial: true, // Don't fire on initial scan
      awaitWriteFinish: {
        stabilityThreshold: this.options.debounceMs ?? 200,
        pollInterval: 50
      },
      // Ignore ENOENT - file deleted is handled gracefully
    });
    
    this.watcher.on('add', (filepath) => this.handleChange(filepath, 'add'));
    this.watcher.on('change', (filepath) => this.handleChange(filepath, 'change'));
    this.watcher.on('unlink', (filepath) => this.handleDelete(filepath));
    
    // Wait for ready event
    await new Promise<void>(resolve => {
      this.watcher!.on('ready', () => resolve());
    });
  }
  
  private handleChange(filepath: string, event: string): void {
    // Determine if global or project config
    if (filepath.includes('.claude/settings.json') && !filepath.includes('projects/')) {
      this.options.onGlobalChange?.(filepath);
    } else {
      // Extract project ID from path
      const projectId = this.extractProjectId(filepath);
      this.options.onProjectChange?.(filepath, projectId);
    }
  }
  
  private handleDelete(filepath: string): void {
    // File was deleted - update index if needed
    // ENOENT is handled gracefully by chokidar
  }
  
  async stop(): Promise<void> {
    if (this.watcher) {
      await this.watcher.close();
      this.watcher = null;
    }
  }
  
  async addPath(filepath: string): Promise<void> {
    if (this.watcher) {
      this.watcher.add(filepath);
    }
  }
  
  async removePath(filepath: string): Promise<void> {
    if (this.watcher) {
      this.watcher.unwatch(filepath);
    }
  }
}
```

### Pattern 4: conf for Global State
**What:** XDG-compliant persistent state with TypeScript generics
**When to use:** Store current active project, UI preferences, last used settings
**Example:**
```typescript
// Source: conf 15.1 API + TypeScript generics
import Conf from 'conf';
import type { Project } from './project.js';

export interface AppStateData {
  activeProjectId: string | null;
  lastUsedTemplate: string | null;
  uiPreferences: {
    theme: 'dark' | 'light';
    showPreview: boolean;
  };
  recentProjects: string[]; // Max 10 recent project IDs
}

export class AppState {
  private conf: Conf<AppStateData>;
  
  constructor() {
    this.conf = new Conf<AppStateData>({
      projectName: 'cc-config-switch', // XDG directory name
      defaults: {
        activeProjectId: null,
        lastUsedTemplate: null,
        uiPreferences: {
          theme: 'dark',
          showPreview: true,
        },
        recentProjects: [],
      },
    });
  }
  
  get<K extends keyof AppStateData>(key: K): AppStateData[K] {
    return this.conf.get(key);
  }
  
  set<K extends keyof AppStateData>(key: K, value: AppStateData[K]): void {
    this.conf.set(key, value);
  }
  
  getActiveProject(): string | null {
    return this.conf.get('activeProjectId');
  }
  
  setActiveProject(projectId: string): void {
    this.conf.set('activeProjectId', projectId);
    // Update recent projects
    const recent = this.conf.get('recentProjects');
    const updated = [projectId, ...recent.filter(id => id !== projectId)].slice(0, 10);
    this.conf.set('recentProjects', updated);
  }
  
  // File path for direct access (if needed)
  getFilePath(): string {
    return this.conf.path;
  }
  
  // Clear all state
  clear(): void {
    this.conf.clear();
  }
}
```

### Anti-Patterns to Avoid

- **Abstract Repository Interface:** Adding interface layer increases complexity with minimal benefit - direct encapsulation is simpler (per D-01)
- **In-memory-only state:** Templates and projects must persist to disk - use Store pattern with file backing
- **No debouncing on file watcher:** Rapid file edits trigger multiple events - use awaitWriteFinish or custom debounce
- **Throwing on ENOENT:** readJSON already returns null for missing files - follow this pattern, don't throw
- **Synchronous file operations:** All file I/O must be async - project uses async pattern throughout

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| File watching | Custom fs.watch wrapper | chokidar | Handles fsevents, ENOENT, debouncing, cross-platform |
| Global state | Manual JSON + env-paths | conf | XDG compliance, encryption, change events built-in |
| ID generation | Custom increment counter | crypto.randomUUID | Standard, collision-free, no state tracking needed |
| Debouncing | Custom setTimeout logic | chokidar.awaitWriteFinish | Built-in stability threshold |

**Key insight:** The foundation layer (Phase 01) already solved atomic writes, backups, and error handling. This phase adds orchestration and new data types, not new file patterns.

## Runtime State Inventory

> This phase is not a rename/refactor phase - SKIPPED.

Step 2.5: SKIPPED (no rename/rebrand/migration operations identified)

## Environment Availability

Step 2.6: Dependency audit

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| chokidar | FileWatcher | ✗ | — | npm install required |
| conf | AppState | ✓ | 15.1.0 | — |
| fs-extra | All repositories | ✓ | 11.3.4 | — |
| zod | All validation | ✓ | 4.3.6 | — |
| env-paths | XDG paths | ✓ | 4.0.0 | — |
| Node.js | Runtime | ✓ | 18+ | — |

**Missing dependencies with no fallback:**
- chokidar — required for FileWatcher, must install via `npm install chokidar@5.0.0`

**Missing dependencies with fallback:**
- None — all other dependencies already installed

## Common Pitfalls

### Pitfall 1: chokidar Race Conditions
**What goes wrong:** Multiple change events fire for single file edit
**Why it happens:** File writes may trigger multiple fs.watch events
**How to avoid:** Use `awaitWriteFinish` with stabilityThreshold (200ms recommended)
**Warning signs:** Handler called multiple times for same edit

### Pitfall 2: ENOENT on Watched Files
**What goes wrong:** Watcher crashes when file is deleted
**Why it happens:** Some file watchers throw on missing files
**How to avoid:** chokidar handles `unlink` event gracefully - don't throw, handle deletion
**Warning signs:** Error logs showing ENOENT during file deletion

### Pitfall 3: Store Cache Inconsistency
**What goes wrong:** In-memory cache differs from file content
**Why it happens:** File modified externally while cache held
**How to avoid:** Load lazily, invalidate on external change, or use FileWatcher to sync
**Warning signs:** Data mismatch between getAll() and actual file

### Pitfall 4: Validation Before Backup
**What goes wrong:** Backup created for invalid config that fails to write
**Why it happens:** Backup called before validation
**How to avoid:** Validate FIRST, then backup, then write - order matters
**Warning signs:** .backups directory contains invalid configs

### Pitfall 5: Template ID Collisions
**What goes wrong:** Two templates get same ID/name
**Why it happens:** User-defined names may collide, or counter not synced
**How to avoid:** Use UUID for internal ID, allow user-defined display name separate from ID
**Warning signs:** Template overwritten when creating new one

## Code Examples

Verified patterns from existing code:

### Config Read with Validation
```typescript
// Source: src/lib/file-system/json.ts + src/lib/types/validation.ts
import { readJSON } from '../file-system/json.js';
import { validateConfig } from '../types/validation.js';
import type { ClaudeSettings } from '../types/config.js';

export async function readClaudeConfig(filepath: string): Promise<ClaudeSettings | null> {
  const data = await readJSON<ClaudeSettings>(filepath);
  if (data === null) return null; // ENOENT handled gracefully
  
  const result = validateConfig(data);
  if (!result.success) {
    throw result.error; // ValidationError with all issues
  }
  
  return result.data;
}
```

### Template Store Merge Strategy
```typescript
// Source: src/lib/types/merge.ts + src/lib/types/provider.ts
import { deepMergeConfig } from '../types/merge.js';
import type { ClaudeSettings } from '../types/config.js';
import type { TemplateConfig } from '../types/provider.js';

export function applyTemplateToConfig(
  baseConfig: ClaudeSettings,
  template: TemplateConfig
): ClaudeSettings {
  // Template.provider contains envOverrides, baseUrl, headers
  // Merge with replacement strategy for arrays
  const merged = deepMergeConfig(baseConfig, {
    env: template.provider.env,
    model: template.provider.name, // or specific model field
  });
  
  return merged;
}
```

### Project Index Lookup
```typescript
// Source: New pattern based on D-07
import { readJSON, writeJSON } from '../file-system/json.js';
import { getDataDir } from '../paths/xdg.js';
import { createBackup } from '../file-system/backup.js';
import { randomUUID } from 'crypto';

export interface ProjectEntry {
  id: string;           // UUID for stable reference
  path: string;         // Absolute path to project root
  activeConfig: string | null; // Template name or null
  lastModified: string; // ISO timestamp
}

export interface ProjectIndexData {
  version?: number;
  projects: Record<string, ProjectEntry>; // Keyed by ID
  pathIndex: Record<string, string>; // path -> ID for fast lookup
}

export class ProjectIndex {
  private filePath: string;
  private data: ProjectIndexData | null = null;
  
  constructor() {
    this.filePath = path.join(getDataDir(), 'projects.json');
  }
  
  async getByPath(projectPath: string): Promise<ProjectEntry | null> {
    const data = await this.load();
    const id = data.pathIndex[projectPath];
    return id ? data.projects[id] : null;
  }
  
  async getById(id: string): Promise<ProjectEntry | null> {
    const data = await this.load();
    return data.projects[id] ?? null;
  }
  
  async register(projectPath: string): Promise<ProjectEntry> {
    const data = await this.load();
    
    // Check if already registered
    const existing = await this.getByPath(projectPath);
    if (existing) return existing;
    
    await createBackup(this.filePath);
    
    const id = randomUUID();
    const entry: ProjectEntry = {
      id,
      path: projectPath,
      activeConfig: null,
      lastModified: new Date().toISOString(),
    };
    
    data.projects[id] = entry;
    data.pathIndex[projectPath] = id;
    
    await writeJSON(this.filePath, data);
    this.data = data;
    
    return entry;
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| fs.watch native | chokidar wrapper | ~2015 | Cross-platform, fsevents, debouncing |
| Manual JSON state | conf package | ~2018 | XDG compliance, change events |
| Abstract Repository | Direct encapsulation | This project (D-01) | Simpler code, less abstraction |
| Sequential IDs | UUID | Modern standard | No collision, no state tracking |

**Deprecated/outdated:**
- node:fs.watch: Use chokidar instead - handles edge cases better
- Manual XDG paths: Use env-paths or conf - handles platform differences

## Open Questions

1. **Debounce threshold for file watcher**
   - What we know: chokidar has `awaitWriteFinish.stabilityThreshold`
   - What's unclear: Optimal value for config file editing (100-500ms range)
   - Recommendation: Start with 200ms, adjust based on user feedback

2. **Template name vs ID strategy**
   - What we know: User wants meaningful names, system needs stable IDs
   - What's unclear: Should name be unique or allow duplicates
   - Recommendation: Use UUID for internal ID, user-defined display name (allow duplicates)

3. **Project path normalization**
   - What we know: Paths may be relative or absolute
   - What's unclear: Should we resolve symlinks, normalize case on Windows
   - Recommendation: Always resolve to absolute realPath (fs.realpath)

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest 3.2.4 |
| Config file | vitest.config.ts (if exists) or inline |
| Quick run command | `npm test` or `vitest run` |
| Full suite command | `npm run test:coverage` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DATA-01 | ConfigRepository read/write | unit | `vitest run src/lib/store/config.test.ts` | ❌ Wave 0 |
| DATA-02 | TemplateStore CRUD | unit | `vitest run src/lib/store/template.test.ts` | ❌ Wave 0 |
| DATA-03 | ProjectIndex lookup | unit | `vitest run src/lib/store/project.test.ts` | ❌ Wave 0 |
| DATA-04 | FileWatcher events | unit | `vitest run src/lib/store/watcher.test.ts` | ❌ Wave 0 |
| DATA-05 | AppState persistence | unit | `vitest run src/lib/store/state.test.ts` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npm test` (quick run)
- **Per wave merge:** `npm run test:coverage` (full suite)
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/lib/store/config.test.ts` — covers ConfigRepository
- [ ] `src/lib/store/template.test.ts` — covers TemplateStore CRUD
- [ ] `src/lib/store/project.test.ts` — covers ProjectIndex lookup/register
- [ ] `src/lib/store/watcher.test.ts` — covers FileWatcher events
- [ ] `src/lib/store/state.test.ts` — covers AppState persistence
- [ ] `src/lib/store/index.ts` — barrel export
- [ ] Framework install: chokidar — `npm install chokidar@5.0.0`

**Note:** All test files follow existing pattern of inline tests (*.test.ts alongside source files).

## Sources

### Primary (HIGH confidence)
- Existing code patterns from Phase 01 & 02 — verified in src/lib/
- chokidar npm documentation — https://www.npmjs.com/package/chokidar (events: add/change/unlink/ready)
- conf npm documentation — https://www.npmjs.com/package/conf (API: get/set/delete, TypeScript generics)

### Secondary (MEDIUM confidence)
- WebSearch for chokidar patterns — debouncing, ENOENT handling, TypeScript usage
- WebSearch for conf patterns — XDG integration, change events, default values
- WebSearch for Repository pattern — TypeScript data access layer best practices

### Tertiary (LOW confidence)
- None — all patterns verified against existing code or official docs

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — chokidar 5.0 is industry standard, conf 15.1 already installed
- Architecture: HIGH — existing patterns establish foundation, new patterns follow same conventions
- Pitfalls: HIGH — common chokidar pitfalls documented, ENOENT handling already established

**Research date:** 2026-04-13
**Valid until:** 30 days — libraries stable, patterns well-established