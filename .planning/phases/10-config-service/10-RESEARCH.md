---
security_review: true
researched: 2026-04-30
domain: Configuration management service refactoring - ApiConfig replacement, precise field replacement, security handling
confidence: HIGH
---

# Phase 10: Config Service - Research

**Researched:** 2026-04-30
**Domain:** Configuration management service refactoring - ApiConfig replacement, precise field replacement, security handling
**Confidence:** HIGH

## Summary

Phase 10 implements the core configuration management service refactoring: replacing v1.0 TemplateConfig with simplified ApiConfig (三元组 + mode), precise field replacement (只改 env/model 保留其他), and secure API key handling. This phase establishes the foundation for v2.0's terminal-native configuration workflow.

The primary challenge is the precise field replacement pattern: existing deepMergeConfig merges entire objects, but CFG-02 requires replacing only env/model fields while preserving permissions/hooks/mcpServers. This requires a new replaceEnvModel function with exact semantics.

**Primary recommendation:** Refactor TemplateStore → ApiConfigStore following existing class patterns, implement replaceEnvModel as a separate utility (not modifying deepMergeConfig), reuse maskToken for API key security.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** ApiConfig 包含 name/apiKey/baseUrl/mode/modelName/env 字段
- **D-02:** mode 字段支持 'unified' 和 'granular' 两种配置模式
- **D-03:** unified 模式使用 modelName 字段（单一模型名）
- **D-04:** granular 模式使用完整 env 对象（ClaudeSettings.env 格式）
- **D-05:** name 在全局配置库中唯一（跨项目共享）
- **D-06:** 默认配置模式为 unified（简化首次配置）
- **D-07:** 全局配置库存储于 ~/.claude/api-configs.json（XDG 标准位置）
- **D-08:** Phase 10 立即重构 TemplateStore → ApiConfigStore（不延后 Phase 15）
- **D-09:** 禁止 apiKey 通过 CLI args 传递（避免 shell history 泄漏）
- **D-10:** 复用 maskToken 函数用于 apiKey masking（显示最后4字符）
- **D-11:** Password-type input 延后 Phase 11 实现（config add 命令时）
- **D-12:** 新建 replaceEnvModel 函数实现精确字段替换（不修改 deepMergeConfig）
- **D-13:** 完全替换 env/model 字段（不保留旧值，简单明确）
- **D-14:** unified 模式生成标准 env 对象（6个模型变量 + apiKey + baseUrl）

### Claude's Discretion
- ApiConfigStore 具体实现细节
- replaceEnvModel 函数内部逻辑
- 数据迁移策略（v1.0 templates → v2.0 api-configs）
- maskToken 扩展到 apiKey 的边界情况处理

### Deferred Ideas (OUT OF SCOPE)
- Password-type input — Phase 11 (config add CLI 命令)
- CLI config 命令 — Phase 11
- 首次引导流程 — Phase 12
- Ink React TUI 移除 — Phase 15（TemplateService/TemplateStore 已在 Phase 10 重构）

</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| CFG-01 | User can store multiple API configs as 三元组 (name + apiKey + baseUrl + modelName) | ApiConfigSchema with unified/granular modes, ApiConfigStore CRUD operations |
| CFG-02 | User's permissions/hooks/mcpServers preserved when applying config (precise field replacement) | replaceEnvModel function - exact field replacement, preserve non-env/model fields |
| CFG-04 | User sees API key masked in all display contexts (preview/diff/logs) | maskToken function reuse, applyMaskedApiKey utility for display contexts |
| SEC-01 | User's API key never exposed in CLI args, logs, screenshots | Service design - no CLI args, maskToken for logs, service-layer enforcement |
| SEC-03 | System maintains atomic write and backup from v1.0 (R1/R2) | Existing writeJSON + createBackup patterns preserved, ApiConfigStore inherits same safety |

</phase_requirements>

<security_analysis>
## Security Analysis (STRIDE Threat Model)

Phase 10 handles API keys and authentication tokens, requiring comprehensive security review.

