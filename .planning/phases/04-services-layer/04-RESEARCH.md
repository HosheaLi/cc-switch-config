# Phase 4: Services Layer - Research

**Researched:** 2026-04-13
**Domain:** TypeScript Service Layer Architecture, Dependency Injection, Business Logic Patterns
**Confidence:** HIGH

## Summary

Phase 4 实现业务逻辑层，封装所有核心操作逻辑。Services 作为应用架构中间层，依赖 Data Layer (Phase 03) 提供的 Repositories，为上层 CLI/TUI (Phases 05-06) 提供业务操作接口。

Service layer 采用 **class-based + constructor injection** 模式 (D-01)，这是 TypeScript 服务层标准实践。不需要 DI 容器（如 InversifyJS/TSyringe），手动注入足够满足项目规模。测试通过传入 mock Repositories 实现隔离。

**Primary recommendation:** 使用 class-based services with manual DI，复用现有 Repositories 和 deepMergeConfig，Services 抛出 Error 由调用方处理。

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Services 作为类实现 + 构造函数注入 Repository 依赖
  - **Why:** 便于测试 mock Repositories，解耦清晰，符合依赖注入原则
  - **How:** 每个 Service 类接收 Repository 实例作为构造函数参数

- **D-02:** Services 抛出 Error，调用方 try/catch 处理
  - **Why:** 简单直接，Node.js 标准模式，与 Phase 01 的 JSONParseError 保持一致
  - **How:** Service 失败时抛出 Error（可自定义 ServiceError 类型），调用方捕获

- **D-03:** 模板与现有配置 deep merge，保留非覆盖字段
  - **Why:** 用户可保留自定义配置（如特定的 MCP servers），模板只覆盖定义的字段
  - **How:** 使用 Phase 02 的 `deepMergeConfig`，模板字段覆盖，未定义字段保留

- **D-04:** 自动扫描用户配置的根目录 + 手动确认注册
  - **Why:** 减少手动操作，同时避免意外注册不想管理的项目
  - **How:** 扫描用户配置的根目录列表，发现含 `.claude/` 的目录，弹出确认列表

- **D-05:** 用户配置根目录列表（存储于 AppState 或单独配置）
  - **Why:** 灵活可控，用户明确指定扫描范围
  - **How:** AppState 新增 `scanDirectories: string[]` 字段，用户可添加/移除

- **D-06:** 基础连通性测试 — HEAD / 或 health endpoint
  - **Why:** 快速验证 endpoint 可达，无需有效 token
  - **How:** 发送 HEAD 请求到 baseUrl，检查响应状态码

- **D-07:** 统一从 `src/lib/services/index.ts` 导出所有 Services
  - **Why:** 与 store 模块一致，简化导入路径
  - **How:** 创建 index.ts 导出所有 Service 类和类型

### Claude's Discretion
- Service 类方法命名风格（camelCase）
- 具体方法签名细节（返回类型、参数命名）
- Scan 目录默认值（空数组 vs ~/.claude/projects）
- Provider 测试超时时间
- 扫描并发数和性能优化策略

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| F1 | Profile CRUD Operations (create/list/switch/delete) | ConfigService + TemplateService provide full CRUD via Repositories |
| F7 | Custom Provider Templates (template management) | TemplateService wraps TemplateStore with validation and merge logic |
| F4 | List All Projects (project status display) | ProjectService.getAll() returns all registered projects with status |
| M4 | Module Separation (services independent of UI) | Services in separate directory, no UI imports, pure business logic |

</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| TypeScript | 6.0.2 (project) | Service type definitions | Project standard, full type inference |
| Node.js | >=18.17 (project) | Native fetch API | Built-in HTTP client, no dependency needed |
| Zod | 4.3.6 (project) | Runtime validation | Schema validation in services |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| fs-extra | 11.3.4 (project) | Directory scanning | Recursive walk for project detection |
| conf | 15.1.0 (project) | AppState storage | scanDirectories persistence |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Manual DI | InversifyJS/TSyringe | Overkill for project size, adds complexity |
| Native fetch | axios/http client | More dependencies, axios useful for retry logic |
| Custom scan | globby/fast-glob | Glob patterns simpler but less control over depth |

