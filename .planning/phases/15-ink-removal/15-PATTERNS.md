# Phase 15: Ink Removal - Pattern Map

**Mapped:** 2026-05-08
**Files analyzed:** 43
**Analogs found:** 41 / 43

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/tui/` (32 files) | DELETE | N/A | N/A | N/A (deletion) |
| `src/lib/services/template-service.ts` | DELETE | N/A | `src/lib/services/api-service.ts` | exact (replacement) |
| `src/lib/services/template-service.test.ts` | DELETE | N/A | N/A | N/A (deletion) |
| `src/lib/store/template.ts` | DELETE | N/A | `src/lib/store/api-config.ts` | exact (replacement) |
| `src/lib/store/template.test.ts` | DELETE | N/A | N/A | N/A (deletion) |
| `src/cli/commands/template.ts` | DELETE/deprecate | N/A | `src/cli/commands/config.ts` | exact (replacement) |
| `src/cli/commands/template.test.ts` | DELETE | N/A | N/A | N/A (deletion) |
| `src/cli/prompts/wizards/main-wizard.ts` | component | request-response | `src/cli/commands/config.ts` | role-match |
| `src/cli/prompts/wizards/config-wizard.ts` | component | request-response | `src/cli/commands/config.ts` | role-match |
| `src/cli/prompts/wizards/switch-wizard.ts` | component | request-response | `src/cli/commands/switch.ts` | exact |
| `src/cli/prompts/wizards/scan-wizard.ts` | component | request-response | `src/cli/commands/scan.ts` | role-match |
| `src/cli/utils/tui-launch.ts` -> `cli-launch.ts` | utility | request-response | `src/cli/commands/switch.ts` | role-match |
| `src/cli/utils/tui-launch.test.ts` | test | N/A | `src/cli/commands/switch.test.ts` | role-match |
| `src/cli/commands/export.ts` | controller | request-response | `src/cli/commands/config.ts` | role-match |
| `src/cli/commands/import.ts` | controller | request-response | `src/cli/commands/config.ts` | role-match |
| `src/cli/commands/scan.ts` | controller | request-response | `src/cli/commands/config.ts` | role-match |
| `src/lib/services/export-service.ts` | service | CRUD | `src/lib/services/api-service.ts` | role-match |
| `src/lib/services/export-service.test.ts` | test | N/A | `src/lib/services/api-service.test.ts` | role-match |
| `src/lib/services/config-service.ts` | service | CRUD | `src/lib/services/api-service.ts` | role-match |
| `src/lib/services/config-service.test.ts` | test | N/A | `src/lib/services/api-service.test.ts` | role-match |
| `src/lib/types/export-schema.ts` | model | N/A | `src/lib/types/api-config.ts` | exact (schema pattern) |
| `src/lib/types/provider.ts` | model | N/A | `src/lib/types/api-config.ts` | exact (schema pattern) |
| `src/lib/types/provider.test.ts` | test | N/A | `src/lib/types/api-config.test.ts` | role-match |
| `src/lib/services/index.ts` | config | N/A | N/A (barrel update) | N/A |
| `src/lib/store/index.ts` | config | N/A | N/A (barrel update) | N/A |
| `src/lib/types/index.ts` | config | N/A | N/A (barrel update) | N/A |
| `src/cli/index.ts` | config | N/A | N/A (import update) | N/A |
| `src/cli/utils/index.ts` | config | N/A | N/A (import update) | N/A |
| `src/cli/prompts/utils/index.ts` | config | N/A | N/A (barrel fix) | N/A |
| `src/cli/prompts/components/select-template.ts` | component | request-response | `src/cli/prompts/components/select-api-config.ts` | exact |
| `src/cli/prompts/components/confirm-action.ts` | component | request-response | `src/cli/output/error.ts` | partial (chalk->theme) |
| `src/cli/prompts/components/select-directory.ts` | component | request-response | `src/cli/output/error.ts` | partial (chalk->theme) |
| `src/cli/prompts/components/input-api-key.ts` | component | request-response | `src/cli/output/error.ts` | partial (chalk->theme) |
| `src/cli/prompts/components/select-api-config.ts` | component | request-response | `src/cli/output/error.ts` | partial (chalk->theme) |
| `src/cli/commands/switch.ts` | controller | request-response | `src/cli/output/error.ts` | partial (chalk->theme) |
| `src/cli/commands/config.ts` | controller | request-response | `src/cli/output/error.ts` | partial (chalk->theme) |
| `src/cli/commands/current.ts` | controller | request-response | `src/cli/output/error.ts` | partial (chalk->theme) |
| `src/cli/commands/list.ts` | controller | request-response | `src/cli/output/error.ts` | partial (chalk->theme) |
| `src/cli/commands/undo.ts` | controller | request-response | `src/cli/output/error.ts` | partial (chalk->theme) |
| `src/lib/store/migration.ts` (NEW) | utility | file-I/O | `src/lib/config/migration.ts` | role-match |
| `src/lib/store/migration.test.ts` (NEW) | test | N/A | `src/lib/store/api-config.test.ts` | role-match |
| `package.json` | config | N/A | N/A (package cleanup) | N/A |

## Pattern Assignments

### Pattern A: TemplateService -> ApiService Migration (4 wizard files + tui-launch.ts)

**Analog:** `src/cli/commands/config.ts` (already uses ApiService/ApiConfigStore pattern)

**Imports pattern** (`src/cli/commands/config.ts` lines 21-28):
```typescript
import { ApiService } from '../../lib/services/api-service.js';
import { ApiConfigStore } from '../../lib/store/api-config.js';
import { readConfig, writeConfig } from '../../lib/store/config.js';
import type { ApiConfig } from '../../lib/types/api-config.js';
```

**Service instantiation pattern** (`src/cli/commands/config.ts` lines 101-102):
```typescript
const apiConfigStore = new ApiConfigStore();
const service = new ApiService(apiConfigStore, readConfig, writeConfig);
```

**CRUD call pattern** (`src/cli/commands/config.ts` lines 117-118):
```typescript
await service.createConfig(result.name, apiConfig);
console.log(chalk.green(`✓ 配置 "${result.name}" 已创建`));
```

**What changes in each wizard:**
- Replace `import { TemplateService }` with `import { ApiService }`
- Replace `import { TemplateStore }` with `import { ApiConfigStore }`
- Replace `new TemplateStore()` with `new ApiConfigStore()`
- Replace `new TemplateService(templateStore, readConfig, writeConfig)` with `new ApiService(apiConfigStore, readConfig, writeConfig)`
- Replace `service.listTemplates()` with `service.listConfigs()`
- Replace `service.createTemplate(name, templateConfig)` with `service.createConfig(name, apiConfig)` (NOTE: ApiConfig structure is different from TemplateConfig)
- Replace `service.applyTemplate(projectPath, templateName)` with `service.applyConfig(projectPath, configName)`
- Replace `service.deleteTemplate(name)` with `service.deleteConfig(name)`
- Replace `service.getTemplate(name)` with `service.getConfig(name)`

**Critical field mapping** (TemplateConfig -> ApiConfig):
```
TemplateConfig.name                    -> ApiConfig.name
TemplateConfig.provider.name           -> ApiConfig.modelName  (NOT ApiConfig.name!)
TemplateConfig.provider.baseUrl        -> ApiConfig.baseUrl
TemplateConfig.provider.env.ANTHROPIC_API_KEY -> ApiConfig.apiKey
(NEW field)                            -> ApiConfig.mode = 'unified'
```

**TemplateConfig creation (BEFORE)** (`src/cli/prompts/wizards/main-wizard.ts` lines 85-96):
```typescript
await templateService.createTemplate(config.name, {
  name: config.name,
  description: `API config for ${config.name}`,
  provider: {
    name: config.modelName,
    baseUrl: config.baseUrl,
    authType: 'header',
    env: { ANTHROPIC_API_KEY: config.apiKey },
  },
});
```

**ApiConfig creation (AFTER)** (per `src/cli/commands/config.ts` lines 109-115):
```typescript
const apiConfig: ApiConfig = {
  name: result.name,
  apiKey: result.apiKey,
  baseUrl: result.baseUrl,
  mode: 'unified',
  modelName: result.modelName,
};
await service.createConfig(result.name, apiConfig);
```

---

### Pattern B: chalk -> Theme Module Migration (20 files)

**Analog:** `src/cli/output/error.ts` (already migrated to theme module in Phase 14)

**Imports pattern** (`src/cli/output/error.ts` line 13):
```typescript
import { colors } from '../theme/index.js';
```

**Or for formatters** (per `src/cli/theme/index.ts`):
```typescript
import { colors, formatters, message, hint, error, success, warning, separator, cancel } from '../theme/index.js';
```

**Usage mapping (chalk -> theme):**

| chalk usage | theme module equivalent |
|-------------|------------------------|
| `chalk.green('text')` | `colors.success('text')` or `formatters.success('text')` (adds ✓ prefix) |
| `chalk.red('text')` | `colors.danger('text')` or `formatters.error('text')` (adds ✗ prefix) |
| `chalk.yellow('text')` | `colors.warning('text')` or `formatters.warning('text')` (adds ⚠ prefix) |
| `chalk.gray('text')` | `colors.muted('text')` or `formatters.hint('text')` (no prefix) |
| `chalk.cyan('text')` | `colors.accent('text')` or `formatters.message('text')` (no prefix) |
| `chalk.white('text')` | Plain text (no color needed) or `colors.foreground('text')` |
| `chalk.bold('text')` | `colors.bold('text')` |
| `chalk.cyan.bold('text')` | `colors.bold(colors.accent('text'))` |
| `chalk.green('✓ text')` | `formatters.success('text')` (✓ is built-in) |
| `chalk.red('✗ text')` | `formatters.error('text')` (✗ is built-in) |
| `chalk.yellow('⚠ text')` | `formatters.warning('text')` (⚠ is built-in) |
| `chalk.gray('─'.repeat(40))` | `separator(40)` |
| `chalk.level = 0` | DELETE (handled by `src/cli/theme/detection.ts`) |

**Error handler pattern** (`src/cli/output/error.ts` lines 41-54):
```typescript
export function handleCLIError(error: unknown, code?: number): void {
  if (error instanceof ServiceError) {
    console.error(colors.danger(`[${error.code}] ${error.message}`));
    const exitCode = code ?? mapErrorToExitCode(error.code);
    process.exit(exitCode);
  } else if (error instanceof Error) {
    console.error(colors.danger(`Error: ${error.message}`));
    process.exit(code ?? ExitCodes.GENERAL_ERROR);
  } else {
    console.error(colors.danger('Unknown error occurred'));
    process.exit(ExitCodes.GENERAL_ERROR);
  }
}
```

---

### Pattern C: ExportService TemplateStore -> ApiConfigStore Migration

**Analog:** `src/lib/services/api-service.ts` (ApiService with ApiConfigStore injection)

**BEFORE** (`src/lib/services/export-service.ts` lines 24-25, 57-61, 95-98):
```typescript
import type { TemplateStore } from '../store/index.js';
import type { ClaudeSettings, TemplateConfig } from '../types/index.js';