### Threat Analysis

| Threat Category | Risk Level | Attack Vector | Mitigation Strategy | Implementation |
|-----------------|------------|---------------|---------------------|----------------|
| **Spoofing** | LOW | Impersonation via stolen apiKey | API key validation, unique config names | ApiConfigSchema validation |
| **Tampering** | MEDIUM | Injection via baseUrl field | URL validation, sanitize input | Zod .url() validation |
| **Tampering** | HIGH | Partial write crash corruption | Atomic write-rename pattern | writeJSON (R1), createBackup (R2) |
| **Repudiation** | LOW | No audit trail for config changes | Timestamp tracking, backup history | createdAt/updatedAt, .backups dir |
| **Information Disclosure** | HIGH | API key in shell history | Block CLI args for apiKey | D-09: validateNoCliApiKey |
| **Information Disclosure** | HIGH | API key in process listings | Block CLI args for apiKey | D-09: service-layer enforcement |
| **Information Disclosure** | HIGH | API key in crash dumps/logs | Mask before logging | maskToken, D-10 |
| **Information Disclosure** | MEDIUM | Config file read by other users | File permissions 600 | checkGitTracking pattern |
| **Information Disclosure** | MEDIUM | Config file in git repo | .gitignore patterns | Existing .gitignore validation |
| **Denial of Service** | LOW | Corrupted config prevents load | Graceful error handling, defaults | readJSON returns null for ENOENT |
| **Elevation of Privilege** | N/A | Not applicable for this phase | — | — |

### Critical Security Controls

1. **D-09: CLI Argument Blocking**
   - Service-level validation rejects any apiKey passed via command-line
   - Prevents shell history leakage (HISTIGNORE not sufficient)
   - Prevents process listing visibility (ps aux)
   ```typescript
   validateNoCliApiKey(args: string[]): void {
     // Scan args for apiKey patterns, throw SecurityError if found
   }
   ```

2. **D-10: Masking Enforcement**
   - Reuse maskToken for consistent display format (...last4)
   - Apply to ALL display contexts: preview, diff, logs, error messages
   - Never include raw apiKey in ServiceError context
   ```typescript
   applyMaskedApiKey(config: ApiConfig): MaskedApiConfig
   ```

3. **R1/R2: Atomic Write Safety**
   - writeJSON uses temp file + rename (POSIX atomic)
   - createBackup before every modification
   - Crash at any point leaves valid config or valid backup

4. **File Permission Enforcement**
   - Recommend chmod 600 for api-configs.json
   - Existing pattern from validateTokenSecurity
   - .gitignore check to prevent accidental commit

### Security Testing Requirements

| Control | Test Type | Verification Method |
|---------|-----------|---------------------|
| CLI arg blocking | Unit | Pass args with apiKey patterns, expect SecurityError |
| Masking | Unit | verify maskApiKey returns "...last4" format |
| Atomic write | Unit | Interrupt writeJSON, verify valid file or backup exists |
| File permissions | Integration | verify chmod 600 recommended in warnings |

### Security Dependencies

- maskToken: Existing function from v1.0, proven pattern
- writeJSON: Existing atomic write pattern (R1)
- createBackup: Existing timestamped backup pattern (R2)
- checkGitTracking: Existing gitignore validation

</security_analysis>

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| API config CRUD | Services/Store | — | Data layer owns persistence, Services orchestrate operations |
| Field replacement | Services | Types | replaceEnvModel in Services, uses ClaudeSettings type |
| API key masking | Services | CLI/Display | maskToken in security, applied at service boundary |
| Atomic write | File-system | Store | writeJSON pattern, Store invokes for persistence |
| Config validation | Types | Store | Zod schemas validate at Store boundary |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| zod | 4.3.6 [VERIFIED: package.json] | Schema validation | Existing pattern, type inference via z.infer<> |
| fs-extra | 11.3.4 [VERIFIED: package.json] | File operations | Existing pattern, atomic write-rename |
| env-paths | 4.0.0 [VERIFIED: package.json] | XDG directories | Existing pattern, cross-platform config location |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| vitest | 3.2.4 [VERIFIED: package.json] | Test framework | All test files, coverage validation |
| fs-extra | 11.3.4 | Temp directory isolation | beforeEach/afterEach test patterns |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| New replaceEnvModel | Modify deepMergeConfig | deepMergeConfig preserved for other uses, separate function clearer |
| Store apiKey in separate file | Single api-configs.json | Simpler model, single file, XDG standard location |