**Version verification:** Project dependencies already installed, versions verified via package.json:
- TypeScript 6.0.2 ✓
- Node.js 25.6.1 (native fetch confirmed) ✓
- Zod 4.3.6 ✓
- fs-extra 11.3.4 ✓
- conf 15.1.0 ✓

## Architecture Patterns

### Recommended Project Structure
```
src/lib/services/
├── config-service.ts     # ConfigService: config operations + merge
├── project-service.ts    # ProjectService: project detection + indexing
├── template-service.ts   # TemplateService: template CRUD + apply
├── provider-service.ts   # ProviderService: connectivity test
├── types.ts              # ServiceError + service-specific types
└── index.ts              # Barrel export
```

### Pattern 1: Class-Based Service with Constructor Injection

**What:** Service classes receive Repository instances via constructor, enabling test isolation.

**When to use:** All services in this phase (D-01 locked).

**Example:**
```typescript
// Source: Existing project pattern from src/lib/store/template.ts
import { TemplateStore } from '../store/template.js';
import { ConfigRepository } from '../store/config.js';
import { deepMergeConfig } from '../types/merge.js';

export class TemplateService {
  constructor(
    private templateStore: TemplateStore,
    private configRepo: typeof import('../store/config.js')
  ) {}

  async applyTemplate(projectPath: string, templateName: string): Promise<void> {
    // Business logic: get template, load config, merge, validate, write
    const template = await this.templateStore.get(templateName);
    if (!template) {
      throw new ServiceError(`Template "${templateName}" not found`);
    }
    
    const configPath = `${projectPath}/.claude/settings.json`;
    const existingConfig = await this.configRepo.readConfig(configPath);
    
    const merged = deepMergeConfig(existingConfig ?? {}, template.provider);
    await this.configRepo.writeConfig(configPath, merged);
  }
}
```

### Pattern 2: Error Handling - Services Throw, Caller Catches

**What:** Services throw errors, callers handle via try/catch. Custom ServiceError extends Error.

**When to use:** All service operations (D-02 locked).

**Example:**
```typescript
// Source: Existing pattern from src/lib/types/validation.ts
export class ServiceError extends Error {
  public readonly code: string;
  
  constructor(message: string, code: string) {
    super(message);
    this.name = 'ServiceError';
    this.code = code;
  }
}

// Usage in service
async function someOperation(): Promise<void> {
  if (!condition) {
    throw new ServiceError('Operation failed', 'OPERATION_FAILED');
  }
}

// Caller handles
try {
  await service.someOperation();
} catch (error) {
  if (error instanceof ServiceError) {
    console.error(`[${error.code}] ${error.message}`);
  }
}
```

### Pattern 3: Directory Scanning for .claude Detection

**What:** Recursive directory walk to find projects containing `.claude/settings.json`.

**When to use:** ProjectService.scanProjects() (D-04 locked).

**Example:**
```typescript
// Source: Standard Node.js pattern with fs-extra
import fs from 'fs-extra';
import path from 'path';

async function scanForProjects(rootDir: string, maxDepth: number = 3): Promise<string[]> {
  const projects: string[] = [];
  
  async function walk(dir: string, depth: number): Promise<void> {
    if (depth > maxDepth) return;
    
    const claudeDir = path.join(dir, '.claude');
    const settingsPath = path.join(claudeDir, 'settings.json');
    
    if (await fs.pathExists(settingsPath)) {
      projects.push(dir);
    }
    
    // Scan subdirectories
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory() && !entry.name.startsWith('.')) {
        await walk(path.join(dir, entry.name), depth + 1);
      }
    }
  }
  
  await walk(rootDir, 0);
  return projects;
}
```

### Pattern 4: Provider Connectivity via HEAD Request

**What:** Simple HEAD request to baseUrl to verify endpoint reachable, no auth required.

**When to use:** ProviderService.testConnectivity() (D-06 locked).