constructor(
  private projectIndex: ProjectIndex,
  private templateStore: TemplateStore,
  private configService: ConfigService
) {}

// In exportProject():
let template: TemplateConfig | null = null;
if (project.activeConfig) {
  template = await this.templateStore.get(project.activeConfig);
}
```

**AFTER:**
```typescript
import type { ApiConfigStore } from '../store/index.js';
import type { ClaudeSettings, ApiConfig } from '../types/index.js';

constructor(
  private projectIndex: ProjectIndex,
  private apiConfigStore: ApiConfigStore,
  private configService: ConfigService
) {}

// In exportProject():
let apiConfig: ApiConfig | null = null;
if (project.activeConfig) {
  apiConfig = await this.apiConfigStore.get(project.activeConfig);
}
```

---

### Pattern D: ExportPayloadSchema Migration

**Analog:** `src/lib/types/api-config.ts` (ApiConfigSchema pattern)

**BEFORE** (`src/lib/types/export-schema.ts` lines 16, 74-79):
```typescript
import { TemplateConfigSchema } from './provider.js';

export const ExportPayloadSchema = z.object({
  metadata: ExportMetadataSchema,
  project: ProjectRefSchema,
  settings: ClaudeSettingsSchema,
  template: TemplateConfigSchema.nullable(),
}).strict();
```

**AFTER:**
```typescript
import { ApiConfigSchema } from './api-config.js';