**Installation:** Already installed - no new dependencies needed for Phase 10.

**Version verification:**
```bash
npm view zod version  # 4.4.1 (project has 4.3.6, within major version)
npm view fs-extra version  # 11.3.4 (matches project)
npm view env-paths version  # 4.0.0 (matches project)
npm view vitest version  # 4.1.5 (project has 3.2.4, within major version)
```

## Architecture Patterns

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           Config Application Flow                        │
└─────────────────────────────────────────────────────────────────────────┘

┌──────────────┐     ┌──────────────┐     ┌──────────────────────────────┐
│  ApiConfig   │     │ ApiConfigStore│     │        ~/.claude/            │
│  (三元组)    │────▶│    CRUD      │────▶│    api-configs.json          │
│              │     │              │     │    (全局配置库)               │
└──────────────┘     └──────────────┘     └──────────────────────────────┘
       │                    │                          │
       │                    │                          │
       ▼                    ▼                          │
┌──────────────┐     ┌──────────────┐                  │
│  unified     │     │  granular    │                  │
│  mode        │     │  mode        │                  │
│ (modelName)  │     │ (full env)   │                  │
└──────────────┘     └──────────────┘                  │
       │                    │                          │
       │                    │                          │
       ▼                    ▼                          ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                      ConfigService.applyConfig                           │
│  ┌─────────────────┐    ┌────────────────────────────────────────────┐  │
│  │ replaceEnvModel │───▶│ ClaudeSettings (env/model replaced, others │  │
│  │ (精确替换)      │    │            preserved)                       │  │
│  └─────────────────┘    └────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                    .claude/settings.json (项目配置)                       │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │ env: { ANTHROPIC_MODEL, ANTHROPIC_AUTH_TOKEN, ANTHROPIC_BASE_URL } │ │
│  │ model: (optional)                                                   │ │
│  │ permissions: [...] ← PRESERVED                                      │ │
│  │ hooks: [...] ← PRESERVED                                            │ │
│  │ mcpServers: {...} ← PRESERVED                                       │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                           Security Boundary                              │
└─────────────────────────────────────────────────────────────────────────┘
┌──────────────┐     ┌──────────────┐     ┌──────────────────────────────┐
│  apiKey      │────▶│  maskToken   │────▶│  Display: "...xyz"          │
│  (secret)    │     │  (last 4)    │     │  Logs: "...xyz"             │
└──────────────┘     └──────────────┘     └──────────────────────────────┘
       │                    │                          │
       │                    │                          │
       ▼                    ▼                          ▼
┌──────────────┐     ┌──────────────┐     ┌──────────────────────────────┐
│  CLI args    │     │  Service     │     │  Never exposed in:           │
│  ❌ BLOCKED  │     │  enforcement │     │  - process listings          │
└──────────────┘     └──────────────┘     │  - shell history             │
                                          │  - crash dumps                │
                                          │  - screenshots                │
                                          └──────────────────────────────┘
