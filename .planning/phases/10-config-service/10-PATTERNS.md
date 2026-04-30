# Phase 10: Config Service - Pattern Map

**Mapped:** 2026-04-30
**Files analyzed:** 17 files (11 new, 6 modified)
**Analogs found:** 17 / 17

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/lib/types/api-config.ts` | model | config validation | `src/lib/types/provider.ts` | exact |
| `src/lib/types/replacement.ts` | utility | transform | `src/lib/types/merge.ts` | role-match (simpler pattern) |
| `src/lib/store/api-config.ts` | store | CRUD | `src/lib/store/template.ts` | exact |
| `src/lib/services/api-service.ts` | service | CRUD | `src/lib/services/template-service.ts` | exact |
| `src/lib/security/api-key.ts` | utility | validation | `src/lib/security/token-check.ts` | exact |
| `src/lib/security/index.ts` | config | barrel | `src/lib/types/index.ts` | exact |
| `src/lib/store/api-config.test.ts` | test | CRUD | `src/lib/store/template.test.ts` | exact |
| `src/lib/types/api-config.test.ts` | test | validation | `src/lib/types/provider.test.ts` | exact |
| `src/lib/types/replacement.test.ts` | test | transform | `src/lib/types/merge.test.ts` | role-match |
| `src/lib/security/api-key.test.ts` | test | validation | `src/lib/security/token-check.test.ts` | exact |
| `src/lib/services/api-service.test.ts` | test | CRUD | `src/lib/services/template-service.test.ts` | exact |
| `src/lib/types/provider.ts` (modified) | model | config | preserve | — |
| `src/lib/types/index.ts` (modified) | config | barrel | preserve | — |
| `src/lib/store/index.ts` (modified) | config | barrel | preserve | — |
| `src/lib/services/index.ts` (modified) | config | barrel | preserve | — |
| `src/lib/services/config-service.ts` (modified) | service | CRUD | preserve | — |

## Pattern Assignments

### `src/lib/types/api-config.ts` (model, config validation)

**Analog:** `src/lib/types/provider.ts`

**Imports pattern** (lines 1-27):
```typescript
import { z } from 'zod';

/**
 * Authentication type for API providers.
 */
export const AuthTypeSchema = z.enum(['token', 'header', 'custom']);
export type AuthType = z.infer<typeof AuthTypeSchema>;
```

**Zod schema pattern** (lines 44-52):
```typescript
export const ApiProviderConfigSchema = z.object({
  name: z.string().min(1, 'Provider name required'),
  baseUrl: z.string().url('Valid URL required'),
  authType: AuthTypeSchema,
  headers: z.record(z.string(), z.string()).optional(),
  env: z.record(z.string(), z.string()).optional(),
}).strict();
```

**Type inference pattern** (line 52):
```typescript
export type ApiProviderConfig = z.infer<typeof ApiProviderConfigSchema>;
```

**Conditional validation with .refine()** (lines 293-296 in RESEARCH.md):
```typescript
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
```

---

### `src/lib/types/replacement.ts` (utility, transform)

**Analog:** `src/lib/types/merge.ts` (different algorithm - simpler replacement)

**Imports pattern** (lines 1-16 in merge.ts):
```typescript
import type { ClaudeSettings } from './config.js';
```

**Function pattern - simpler than deepMergeConfig** (from RESEARCH.md lines 331-363):
```typescript
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

**Key difference from deepMergeConfig:** Spread operator for complete field replacement, NOT recursive deep merge.

---

### `src/lib/store/api-config.ts` (store, CRUD)

**Analog:** `src/lib/store/template.ts`

**Imports pattern** (lines 1-23):
```typescript
import path from 'path';
import { z } from 'zod';
import { readJSON, writeJSON, exists } from '../file-system/json.js';
import { createBackup } from '../file-system/backup.js';
import { getConfigDir } from '../paths/xdg.js';
import { TemplateConfigSchema, TemplateStoreSchema } from '../types/provider.js';
import type { TemplateConfig, TemplateStore as TemplateStoreType } from '../types/provider.js';
import { ValidationError } from '../types/validation.js';
```

**Class structure pattern** (lines 50-72):
```typescript
export class TemplateStore {
  private filePath: string;
  private data: TemplateStoreData | null = null;

  constructor(customFilePath?: string) {
    this.filePath = customFilePath ?? path.join(getConfigDir(), 'templates.json');
  }
}
```