export const ExportPayloadSchema = z.object({
  metadata: ExportMetadataSchema,
  project: ProjectRefSchema,
  settings: ClaudeSettingsSchema,
  config: ApiConfigSchema.nullable(),  // renamed from 'template'
}).strict();
```

**Backward compat note:** Add `migrateExportPayload()` to detect old format (has `template` field) and convert to new format (has `config` field).

---

### Pattern E: ConfigService Template Removal

**Analog:** `src/lib/services/api-service.ts` (applyConfig pattern)

**Methods to REMOVE** (`src/lib/services/config-service.ts`):
- `mergeTemplateWithConfig()` (lines 125-141) -- uses deepMergeConfig, replaced by replaceEnvModel
- `applyTemplate()` (lines 153-157) -- uses mergeTemplateWithConfig, replaced by `applyApiConfig()`

**Methods to KEEP** (`src/lib/services/config-service.ts`):
- `readProjectConfig()` (lines 68-81) -- unchanged
- `writeProjectConfig()` (lines 95-113) -- unchanged
- `applyApiConfig()` (lines 169-178) -- already implemented, this is the replacement

**Also remove imports:**
```typescript
// REMOVE:
import type { TemplateConfig } from '../types/provider.js';
import { deepMergeConfig } from '../types/merge.js';
```

---

### Pattern F: provider.ts Template Type Removal

**Analog:** `src/lib/types/api-config.ts` (ApiConfig schema pattern)

**Items to REMOVE** from `src/lib/types/provider.ts`:
- `TemplateConfigSchema` (lines 71-78)
- `type TemplateConfig` (line 80)
- `TemplateStoreSchema` (lines 95-98)
- `type TemplateStore` (line 100)

**Items to KEEP** in `src/lib/types/provider.ts`:
- `AuthTypeSchema` (line 26)
- `type AuthType` (line 27)
- `ApiProviderConfigSchema` (lines 44-50)
- `type ApiProviderConfig` (line 52)

---

### Pattern G: tui-launch.ts -> cli-launch.ts Rename + Refactor

**Analog:** `src/cli/commands/switch.ts` (already uses ApiService + theme module)

**BEFORE** (`src/cli/utils/tui-launch.ts` lines 13-19):
```typescript
import { runTUI } from '../../tui/index.js';
import { launchPromptsTUI } from '../prompts/index.js';
import { TemplateService, ProjectService } from '../../lib/services/index.js';
import type { ScanResult } from '../../lib/services/index.js';
import { TemplateStore } from '../../lib/store/index.js';
import { readConfig, writeConfig } from '../../lib/store/config.js';
import chalk from 'chalk';
```

**AFTER** (cli-launch.ts):
```typescript
import { launchPromptsTUI } from '../prompts/index.js';
import { ApiService, ProjectService } from '../../lib/services/index.js';
import type { ScanResult } from '../../lib/services/index.js';
import { ApiConfigStore } from '../../lib/store/index.js';
import { readConfig, writeConfig } from '../../lib/store/config.js';
import { colors, formatters } from '../theme/index.js';
```

**Functions to DELETE:**
- `launchInkTUI()` (lines 40-42) -- calls `runTUI()` from deleted `src/tui/`

**Functions to KEEP/RENAME:**
- `launchTUI()` -- keep, already delegates to `launchPromptsTUI()`
- `selectTemplateInTUI()` -- rename to `selectConfigInCLI()`, switch TemplateService -> ApiService
- `launchScanTUI()` -- keep, switch chalk -> theme module

**All importers to update:**
- `src/cli/index.ts` line 10: `from './utils/tui-launch.js'` -> `from './utils/cli-launch.js'`
- `src/cli/commands/scan.ts` line 18: `from '../utils/tui-launch.js'` -> `from '../utils/cli-launch.js'`
- `src/cli/utils/index.ts` line 13: `export * from './tui-launch.js'` -> `export * from './cli-launch.js'`

---

### Pattern H: Data Migration Utility (NEW FILE)

**Analog:** `src/lib/config/migration.ts` (existing migration framework)

**Migration framework pattern** (`src/lib/config/migration.ts` lines 35-45, 56-111):
```typescript
const migrations: MigrationFunction[] = [
  (config: unknown): unknown => {
    const configObj = config as Record<string, unknown>;
    return { ...configObj, version: 1 };
  },
];