```

### Recommended Project Structure

```
src/lib/
├── types/
│   ├── api-config.ts         # NEW: ApiConfigSchema, ApiConfig type
│   ├── provider.ts           # MODIFIED: Keep ApiProviderConfig, remove TemplateConfig
│   ├── config.ts             # PRESERVED: ClaudeSettings schema
│   ├── merge.ts              # PRESERVED: deepMergeConfig (unchanged)
│   ├── replacement.ts        # NEW: replaceEnvModel function
│   └── index.ts              # MODIFIED: Barrel exports
├── store/
│   ├── api-config.ts         # NEW: ApiConfigStore class (refactor from TemplateStore)
│   ├── template.ts           # PRESERVED: TemplateStore (Phase 15 removes)
│   └── index.ts              # MODIFIED: Barrel exports
├── services/
│   ├── api-service.ts        # NEW: ApiService (refactor from TemplateService)
│   ├── config-service.ts     # MODIFIED: Add applyApiConfig method
│   ├── template-service.ts   # PRESERVED: TemplateService (Phase 15 removes)
│   └── index.ts              # MODIFIED: Barrel exports
├── security/
│   ├── token-check.ts        # PRESERVED: maskToken function (reuse)
│   ├── api-key.ts            # NEW: maskApiKey, applyMaskedApiKey helpers
│   └── index.ts              # MODIFIED: Barrel exports
└── config/
    ├── migration.ts          # PRESERVED: Migration framework (may add v2 migration)
```

### Pattern 1: ApiConfigStore CRUD

**What:** Store class managing global API configurations with CRUD operations
**When to use:** Any persistence operation for ApiConfig
**Example:**
```typescript
// Source: Based on existing TemplateStore pattern [VERIFIED: src/lib/store/template.ts]
import { z } from 'zod';
import { readJSON, writeJSON, exists } from '../file-system/json.js';
import { createBackup } from '../file-system/backup.js';
import { getConfigDir } from '../paths/xdg.js';

// NEW: ApiConfig schema per D-01/D-02/D-03/D-04
export const ApiConfigModeSchema = z.enum(['unified', 'granular']);
export const ApiConfigSchema = z.object({
  name: z.string().min(1, 'Config name required'),
  apiKey: z.string().min(1, 'API key required'),
  baseUrl: z.string().url('Valid URL required'),
  mode: ApiConfigModeSchema,
  modelName: z.string().optional(), // required for unified mode
  env: z.record(z.string(), z.string()).optional(), // required for granular mode
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
}).strict().refine(
  data => data.mode === 'unified' ? data.modelName !== undefined : data.env !== undefined,
  "unified mode requires modelName, granular mode requires env"
);

export class ApiConfigStore {
  private filePath: string;
  private data: ApiConfigStoreData | null = null;

  constructor(customFilePath?: string) {
    // D-07: ~/.claude/api-configs.json (XDG standard)
    this.filePath = customFilePath ?? path.join(getConfigDir(), 'api-configs.json');
  }

  // Same patterns as TemplateStore: lazy loading, validation, backup, timestamps
  async getAll(): Promise<Record<string, ApiConfig>>;
  async get(name: string): Promise<ApiConfig | null>;
  async set(name: string, config: ApiConfig): Promise<void>;
  async delete(name: string): Promise<boolean>;
  async list(): Promise<string[]>;
}
```

### Pattern 2: replaceEnvModel (Precise Field Replacement)

**What:** Replace only env/model fields in ClaudeSettings, preserve all other fields
**When to use:** Applying ApiConfig to project settings (CFG-02)
**Example:**
```typescript
// Source: New pattern per D-12/D-13
import type { ClaudeSettings } from './config.js';
import type { ApiConfig } from './api-config.js';

/**
 * Replace env/model fields in ClaudeSettings.
 * D-13: Complete replacement, not merge (simple and clear).
 * D-14: unified mode generates standard 6-model env + apiKey + baseUrl.
 */
export function replaceEnvModel(
  existing: ClaudeSettings,
  apiConfig: ApiConfig
): ClaudeSettings {
  // Build env from apiConfig
  const newEnv = apiConfig.mode === 'unified'
    ? buildUnifiedEnv(apiConfig)  // D-14: 6 model vars + apiKey + baseUrl
    : apiConfig.env ?? {};         // granular mode: use provided env

  // D-13: Complete replacement - only env/model changed
  return {
    ...existing,
    env: newEnv,
    model: apiConfig.mode === 'unified' ? apiConfig.modelName : undefined,
    // permissions, hooks, mcpServers PRESERVED (CFG-02)
  };
}