**Lazy loading pattern** (lines 83-113):
```typescript
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

**Atomic save pattern** (lines 124-127):
```typescript
private async save(data: TemplateStoreData): Promise<void> {
  await writeJSON(this.filePath, data);
  this.data = data; // Update cache
}
```

**CRUD operations pattern** (lines 134-247):
```typescript
async getAll(): Promise<Record<string, TemplateConfig>> {
  const data = await this.load();
  return data.templates;
}

async get(name: string): Promise<TemplateConfig | null> {
  const templates = await this.getAll();
  return templates[name] ?? null;
}

async set(name: string, template: TemplateConfig): Promise<void> {
  // Validate template
  const result = TemplateConfigSchema.safeParse(template);
  if (!result.success) {
    throw new ValidationError(message, issues);
  }

  const validatedTemplate = result.data;
  const data = await this.load();
  const isUpdate = data.templates[name] !== undefined;

  // Create backup before modification (only if file exists)
  const fileExists = await exists(this.filePath);
  if (fileExists) {
    await createBackup(this.filePath);
  }

  // Manage timestamps
  const now = new Date().toISOString();
  if (isUpdate) {
    validatedTemplate.createdAt = data.templates[name]?.createdAt ?? now;
    validatedTemplate.updatedAt = now;
  } else {
    validatedTemplate.createdAt = now;
    validatedTemplate.updatedAt = now;
  }

  data.templates[name] = validatedTemplate;
  await this.save(data);
}

async delete(name: string): Promise<boolean> {
  const data = await this.load();
  if (data.templates[name] === undefined) {
    return false;
  }

  const fileExists = await exists(this.filePath);
  if (fileExists) {
    await createBackup(this.filePath);
  }

  delete data.templates[name];
  await this.save(data);
  return true;
}

async list(): Promise<string[]> {
  const templates = await this.getAll();
  return Object.keys(templates);
}
```

---

### `src/lib/services/api-service.ts` (service, CRUD)

**Analog:** `src/lib/services/template-service.ts`

**Imports pattern** (lines 1-22):
```typescript
import path from 'path';
import fs from 'fs-extra';
import type { TemplateConfig } from '../types/provider.js';
import type { ClaudeSettings } from '../types/config.js';
import { deepMergeConfig } from '../types/merge.js';
import { ServiceError } from './types.js';
import type { TemplateStore } from '../store/template.js';
import { getProjectConfigPath } from '../paths/claude.js';
```

**Class with constructor injection pattern** (lines 42-54):
```typescript
export class TemplateService {
  constructor(
    private templateStore: TemplateStore,
    private readConfigFn: (filepath: string) => Promise<ClaudeSettings | null>,
    private writeConfigFn: (filepath: string, config: ClaudeSettings) => Promise<void>
  ) {}
}
```

**CRUD methods pattern** (lines 66-166):
```typescript
async createTemplate(name: string, config: TemplateConfig): Promise<void> {
  const existing = await this.templateStore.get(name);
  if (existing) {
    throw new ServiceError(
      `Template "${name}" already exists`,
      'TEMPLATE_ALREADY_EXISTS'
    );
  }

  try {
    await this.templateStore.set(name, config);
  } catch (error) {
    if (error instanceof Error) {
      throw new ServiceError(
        `Failed to create template "${name}": ${error.message}`,
        'TEMPLATE_CREATE_FAILED'
      );
    }
    throw error;
  }
}

async getTemplate(name: string): Promise<TemplateConfig | null> {
  return this.templateStore.get(name);
}

async updateTemplate(name: string, config: TemplateConfig): Promise<void> {
  const existing = await this.templateStore.get(name);
  if (!existing) {
    throw new ServiceError(
      `Template "${name}" not found`,
      'TEMPLATE_NOT_FOUND'
    );
  }

  try {
    await this.templateStore.set(name, config);
  } catch (error) {
    if (error instanceof Error) {
      throw new ServiceError(
        `Failed to update template "${name}": ${error.message}`,
        'TEMPLATE_UPDATE_FAILED'
      );
    }
    throw error;
  }
}

async deleteTemplate(name: string): Promise<boolean> {
  const result = await this.templateStore.delete(name);
  if (!result) {
    throw new ServiceError(
      `Template "${name}" not found`,
      'TEMPLATE_NOT_FOUND'
    );
  }
  return result;
}

async listTemplates(): Promise<string[]> {
  return this.templateStore.list();
}