export function migrateConfig(config: unknown): unknown {
  if (config === null || config === undefined) return DEFAULT_CONFIG;
  // Apply migrations sequentially...
  let migratedConfig = config as Record<string, unknown>;
  while (currentVersion < CONFIG_VERSION) {
    const migration = migrations[currentVersion];
    migratedConfig = migration(migratedConfig) as Record<string, unknown>;
    currentVersion = getConfigVersion(migratedConfig);
  }
  return migratedConfig;
}
```

**Data migration approach** (for `src/lib/store/migration.ts`):
- Read `templates.json` via `readJSON()`
- Convert each `TemplateConfig` to `ApiConfig` using field mapping
- Write to `api-configs.json` via `writeJSON()` (atomic)
- Backup `templates.json` to `templates.json.bak`
- Validate converted data with `ApiConfigStoreSchema`

**Store pattern** (`src/lib/store/api-config.ts` lines 19-23, 96-126):
```typescript
import { readJSON, writeJSON, exists } from '../file-system/json.js';
import { createBackup } from '../file-system/backup.js';
import { getConfigDir } from '../paths/xdg.js';
import { ApiConfigSchema } from '../types/api-config.js';
import { ValidationError } from '../types/validation.js';
```

---

### Pattern I: Broken theme.ts Import Fix (Wave 0 - FIRST)

**Analog:** `src/cli/theme/index.ts` (theme module barrel)

**PROBLEM:** `src/cli/prompts/utils/index.ts` line 8 exports from deleted file:
```typescript
export * from './theme.js';  // FILE DOES NOT EXIST
```

**Files importing from broken path:**
- `src/cli/prompts/wizards/main-wizard.ts` line 17: `import { styleSuccess, styleError, styleWarning, separator } from '../utils/theme.js';`
- `src/cli/prompts/wizards/config-wizard.ts` line 13: `import { styleSuccess, styleError, styleWarning, separator } from '../utils/theme.js';`
- `src/cli/prompts/wizards/switch-wizard.ts` line 14: `import { styleSuccess, styleError, styleWarning } from '../utils/theme.js';`
- `src/cli/prompts/wizards/scan-wizard.ts` line 15: `import { styleSuccess, styleError, styleWarning, separator } from '../utils/theme.js';`

**Function mapping (old theme.ts -> new theme module):**

| Old function | New equivalent |
|-------------|----------------|
| `styleSuccess(text)` | `formatters.success(text)` or `success(text)` |
| `styleError(text)` | `formatters.error(text)` or `error(text)` |
| `styleWarning(text)` | `formatters.warning(text)` or `warning(text)` |
| `separator(width)` | `separator(width)` (same name, from theme module) |

**FIX for each wizard file:**
```typescript
// BEFORE:
import { styleSuccess, styleError, styleWarning, separator } from '../utils/theme.js';