/**
 * D-14: Generate standard env object for unified mode.
 */
function buildUnifiedEnv(config: ApiConfig): Record<string, string> {
  return {
    ANTHROPIC_MODEL: config.modelName!,
    ANTHROPIC_DEFAULT_SONNET_MODEL: config.modelName!,
    ANTHROPIC_DEFAULT_HAIKU_MODEL: config.modelName!,
    ANTHROPIC_DEFAULT_OPUS_MODEL: config.modelName!,
    ANTHROPIC_REASONING_MODEL: config.modelName!,
    ANTHROPIC_AUTH_TOKEN: config.apiKey,
    ANTHROPIC_BASE_URL: config.baseUrl,
  };
}
```

### Pattern 3: API Key Security

**What:** Ensure API key never exposed in CLI args, logs, screenshots
**When to use:** All display contexts, logging, error handling
**Example:**
```typescript
// Source: Reuse maskToken pattern [VERIFIED: src/lib/security/token-check.ts]
import { maskToken } from './token-check.js';

/**
 * D-10: Mask API key using existing maskToken (shows last 4 chars).
 */
export function maskApiKey(apiKey: string): string {
  return maskToken(apiKey); // Reuse existing function
}

/**
 * Apply masked apiKey to ApiConfig for display contexts.
 */
export function applyMaskedApiKey(config: ApiConfig): MaskedApiConfig {
  return {
    ...config,
    apiKey: maskApiKey(config.apiKey),
  };
}

/**
 * Service-level enforcement: validate no apiKey in CLI args.
 * D-09: Block apiKey from command-line arguments.
 */