async getAllTemplates(): Promise<Record<string, TemplateConfig>> {
  return this.templateStore.getAll();
}
```

**Apply template pattern** (lines 186-224):
```typescript
async applyTemplate(projectPath: string, templateName: string): Promise<void> {
  const template = await this.templateStore.get(templateName);
  if (!template) {
    throw new ServiceError(
      `Template "${templateName}" not found`,
      'TEMPLATE_NOT_FOUND'
    );
  }

  const configPath = getProjectConfigPath(projectPath);
  await fs.ensureDir(path.dirname(configPath));

  const existing = await this.readConfigFn(configPath) ?? {};

  // Convert template to settings, then merge
  const templateSettings: Partial<ClaudeSettings> = {
    env: template.provider.env,
  };

  const merged = deepMergeConfig(existing, templateSettings);

  try {
    await this.writeConfigFn(configPath, merged);
  } catch (error) {
    if (error instanceof Error) {
      throw new ServiceError(
        `Failed to apply template "${templateName}" to ${projectPath}: ${error.message}`,
        'TEMPLATE_APPLY_FAILED'
      );
    }
    throw error;
  }
}
```

---

### `src/lib/security/api-key.ts` (utility, validation)

**Analog:** `src/lib/security/token-check.ts`

**Imports pattern** (lines 1-14):
```typescript
import fs from 'fs-extra';
import path from 'path';
```

**Masking function pattern** (lines 51-56):
```typescript
export function maskToken(token: string): string {
  if (!token || token.length < 4) {
    return '****';
  }
  return `...${token.slice(-4)}`;
}
```

**New security functions** (from RESEARCH.md lines 376-408):
```typescript
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

---

### `src/lib/security/index.ts` (config, barrel)