**Example:**
```typescript
// Source: Node.js native fetch (available since Node 18)
const CONNECTIVITY_TIMEOUT = 5000; // 5 seconds

async function testConnectivity(baseUrl: string): Promise<boolean> {
  try {
    const response = await fetch(baseUrl, {
      method: 'HEAD',
      signal: AbortSignal.timeout(CONNECTIVITY_TIMEOUT)
    });
    
    // Any response (even 404) means endpoint is reachable
    return true;
  } catch (error) {
    // Network errors, timeouts, DNS failures
    return false;
  }
}
```

### Pattern 5: Testing Services with Mocked Repositories

**What:** Pass mock Repositories to Service constructor for test isolation.

**When to use:** All service tests.

**Example:**
```typescript
// Source: Existing pattern from src/lib/store/template.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { TemplateService } from './template-service.js';
import { TemplateStore } from '../store/template.js';

describe('TemplateService', () => {
  let tempDir: string;
  let templateStore: TemplateStore;
  let service: TemplateService;
  
  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'template-service-test-'));
    const templatesFile = path.join(tempDir, 'templates.json');
    templateStore = new TemplateStore(templatesFile);
    service = new TemplateService(templateStore, ...);
  });
  
  afterEach(async () => {
    await fs.remove(tempDir);
  });
  
  it('should apply template to project config', async () => {
    // Test with isolated temp directory
  });
});
```

### Anti-Patterns to Avoid
- **DI Container Over-engineering:** InversifyJS/TSyringe adds complexity for small project size — use manual DI
- **Service calling UI:** Services should not import TUI components — violates M4 module separation
- **Catching in Service:** Services throw, callers catch — don't swallow errors in service layer
- **Deep scan without limit:** Scanning entire filesystem causes performance issues — always limit depth

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Config merge | Custom merge logic | `deepMergeConfig` from merge.ts | Already tested, handles arrays correctly |
| Validation | Manual validation | `validateConfig` from validation.ts | Schema-based, comprehensive error collection |
| File operations | Custom read/write | `readConfig/writeConfig` from config.ts | Atomic writes, backups, validation integrated |
| State persistence | Custom JSON storage | `AppState` from state.ts | conf package handles XDG paths |
| HTTP requests | axios/node-fetch | Native `fetch` | Built-in, no dependency, timeout support |

**Key insight:** Repositories from Phase 03 already handle atomic writes, backups, validation. Services should call Repositories, not duplicate file logic.

## Runtime State Inventory

> Phase 04 is greenfield (creating new services), not rename/refactor. No runtime state to migrate.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | None — Phase creates new services | N/A |
| Live service config | None — No external services | N/A |
| OS-registered state | None — Pure code | N/A |
| Secrets/env vars | None — Services use existing AppState | N/A |
| Build artifacts | None — tsup handles compilation | N/A |

## Common Pitfalls

### Pitfall 1: Service Depends on UI
**What goes wrong:** Service imports Ink components or TUI state, violating M4 separation.
**Why it happens:** Temptation to share UI state with services for convenience.
**How to avoid:** Services only import from `store/`, `types/`, `file-system/`. No UI imports.
**Warning signs:** Service file imports from `src/lib/tui/` or `ink`.

### Pitfall 2: Swallowing Errors in Service
**What goes wrong:** Service catches errors and returns null/default instead of throwing.
**Why it happens:** Attempt to be "helpful" by not crashing.
**How to avoid:** Services throw ServiceError, callers decide how to handle.
**Warning signs:** `catch (error) { return null; }` in service method.

### Pitfall 3: Deep Scan Without Depth Limit
**What goes wrong:** scanProjects() walks entire filesystem, takes minutes.
**Why it happens:** Not limiting recursion depth.
**How to avoid:** Default maxDepth=3, configurable via AppState.
**Warning signs:** scanProjects() hanging on large directory trees.

### Pitfall 4: Fetch Without Timeout
**What goes wrong:** testConnectivity() hangs indefinitely on slow/unreachable endpoints.
**Why it happens:** Not setting timeout on fetch request.
**How to avoid:** Use `AbortSignal.timeout(5000)` or custom AbortController.
**Warning signs:** Connectivity tests taking >30 seconds.