// AFTER:
import { success as styleSuccess, error as styleError, warning as styleWarning, separator } from '../../theme/index.js';
```
Or simply:
```typescript
import { formatters, separator } from '../../theme/index.js';
// Then use formatters.success(), formatters.error(), formatters.warning()
```

**FIX for barrel export** (`src/cli/prompts/utils/index.ts`):
```typescript
// REMOVE line 8:
// export * from './theme.js';
```

---

### Pattern J: select-template.ts Adaptation

**Analog:** `src/cli/prompts/components/select-api-config.ts` (already uses ApiConfig concept)

**TemplateInfo interface** (`src/cli/prompts/components/select-template.ts` lines 17-21):
```typescript
interface TemplateInfo {
  name: string;
  description?: string;
  provider?: string;  // This field doesn't exist in ApiConfig
}
```

**Change:** Remove `provider` field from TemplateInfo (or rename to `modelName`), update `selectTemplateWithPreview()` which references `t.provider`.

**chalk migration** (`src/cli/prompts/components/select-template.ts` line 12):
```typescript
// BEFORE:
import chalk from 'chalk';
// AFTER:
import { colors, formatters } from '../../theme/index.js';
```

---

### Pattern K: Barrel Export Updates

**`src/lib/services/index.ts`** - REMOVE:
```typescript
// Line 19: REMOVE
export { TemplateService } from './template-service.js';
// Line 39: REMOVE
export type { TemplateConfig } from '../types/provider.js';
```

**`src/lib/store/index.ts`** - REMOVE:
```typescript
// Lines 18-19: REMOVE
export { TemplateStore } from './template.js';
export type { TemplateStoreData } from './template.js';
```

**`src/lib/types/index.ts`** - KEEP `export * from './provider.js'` (still has AuthType, ApiProviderConfig)
  - But `provider.ts` will no longer export TemplateConfigSchema/TemplateStoreSchema after cleanup

---

### Pattern L: package.json Cleanup

**REMOVE from dependencies:**
- `ink`: 7.0.0
- `ink-confirm-input`: ^2.0.0
- `ink-select-input`: ^6.2.0
- `ink-spinner`: ^5.0.0
- `ink-text-input`: ^6.0.0
- `react`: 19.2.5

**REMOVE from devDependencies:**
- `@testing-library/react`: ^16.3.2
- `@types/react`: 19.2.0
- `ink-testing-library`: ^4.0.0

**KEEP:**
- `fuse.js`: ^7.3.0 (used by prompts/autocomplete)
- `picocolors`: ^1.1.1 (theme module)
- `chalk`: NOT in package.json (transitive only, will be removed when no more imports)

---

## Shared Patterns

### 1. ApiService Instantiation (Constructor DI)
**Source:** `src/cli/commands/config.ts` lines 101-102
**Apply to:** All wizard files, export/import commands, cli-launch.ts
```typescript
const apiConfigStore = new ApiConfigStore();
const service = new ApiService(apiConfigStore, readConfig, writeConfig);
```

### 2. chalk -> Theme Module Replacement
**Source:** `src/cli/output/error.ts` line 13
**Apply to:** All 20 files that import chalk
```typescript
import { colors, formatters, separator } from '../theme/index.js';
// Use colors.success(), colors.danger(), colors.warning(), colors.muted(), colors.accent()
// Use formatters.success(), formatters.error(), formatters.warning(), formatters.hint(), formatters.message()
// Use separator(40) for horizontal lines
```

### 3. Error Handling (ServiceError)
**Source:** `src/lib/services/types.ts` lines 23-48
**Apply to:** All service and controller files
```typescript
throw new ServiceError(message, code, context?);
// In CLI: handleCLIError(error) from src/cli/output/error.js
```

### 4. Zod Schema + Strict Mode
**Source:** `src/lib/types/api-config.ts` lines 52-64
**Apply to:** export-schema.ts, migration utility
```typescript
const schema = z.object({ ... }).strict().refine(predicate, message);
const result = schema.safeParse(data);
if (!result.success) { throw new ValidationError(message, result.error.issues); }
```

### 5. Store Pattern (Lazy Load + Backup + Atomic Write)
**Source:** `src/lib/store/api-config.ts` lines 96-140
**Apply to:** migration utility (must use same readJSON/writeJSON/backup patterns)
```typescript
import { readJSON, writeJSON, exists } from '../file-system/json.js';
import { createBackup } from '../file-system/backup.js';
```

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `src/lib/store/migration.ts` (NEW) | utility | file-I/O | No existing Template->ApiConfig data migration utility; closest analog is `src/lib/config/migration.ts` which handles schema versioning, not data format conversion |
| `src/lib/store/migration.test.ts` (NEW) | test | N/A | No existing migration test for this type; use `src/lib/store/api-config.test.ts` as structural analog |

## Metadata

**Analog search scope:** src/cli/, src/lib/, package.json
**Files scanned:** 43
**Pattern extraction date:** 2026-05-08