export function validateNoCliApiKey(args: string[]): void {
  const apiKeyPatterns = ['--api-key', '--apiKey', '-k', 'apiKey='];
  for (const arg of args) {
    for (const pattern of apiKeyPatterns) {
      if (arg.includes(pattern)) {
        throw new ServiceError(
          'API key cannot be passed via command-line arguments. Use config file or stdin.',
          'SECURITY_VIOLATION'
        );
      }
    }
  }
}
```

### Anti-Patterns to Avoid

- **Modifying deepMergeConfig:** D-12 explicitly forbids this - create separate replaceEnvModel function
- **Partial env merge:** D-13 requires complete replacement, not partial merge
- **CLI args for apiKey:** D-09 explicitly forbids - use config file or stdin only
- **Exposing apiKey in logs:** Always mask before logging
- **Removing TemplateStore in Phase 10:** D-08 says refactor TemplateStore → ApiConfigStore, but keep TemplateStore for Phase 15 removal

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Atomic write | Custom write-rename | writeJSON from file-system/json.js | R1 pattern proven, crash safety |
| Backup before modification | Custom backup logic | createBackup from file-system/backup.js | R2 pattern proven, timestamped backups |
| API key masking | Custom masking logic | maskToken from security/token-check.ts | D-10 reuse, consistent format |
| Schema validation | Custom validation | Zod schemas | Type inference, strict mode, error collection |
| Config directory paths | Custom path logic | env-paths + getConfigDir | XDG standard, cross-platform |
| Migration framework | Custom migration | migrateConfig pattern | Version-based, sequential migration |

**Key insight:** All v1.0 patterns are reusable. Phase 10 is a refactor, not a rebuild. Preserve existing safety mechanisms (R1/R2).

## Runtime State Inventory

> Phase 10 is a refactor of Services/Types/Store layers - no runtime state changes required.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | templates.json in ~/.config/cc-config-switch/ (v1.0 data) | Migration to api-configs.json (v2.0) - Claude's discretion |
| Live service config | None | — |
| OS-registered state | None | — |
| Secrets/env vars | None — apiKey stored in api-configs.json only | — |
| Build artifacts | None — TypeScript compilation auto-updates | — |

**Migration strategy (Claude's discretion):**
- Option 1: Automatic migration on first v2.0 run (convert templates.json → api-configs.json)
- Option 2: Manual migration script (user explicitly runs migration)
- Option 3: Fresh start (v1.0 templates remain, v2.0 configs new file)

## Common Pitfalls

### Pitfall 1: Confusing replaceEnvModel with deepMergeConfig
**What goes wrong:** Using deepMergeConfig for env replacement merges nested properties, preserving old env values
**Why it happens:** Existing pattern uses deep merge, intuitive to reuse
**How to avoid:** D-12/D-13 explicitly require separate function with complete replacement
**Warning signs:** env field contains merged values from both old config and apiConfig

### Pitfall 2: Exposing apiKey in process arguments
**What goes wrong:** Accepting apiKey via --api-key CLI argument, visible in shell history and process listings
**Why it happens:** Convenient for quick testing, common CLI pattern
**How to avoid:** D-09 explicitly forbids - validate at service boundary, reject CLI args containing apiKey patterns
**Warning signs:** Any command-line argument containing apiKey-related keywords

### Pitfall 3: Missing unified/granular mode validation
**What goes wrong:** unified config without modelName or granular config without env passes validation
**Why it happens:** Optional fields in schema without conditional validation
**How to avoid:** Use Zod .refine() to enforce mode-specific requirements
**Warning signs:** Config stored without required fields for its mode

### Pitfall 4: Forgetting to mask apiKey in error messages
**What goes wrong:** ServiceError includes raw apiKey in context, leaks to logs
**Why it happens:** Error context captures full config for debugging
**How to avoid:** Always mask apiKey before including in error context or logs
**Warning signs:** Error logs showing full apiKey value

### Pitfall 5: Breaking v1.0 safety mechanisms
**What goes wrong:** New code bypasses atomic write or backup patterns
**Why it happens:** Focus on new features, forget existing safety patterns
**How to avoid:** SEC-03 requires maintaining R1/R2 - all writes must use writeJSON + createBackup
**Warning signs:** Direct fs.writeFile calls, missing backup before modification

## Code Examples

Verified patterns from existing codebase:

### Store CRUD Pattern (from TemplateStore)
```typescript
// Source: src/lib/store/template.ts [VERIFIED: lines 83-113]
private async load(): Promise<TemplateStoreData> {
  // Return cached data if available
  if (this.data !== null) {
    return this.data;
  }

  // Load from file or create default
  const raw = await readJSON<TemplateStoreData>(this.filePath);

  if (raw === null) {
    this.data = { version: 1, templates: {} };
    return this.data;
  }

  // Validate loaded data
  const result = TemplateStoreSchema.safeParse(raw);
  if (!result.success) {
    throw new ValidationError(message, result.error.issues);
  }

  this.data = result.data;
  return this.data;
}
```

### Atomic Write Pattern (from writeJSON)
```typescript
// Source: src/lib/file-system/json.ts [VERIFIED: lines 31-68]
export async function writeJSON(filepath: string, data: unknown): Promise<void> {
  const dir = path.dirname(filepath);
  await fs.ensureDir(dir);

  // Generate unique temp file path
  const tempPath = `${filepath}.tmp.${process.pid}`;

  try {
    const content = JSON.stringify(data, null, 2) + '\n';
    await fs.writeFile(tempPath, content, 'utf8');

    // Atomic rename (on POSIX systems)
    await fs.rename(tempPath, filepath);
  } catch (error) {
    // Clean up temp file on any error
    await fs.remove(tempPath);
    throw error;
  }
}
```

### Masking Pattern (from maskToken)
```typescript
// Source: src/lib/security/token-check.ts [VERIFIED: lines 51-56]
export function maskToken(token: string): string {
  if (!token || token.length < 4) {
    return '****';
  }
  return `...${token.slice(-4)}`;
}
```

### ServiceError Pattern
```typescript
// Source: src/lib/services/types.ts [VERIFIED: lines 23-48]
export class ServiceError extends Error {
  public readonly code: string;
  public readonly context?: Record<string, unknown>;