### Pitfall 5: Service Mutating Repository State
**What goes wrong:** Service modifies Repository internal state directly instead of calling methods.
**Why it happens:** Trying to optimize by bypassing Repository methods.
**How to avoid:** Services call Repository public methods only.
**Warning signs:** Direct property access like `repo.data.projects` in service.

## Code Examples

Verified patterns from existing project code:

### Service Constructor Injection
```typescript
// Source: Pattern from src/lib/store/template.ts (TemplateStore class)
import { TemplateStore } from '../store/template.js';
import { ConfigRepository } from '../store/config.js';
import type { TemplateConfig } from '../types/provider.js';

export class TemplateService {
  private store: TemplateStore;
  
  constructor(customStorePath?: string) {
    this.store = new TemplateStore(customStorePath);
  }
  
  async createTemplate(name: string, config: TemplateConfig): Promise<void> {
    await this.store.set(name, config);
  }
}
```

### Apply Template with Deep Merge
```typescript
// Source: Pattern from src/lib/types/merge.ts deepMergeConfig
import { deepMergeConfig } from '../types/merge.js';
import { readConfig, writeConfig } from '../store/config.js';
import type { ClaudeSettings } from '../types/config.js';

async applyTemplate(projectPath: string, templateName: string): Promise<void> {
  const template = await this.store.get(templateName);
  if (!template) {
    throw new ServiceError(`Template not found: ${templateName}`, 'TEMPLATE_NOT_FOUND');
  }
  
  const configPath = path.join(projectPath, '.claude', 'settings.json');
  const existing = await readConfig(configPath) ?? {};
  
  // Deep merge: template overrides existing fields, preserves others
  const merged = deepMergeConfig(existing, template.provider as Partial<ClaudeSettings>);
  
  await writeConfig(configPath, merged);
}
```

### Directory Scan for Projects
```typescript
// Source: Pattern from fs-extra recursive walk
async scanProjects(rootDirs: string[], maxDepth: number = 3): Promise<string[]> {
  const found: string[] = [];
  
  for (const rootDir of rootDirs) {
    await this.walkDirectory(rootDir, 0, maxDepth, found);
  }
  
  return found;
}

private async walkDirectory(dir: string, depth: number, maxDepth: number, found: string[]): Promise<void> {
  if (depth > maxDepth) return;
  
  const claudePath = path.join(dir, '.claude', 'settings.json');
  if (await fs.pathExists(claudePath)) {
    found.push(dir);
  }
  
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
        await this.walkDirectory(path.join(dir, entry.name), depth + 1, maxDepth, found);
      }
    }
  } catch {
    // Permission errors, skip directory
  }
}
```