**Analog:** `src/lib/types/index.ts` (NEW FILE - security module doesn't have index.ts yet)

**Barrel export pattern** (lines 11-26 in types/index.ts):
```typescript
/**
 * Types Module - Barrel Export
 *
 * Central export point for all type definitions.
 */

// Core config schemas and types
export * from './config.js';

// Validation utilities
export * from './validation.js';

// Merge algorithms
export * from './merge.js';

// Provider and template types
export * from './provider.js';

// Export/import schemas
export * from './export-schema.js';
```

**Pattern for security barrel export**:
```typescript
/**
 * Security Module - Barrel Export
 *
 * Central export point for all security utilities.
 */

// Token security checks
export * from './token-check.js';

// API key security
export * from './api-key.js';
```

---

### Test Files Patterns

### `src/lib/store/api-config.test.ts` (test, CRUD)

**Analog:** `src/lib/store/template.test.ts`

**Test imports pattern** (lines 1-14):
```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { TemplateStore } from './template.js';
import type { TemplateConfig } from '../types/provider.js';
import { ValidationError } from '../types/validation.js';
```

**Test structure pattern** (lines 16-48):
```typescript
describe('TemplateStore', () => {
  let tempDir: string;
  let templatesFile: string;
  let store: TemplateStore;

  // Helper to create valid template config
  const createValidTemplate = (name: string): TemplateConfig => ({
    name,
    description: `Test template for ${name}`,
    provider: {
      name: 'Test Provider',
      baseUrl: 'https://api.test.com',
      authType: 'token',
      headers: { 'X-Custom': 'value' },
      env: { API_KEY: 'test-key' },
    },
    tags: ['test', 'unit'],
  });

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'template-store-test-'));
    templatesFile = path.join(tempDir, 'templates.json');
    store = new TemplateStore(templatesFile);
  });

  afterEach(async () => {
    await fs.remove(tempDir);
  });

  describe('getAll', () => {
    it('should return empty object for new store', async () => {
      const templates = await store.getAll();
      expect(templates).toEqual({});
    });
  });
});
```

---

### `src/lib/types/api-config.test.ts` (test, validation)

**Analog:** `src/lib/types/provider.test.ts`

**Schema test pattern** (lines 1-60):
```typescript
import { describe, it, expect } from 'vitest';
import {
  AuthTypeSchema,
  ApiProviderConfigSchema,
  TemplateConfigSchema,
  TemplateStoreSchema,
} from './provider.js';

describe('AuthTypeSchema', () => {
  describe('valid auth types', () => {
    it('accepts "token" auth type', () => {
      expect(AuthTypeSchema.parse('token')).toBe('token');
    });
  });

  describe('invalid auth types', () => {
    it('rejects "oauth" auth type', () => {
      const result = AuthTypeSchema.safeParse('oauth');
      expect(result.success).toBe(false);
    });
  });
});

describe('ApiProviderConfigSchema', () => {
  describe('valid provider configs', () => {
    it('accepts minimal provider config with required fields', () => {
      const config = {
        name: 'OpenRouter',
        baseUrl: 'https://openrouter.ai/api/v1',
        authType: 'header',
      };
      const result = ApiProviderConfigSchema.safeParse(config);
      expect(result.success).toBe(true);
    });
  });
});
```

---

### `src/lib/services/api-service.test.ts` (test, CRUD)

**Analog:** `src/lib/services/config-service.test.ts`

**Service test pattern** (lines 1-38):
```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { ConfigService } from './config-service.js';
import { readConfig, writeConfig } from '../store/config.js';
import { ServiceError } from './types.js';
import type { ClaudeSettings } from '../types/config.js';
import type { TemplateConfig } from '../types/provider.js';

describe('ConfigService', () => {
  let tempDir: string;
  let configPath: string;
  let service: ConfigService;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'config-service-test-'));
    configPath = path.join(tempDir, '.claude', 'settings.json');
    await fs.ensureDir(path.dirname(configPath));

    // Per D-01: Constructor injection with actual readConfig/writeConfig
    service = new ConfigService(readConfig, writeConfig);
  });

  afterEach(async () => {
    await fs.remove(tempDir);
  });

  describe('readProjectConfig', () => {
    it('should return config from valid path', async () => {
      const config: ClaudeSettings = {
        version: 1,
        model: 'claude-3-5-sonnet-20241022',
      };
      await writeConfig(configPath, config);

      const result = await service.readProjectConfig(tempDir);
      expect(result?.model).toBe('claude-3-5-sonnet-20241022');
    });
  });
});
```

---

## Shared Patterns

### Atomic Write Safety (R1)

**Source:** `src/lib/file-system/json.ts` (lines 31-69)
**Apply to:** All Store set/delete operations

```typescript
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

### Timestamped Backup (R2)

**Source:** `src/lib/file-system/backup.ts` (lines 28-52)
**Apply to:** All Store set/delete operations before modification

```typescript
export async function createBackup(filepath: string): Promise<string | null> {
  const fileExists = await exists(filepath);
  if (!fileExists) {
    return null;
  }

  const dir = path.dirname(filepath);
  const backupDir = path.join(dir, '.backups');
  await fs.ensureDir(backupDir);

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const basename = path.basename(filepath);
  const backupFilename = `${basename}.${timestamp}`;
  const backupPath = path.join(backupDir, backupFilename);

  await fs.copy(filepath, backupPath);

  return backupPath;
}
```

### Zod Validation Pattern

**Source:** `src/lib/types/provider.ts`
**Apply to:** All new type files (api-config.ts)

```typescript
// 1. Define schema with strict mode
export const Schema = z.object({
  field: z.string().min(1),
}).strict();

// 2. Infer TypeScript type
export type Type = z.infer<typeof Schema>;

// 3. Use .refine() for conditional validation
export const SchemaWithRefine = z.object({...}).refine(
  data => condition,
  "error message"
);
```

### ServiceError Pattern

**Source:** `src/lib/services/types.ts` (lines 23-48)
**Apply to:** All service methods on failure

```typescript
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

### Constructor Injection Pattern

**Source:** `src/lib/services/template-service.ts`, `src/lib/services/config-service.ts`
**Apply to:** All new service classes

```typescript
export class Service {
  constructor(
    private store: Store,
    private readFn: (path: string) => Promise<Data | null>,
    private writeFn: (path: string, data: Data) => Promise<void>
  ) {}
}
```

### Barrel Export Pattern

**Source:** `src/lib/types/index.ts`, `src/lib/store/index.ts`, `src/lib/services/index.ts`
**Apply to:** All new module index files (security/index.ts) and modified index files

```typescript
/**
 * Module - Barrel Export
 */

// Export all from submodules
export * from './module.js';

// Export types explicitly if needed
export type { Type } from './module.js';
```

---

## No Analog Found

None - all files have clear analogs in the existing codebase.

---

## Metadata

**Analog search scope:** src/lib/types, src/lib/store, src/lib/services, src/lib/security, src/lib/file-system
**Files scanned:** 20+ TypeScript files (types, stores, services, security, tests)
**Pattern extraction date:** 2026-04-30

**Key insights:**
- All new files follow established v1.0 patterns
- ApiConfigStore is direct refactor of TemplateStore (same CRUD, backup, validation patterns)
- ApiService is direct refactor of TemplateService (same service patterns)
- replaceEnvModel is NEW pattern (simpler than deepMergeConfig - spread operator for exact replacement)
- maskApiKey reuses maskToken (D-10 explicit reuse)
- Atomic write and backup patterns MUST be preserved (SEC-03 requirement)
- security/index.ts is NEW file (security module didn't have barrel export before)