  constructor(message: string, code: string, context?: Record<string, unknown>) {
    super(message);
    this.name = 'ServiceError';
    this.code = code;
    this.context = context;
  }
}
```

## State of the Art

| Old Approach (v1.0) | Current Approach (v2.0) | When Changed | Impact |
|--------------|------------------|--------------|--------|
| TemplateConfig (复杂结构) | ApiConfig (三元组 + mode) | Phase 10 | 简化配置，减少 cognitive load |
| deepMergeConfig (deep merge) | replaceEnvModel (精确替换) | Phase 10 | CFG-02: 保留 permissions/hooks/mcpServers |
| Token in settings.local.json | apiKey in api-configs.json | Phase 10 | 全局配置库，跨项目共享 |
| CLI args 可用 | CLI args 禁用 apiKey | Phase 10 | SEC-01: 安全边界 |

**Deprecated/outdated:**
- TemplateConfig schema: Phase 10 creates ApiConfig, Phase 15 removes TemplateConfig entirely
- TemplateService.applyTemplate: Phase 10 creates ApiService.applyConfig
- CLI args for secrets: Explicitly forbidden per D-09

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | maskToken works for apiKey masking (same format) | Security | Verify apiKey format matches token format |
| A2 | unified env generation (6 model vars) matches Claude Code expectation | Pattern 2 | Test with actual Claude Code settings |
| A3 | Migration from templates.json optional (Claude's discretion) | Runtime State | User may want automatic migration |

**If this table is empty:** All claims in this research were verified or cited.

## Open Questions

1. **Migration strategy for v1.0 templates.json**
   - What we know: v1.0 has templates.json in XDG config dir
   - What's unclear: Should v2.0 auto-migrate or require manual action?
   - Recommendation: Claude's discretion - consider automatic migration with user notification

2. **Unified mode env field count**
   - What we know: D-14 specifies 6 model variables + apiKey + baseUrl
   - What's unclear: Are all 6 model vars required for Claude Code?
   - Recommendation: Verify with Claude Code documentation, may simplify to ANTHROPIC_MODEL only

## Environment Availability

> Phase 10 has no external dependencies beyond existing packages.

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Runtime | ✓ | v25.9.0 | — |
| npm | Package management | ✓ | v11.12.1 | — |
| zod | Validation | ✓ | 4.3.6 (project) | — |
| fs-extra | File operations | ✓ | 11.3.4 (project) | — |
| env-paths | XDG paths | ✓ | 4.0.0 (project) | — |
| vitest | Testing | ✓ | 3.2.4 (project) | — |

**Missing dependencies with no fallback:**
- None

**Missing dependencies with fallback:**
- None

Step 2.6: COMPLETED (all dependencies available)

## Validation Architecture

> nyquist_validation enabled per .planning/config.json (line 19).

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 3.2.4 [VERIFIED: package.json] |
| Config file | vitest.config.ts [VERIFIED: exists] |
| Quick run command | `npm test` (vitest run) |
| Full suite command | `npm run test:coverage` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CFG-01 | Store multiple API configs as 三元组 | unit | `vitest run src/lib/store/api-config.test.ts` | ❌ Wave 0 (NEW) |
| CFG-01 | unified/granular mode validation | unit | `vitest run src/lib/types/api-config.test.ts` | ❌ Wave 0 (NEW) |
| CFG-02 | Precise field replacement preserves permissions/hooks/mcpServers | unit | `vitest run src/lib/types/replacement.test.ts` | ❌ Wave 0 (NEW) |
| CFG-04 | API key masked in display contexts | unit | `vitest run src/lib/security/api-key.test.ts` | ❌ Wave 0 (NEW) |
| SEC-01 | API key never in CLI args | unit | `vitest run src/lib/security/api-key.test.ts` | ❌ Wave 0 (NEW) |
| SEC-03 | Atomic write and backup maintained | unit | `vitest run src/lib/store/api-config.test.ts` | ❌ Wave 0 (NEW) |

### Sampling Rate
- **Per task commit:** `npm test` (vitest run, ~5-15s)
- **Per wave merge:** `npm run test:coverage` (full suite with coverage)
- **Phase gate:** Full suite green + coverage >=80% for new modules

### Wave 0 Gaps
- [ ] `src/lib/store/api-config.test.ts` — ApiConfigStore CRUD tests (covers CFG-01, SEC-03)
- [ ] `src/lib/types/api-config.test.ts` — ApiConfig schema tests, mode validation (covers CFG-01)
- [ ] `src/lib/types/replacement.test.ts` — replaceEnvModel function tests (covers CFG-02)
- [ ] `src/lib/security/api-key.test.ts` — maskApiKey, CLI validation tests (covers CFG-04, SEC-01)
- [ ] `src/lib/services/api-service.test.ts` — ApiService integration tests (covers all)

*(Test infrastructure exists - vitest.config.ts, beforeEach/afterEach patterns in existing tests. Wave 0 creates new test files for new modules.)*

## Security Domain

> Required - security_enforcement implicitly enabled for Phase with SEC requirements.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes | API key as auth token, stored in config file |
| V3 Session Management | no | — |
| V4 Access Control | no | — |
| V5 Input Validation | yes | Zod schema validation for ApiConfig |
| V6 Cryptography | no | — (明文存储 per v1.0 decision, file permissions 600) |

### Known Threat Patterns for TypeScript CLI Config Tools

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| API key in shell history | Information Disclosure | D-09: Block CLI args, use config file/stdin |
| API key in process listing | Information Disclosure | D-09: Block CLI args, env vars hidden |
| API key in crash dumps/logs | Information Disclosure | maskToken for all display contexts |
| Config file read by other users | Information Disclosure | chmod 600, XDG config dir |
| Config file in git repo | Information Disclosure | .gitignore patterns, checkGitTracking |
| Injection via baseUrl | Tampering | Zod url validation, sanitize before use |
| Partial write crash | Tampering | R1: Atomic write-rename pattern |

**Security enforcement:**
- maskToken: Shows last 4 chars only
- writeJSON: Atomic temp file + rename
- createBackup: Timestamped backups before modifications
- chmod 600: Recommended file permissions (existing pattern)

## Sources

### Primary (HIGH confidence)
- [VERIFIED: src/lib/store/template.ts] - TemplateStore class pattern, CRUD operations, lazy loading, validation
- [VERIFIED: src/lib/file-system/json.ts] - writeJSON atomic pattern, readJSON graceful error handling
- [VERIFIED: src/lib/file-system/backup.ts] - createBackup timestamped pattern
- [VERIFIED: src/lib/security/token-check.ts] - maskToken function, last 4 chars display
- [VERIFIED: src/lib/types/config.ts] - ClaudeSettings schema, env/model/mcpServers/permissions/hooks structure
- [VERIFIED: src/lib/services/types.ts] - ServiceError class pattern
- [VERIFIED: .planning/phases/10-config-service/10-CONTEXT.md] - Locked decisions D-01 through D-14

### Secondary (MEDIUM confidence)
- [WebSearch verified] CLI API key security best practices - environment variables, config files, stdin alternatives
- [WebSearch verified] JavaScript object field replacement patterns - spread operator, Object.assign for exact replacement

### Tertiary (LOW confidence)
- [ASSUMED] maskToken format compatible with apiKey (similar token formats expected)
- [ASSUMED] 6 model env vars (ANTHROPIC_MODEL, SONNET, HAIKU, OPUS, REASONING) match Claude Code expectation

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - all libraries verified in package.json, existing patterns documented
- Architecture: HIGH - CONTEXT.md decisions locked, existing code patterns analyzed
- Pitfalls: HIGH - based on explicit D-XX decisions and security requirements

**Research date:** 2026-04-30
**Valid until:** 30 days (stable patterns, well-documented existing codebase)