### Provider Connectivity Test
```typescript
// Source: Node.js native fetch with timeout
const DEFAULT_TIMEOUT_MS = 5000;

async testConnectivity(baseUrl: string): Promise<{ reachable: boolean; latency?: number }> {
  const start = Date.now();
  
  try {
    const response = await fetch(baseUrl, {
      method: 'HEAD',
      signal: AbortSignal.timeout(DEFAULT_TIMEOUT_MS)
    });
    
    const latency = Date.now() - start;
    return { reachable: true, latency };
  } catch (error) {
    if (error instanceof Error && error.name === 'TimeoutError') {
      return { reachable: false };
    }
    return { reachable: false };
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Callback-based services | Async/await | ES2017+ | Cleaner code, better error handling |
| DI containers (InversifyJS) | Manual injection | Modern TypeScript | Simpler for small projects |
| axios for HTTP | Native fetch | Node 18+ | No dependency needed |
| glob patterns for scan | Recursive walker | Custom control | Depth limits, filtering |

**Deprecated/outdated:**
- **axios for simple HEAD requests:** Native fetch sufficient, axios overkill
- **InversifyJS for small projects:** Adds complexity without benefit for <10 services
- **Promise callbacks:** Use async/await consistently

## Open Questions

1. **AppState scanDirectories field naming**
   - What we know: AppState currently has `activeProjectId`, `lastUsedTemplate`, `uiPreferences`, `recentProjects`
   - What's unclear: Should scanDirectories be in `uiPreferences` or separate field?
   - Recommendation: Separate field `scanDirectories: string[]` for clarity, matches D-05

2. **Provider connectivity timeout default**
   - What we know: 5 seconds is reasonable for most endpoints
   - What's unclear: Should timeout be configurable per provider?
   - Recommendation: Start with 5s default, add provider-specific timeout in template config if needed

3. **Scan directory default value**
   - What we know: Empty array means no auto-scan
   - What's unclear: Should default be `['~/code']` or similar?
   - Recommendation: Empty array `[]` — user explicitly adds directories (D-05)

## Environment Availability

> Step 2.6: SKIPPED (no external dependencies identified)
> 
> All required tools are already in project:
> - Node.js 25.6.1 with native fetch ✓
> - TypeScript 6.0.2 ✓
> - vitest 3.2.4 ✓
> - All npm dependencies installed ✓

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js fetch | ProviderService.testConnectivity | ✓ | native | — |
| fs-extra | ProjectService.scanProjects | ✓ | 11.3.4 | — |
| conf | AppState.scanDirectories | ✓ | 15.1.0 | — |
| vitest | Service tests | ✓ | 3.2.4 | — |

**Missing dependencies with no fallback:** None

**Missing dependencies with fallback:** None

## Validation Architecture

> nyquist_validation: true (from .planning/config.json)

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest 3.2.4 |
| Config file | vitest.config.ts |
| Quick run command | `npm test` (vitest run) |
| Full suite command | `npm run test:coverage` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| F1 | Profile CRUD Operations | unit | `vitest run src/lib/services/config-service.test.ts` | ❌ Wave 0 |
| F7 | Template management | unit | `vitest run src/lib/services/template-service.test.ts` | ❌ Wave 0 |
| F4 | List all projects | unit | `vitest run src/lib/services/project-service.test.ts` | ❌ Wave 0 |
| M4 | Services independent of UI | integration | Verify imports (no tui/ink) | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npm test` (quick run)
- **Per wave merge:** `npm run test:coverage` (full suite with coverage)
- **Phase gate:** Full suite green + ≥80% coverage before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/lib/services/config-service.test.ts` — covers F1 (Profile CRUD)
- [ ] `src/lib/services/project-service.test.ts` — covers F4 (List Projects)
- [ ] `src/lib/services/template-service.test.ts` — covers F7 (Template CRUD)
- [ ] `src/lib/services/provider-service.test.ts` — covers connectivity tests
- [ ] `src/lib/services/types.ts` — ServiceError class definition
- [ ] Framework setup: existing (vitest.config.ts present)

**Test pattern to follow:** Co-located tests (`.test.ts` adjacent to source), temp directory isolation (fs.mkdtemp), beforeEach/afterEach cleanup.

## Sources

### Primary (HIGH confidence)
- Existing project code: `src/lib/store/*.ts` — Repository patterns verified
- Existing project code: `src/lib/types/merge.ts` — deepMergeConfig verified
- Existing project code: `src/lib/types/validation.ts` — ValidationError verified
- Node.js docs: Native fetch API — https://nodejs.org/api/globals.html#fetch

### Secondary (MEDIUM confidence)
- Existing tests: `src/lib/store/*.test.ts` — Testing patterns verified
- TypeScript Handbook: Service patterns — https://www.typescriptlang.org/docs/handbook/2/classes.html
- fs-extra docs: Recursive directory operations — https://github.com/jprichardson/node-fs-extra

### Tertiary (LOW confidence)
- Web search: TypeScript DI patterns — verified against project patterns
- Web search: Deep merge vs shallow merge — verified against existing merge.ts implementation

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — All dependencies already in project, versions verified
- Architecture: HIGH — Patterns verified from existing project code (store/*.ts classes)
- Pitfalls: HIGH — Based on common TypeScript service layer mistakes, project-specific warnings

**Research date:** 2026-04-13
**Valid until:** 30 days (stable patterns, TypeScript/Node.js well-established)