# Phase 15: Ink Removal - Research

**Researched:** 2026-05-08
**Domain:** Ink/React TUI layer removal, Template-to-ApiConfig migration, chalk-to-picocolors migration
**Confidence:** HIGH

## Summary

Phase 15 removes the dead Ink React TUI layer (38 files in `src/tui/`), migrates all TemplateService/TemplateStore/TemplateConfig references to the already-functional ApiService/ApiConfigStore/ApiConfig equivalents, and replaces all remaining `chalk` imports across the CLI layer with the Phase 14 `src/cli/theme/` picocolors module. The codebase already has a complete, working ApiConfig CRUD chain (`api-config.ts`, `api-service.ts`, `config-service.ts:applyApiConfig()`) that can directly replace the Template* layer. The primary risk is breaking existing tests during the migration, and the fact that `src/cli/prompts/utils/theme.ts` was deleted in Phase 14 but its barrel export and 4 wizard imports still reference it -- causing existing TypeScript compilation errors.

**Primary recommendation:** Execute in 4 waves: (1) fix broken theme.ts imports first (existing build break), (2) delete src/tui/ atomically + remove npm packages, (3) migrate Template* -> ApiConfig across all consumers, (4) replace all chalk imports with theme module across CLI layer.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Strictly execute CFG-06 -- delete TemplateConfig/TemplateService/TemplateStore, migrate entirely to ApiConfig/ApiService/ApiConfigStore
- **D-02:** template command changed to operate on ApiConfig (cc-config template add/list/remove -> cc-config config add/list/remove already exists; template command can be deprecated or redirected)
- **D-03:** export/import functionality adapted to ApiConfig data structure
- **D-04:** 3 wizards (config-wizard, main-wizard, switch-wizard) migrate from TemplateService to ApiService
- **D-05:** ConfigService.applyTemplate() changed to applyApiConfig() (already exists; remove applyTemplate)
- **D-06:** Data migration: templates.json -> api-configs.json, provide one-time migration script or auto-migration on first run
- **D-07:** Delete launchInkTUI() function and `import { runTUI }` statement
- **D-08:** File renamed from tui-launch.ts to cli-launch.ts (no longer TUI concept)
- **D-09:** Retain launchTUI() (delegates to launchPromptsTUI), selectTemplateInTUI() (renamed to selectConfigInCLI), launchScanTUI() as pure CLI helper functions
- **D-10:** Update all files importing tui-launch (cli/index.ts, commands/scan.ts, utils/index.ts)
- **D-11:** Delete 9 npm packages: ink, ink-confirm-input, ink-select-input, ink-spinner, ink-text-input, react, @testing-library/react, @types/react, ink-testing-library
- **D-12:** Retain fuse.js (prompts/autocomplete uses it)
- **D-13:** Prompts layer chalk references migrate to picocolors theme module (src/cli/theme/)
- **D-14:** tui-launch.ts (renamed cli-launch.ts) chalk references also migrate to picocolors theme module
- **D-15:** Delete all src/tui/ 32 test files (~2000+ lines), no retrospective replacement
- **D-16:** Focus on Template* -> ApiConfig migration critical path integration tests
- **D-17:** Ensure existing lib layer and prompts layer tests pass after migration

### Claude's Discretion
- Migration script specific implementation (auto vs manual vs first-run detection)
- template command deprecation strategy (direct delete vs redirect to config command vs keep as alias)
- Function naming in cli-launch.ts
- Specific test case design for migration

### Deferred Ideas (OUT OF SCOPE)
- Fuzzy search improvement (FUZZ-01) -- v3
- template command final disposition (Claude discretion, but redirect to config is reasonable default)
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| TUI-06 | Ink React TUI layer completely removed | Delete src/tui/ (38 files), remove 9 npm packages, remove runTUI import from tui-launch.ts |
| CFG-06 | TemplateConfig/TemplateService/TemplateStore removed and replaced | Migrate to ApiConfig/ApiService/ApiConfigStore; update 7 consumer files + 2 barrel exports + export-schema.ts |
</phase_requirements>

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| TUI layer deletion | Build/Config | -- | Dead code removal, no runtime impact |
| Template* -> ApiConfig migration | API/Backend (lib layer) | CLI (consumer layer) | lib layer owns data types and services; CLI merely consumes |
| Data file migration (templates.json) | Database/Storage | -- | Store layer owns persistence; needs runtime migration logic |
| chalk -> picocolors theme | CLI (presentation) | -- | Presentation concern only, no business logic |
| tui-launch.ts refactoring | CLI (bridge) | -- | Bridge file between CLI entry and prompts layer |
| npm package cleanup | Build/Config | -- | Dependency management, not code logic |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| picocolors | 1.1.1 | ANSI terminal colors | Project decision (Phase 14); zero-dep, fastest, smallest [VERIFIED: npm registry] |
| prompts | 2.4.2 | Terminal-native interactive UI | Project decision (Phase 09); npm-style list selection [VERIFIED: npm registry] |
| fuse.js | ^7.3.0 | Fuzzy search for autocomplete | Used in prompts/utils/autocomplete.ts; retained per D-12 [VERIFIED: package.json] |
| vitest | (existing) | Test framework | Established in v1.0, TDD standard [ASSUMED] |
| zod | (existing) | Schema validation | ApiConfigSchema already validated with strict mode [ASSUMED] |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| fs-extra | (existing) | File system operations | Used in service layer for ensureDir, writeJSON [ASSUMED] |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| picocolors theme module | Direct picocolors imports | Theme module centralizes OpenCode palette + NO_COLOR + detection; direct imports lose this |

**Installation:**
```bash
# No new packages needed -- this phase is purely removal and migration
# Packages to REMOVE:
npm uninstall ink ink-confirm-input ink-select-input ink-spinner ink-text-input react @testing-library/react @types/react ink-testing-library
```

**Version verification:**
```
picocolors: 1.1.1 [VERIFIED: npm registry 2026-05-08]
prompts: 2.4.2 [VERIFIED: npm registry 2026-05-08]
fuse.js: ^7.3.0 [VERIFIED: package.json]
chalk: 5.6.2 (transitive dep -- will be removed after all chalk imports gone) [VERIFIED: node_modules/chalk/package.json]
```

## Architecture Patterns

### System Architecture Diagram

```
                  CLI Entry (cli/index.ts)
                       |
          +------------+------------+
          |                         |
    No-args launch          Commander commands
    launchTUI()             (switch, config, scan,
          |                  export, import, etc.)
    launchPromptsTUI()            |
          |                       |
    +-----+------+          +----+----+
    |            |          |         |
  Wizards    Prompts     Commands  Commands
  (main,    (select,    (switch,  (export,
  switch,   confirm,    config,   import)
  scan,     input)      scan)
  config)
    |            |          |         |
    +-----+------+    +----+----+    |
          |            |              |
    ApiService    ApiConfigStore   ExportService
    (CRUD +       (persistence)    (uses ApiConfigStore
    applyConfig)                    NOT TemplateStore)
          |
    ConfigService.applyApiConfig()
          |
    replaceEnvModel()
          |
    ClaudeSettings (.claude/settings.json)
```

### Recommended Project Structure (After Phase 15)

```
src/
├── cli/
│   ├── commands/          # Commander command handlers (template.ts removed/deprecated)
│   ├── output/            # Error handling, table formatting
│   ├── prompts/           # Terminal-native UI (NO chalk imports -- use theme module)
│   │   ├── components/    # Reusable prompt components
│   │   ├── utils/         # Autocomplete, cancel, format-choices (NO theme.ts)
│   │   └── wizards/       # Multi-step flows (use ApiService, NOT TemplateService)
│   ├── theme/             # picocolors theme module (Phase 14 -- THE source of truth)
│   │   ├── colors.ts      # Color definitions + createColors()
│   │   ├── detection.ts   # Terminal capability detection
│   │   ├── borders.ts     # Border characters
│   │   ├── formatters.ts  # message, hint, error, success, warning, separator, cancel
│   │   └── index.ts       # Barrel export
│   └── utils/
│       └── cli-launch.ts  # Renamed from tui-launch.ts (NO Ink, NO chalk)
├── lib/
│   ├── services/
│   │   ├── api-service.ts       # RETAINED (replacement for template-service.ts)
│   │   ├── template-service.ts  # DELETED
│   │   ├── config-service.ts    # applyTemplate() REMOVED, applyApiConfig() retained
│   │   └── export-service.ts    # TemplateStore dependency -> ApiConfigStore
│   ├── store/
│   │   ├── api-config.ts        # RETAINED (replacement for template.ts)
│   │   └── template.ts          # DELETED
│   └── types/
│       ├── api-config.ts        # RETAINED (ApiConfig, ApiConfigMode, MaskedApiConfig)
│       ├── provider.ts          # TemplateConfigSchema/TemplateStoreSchema REMOVED
│       ├── export-schema.ts     # template field: TemplateConfigSchema.nullable() -> ApiConfigSchema.nullable()
│       └── replacement.ts       # RETAINED (replaceEnvModel for CFG-02)
└── tui/                   # ENTIRE DIRECTORY DELETED (38 files)
```

### Pattern 1: TemplateService -> ApiService Migration Pattern

**What:** Replace all TemplateService/TemplateStore usage with ApiService/ApiConfigStore
**When to use:** Every file that currently imports from TemplateService or TemplateStore
**Example:**
```typescript
// BEFORE (TemplateService pattern):
import { TemplateService } from '../../../lib/services/index.js';
import { TemplateStore, readConfig, writeConfig } from '../../../lib/store/index.js';

const templateStore = new TemplateStore();
const templateService = new TemplateService(templateStore, readConfig, writeConfig);
const templates = await templateService.listTemplates();
await templateService.createTemplate(config.name, {
  name: config.name,
  description: `API config for ${config.name}`,
  provider: { name: config.modelName, baseUrl: config.baseUrl, authType: 'header', env: { ANTHROPIC_API_KEY: config.apiKey } },
});
await templateService.applyTemplate(projectPath, templateName);

// AFTER (ApiService pattern):
import { ApiService } from '../../../lib/services/index.js';
import { ApiConfigStore, readConfig, writeConfig } from '../../../lib/store/index.js';

const apiConfigStore = new ApiConfigStore();
const apiService = new ApiService(apiConfigStore, readConfig, writeConfig);
const configs = await apiService.listConfigs();
await apiService.createConfig(config.name, {
  name: config.name,
  apiKey: config.apiKey,
  baseUrl: config.baseUrl,
  mode: 'unified',
  modelName: config.modelName,
});
await apiService.applyConfig(projectPath, configName);
```

### Pattern 2: chalk -> Theme Module Migration Pattern

**What:** Replace `import chalk from 'chalk'` with theme module formatters
**When to use:** Every file that imports chalk for colored console output
**Example:**
```typescript
// BEFORE:
import chalk from 'chalk';
console.log(chalk.green(`✓ Success`));
console.log(chalk.red(`Error message`));
console.log(chalk.yellow('Warning'));
console.log(chalk.gray('Hint text'));
console.log(chalk.cyan('Section header'));
console.log(chalk.white('Normal text'));
console.log(chalk.bold('Bold text'));

// AFTER:
import { colors, formatters, separator } from '../theme/index.js';
// or for specific functions:
import { success, error, warning, hint, message, separator } from '../theme/index.js';

console.log(formatters.success('Success'));     // or colors.success(`✓ Success`)
console.log(formatters.error('Error message'));  // or colors.danger(`Error message`)
console.log(formatters.warning('Warning'));      // or colors.warning('Warning')
console.log(formatters.hint('Hint text'));       // or colors.muted('Hint text')
console.log(formatters.message('Section header'));// or colors.accent('Section header')
console.log(colors.foreground('Normal text'));    // or just plain text (no color needed)
console.log(colors.bold('Bold text'));
```

### Pattern 3: Data Migration (templates.json -> api-configs.json)

**What:** Convert existing TemplateConfig data to ApiConfig format on first run
**When to use:** User has existing templates.json with data from v1.0
**Example:**
```typescript
// Migration logic (in migration utility or first-run detection):
// templates.json format: { version: 1, templates: { "name": TemplateConfig } }
// api-configs.json format: { version: 1, configs: { "name": ApiConfig } }

// TemplateConfig -> ApiConfig conversion:
function convertTemplateToApiConfig(template: TemplateConfig): ApiConfig {
  return {
    name: template.name,
    apiKey: template.provider.env?.ANTHROPIC_API_KEY ?? '',
    baseUrl: template.provider.baseUrl,
    mode: 'unified',  // Default to unified mode
    modelName: template.provider.name,  // provider.name was model name
    createdAt: template.createdAt,
    updatedAt: template.updatedAt,
  };
}
```

### Anti-Patterns to Avoid

- **Partial Template* removal:** Leaving TemplateConfigSchema in provider.ts while removing TemplateService creates orphans. Must remove ALL Template* artifacts together.
- **chalk direct import after migration:** Importing `picocolors` directly instead of using the theme module bypasses OpenCode palette + NO_COLOR + terminal detection. Always use `src/cli/theme/`.
- **Forgetting export-schema.ts:** The ExportPayloadSchema has a `template: TemplateConfigSchema.nullable()` field that MUST be updated to `config: ApiConfigSchema.nullable()` -- otherwise Zod validation breaks.
- **Breaking data backward compatibility:** Users with templates.json must have a migration path. Deleting the file type without migration logic loses user data.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Terminal color formatting | Custom ANSI escape codes | `src/cli/theme/` module | Phase 14 already handles OpenCode palette, NO_COLOR, detection, Windows CMD compatibility |
| Config application | Custom merge logic in wizards | `ApiService.applyConfig()` / `ConfigService.applyApiConfig()` | These already implement CFG-02 precise field replacement with `replaceEnvModel()` |
| API config CRUD | Reimplementing CRUD in wizard files | `ApiService` + `ApiConfigStore` | Already exist with full CRUD, validation, backup, atomic write |
| Data migration | Complex schema transformation | Simple field mapping `TemplateConfig -> ApiConfig` | The structures are closely related; only field names and nesting differ |

**Key insight:** The ApiConfig layer is already complete and functional. This phase is about **wiring existing consumers to existing providers**, not building new logic.

## Runtime State Inventory

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | `templates.json` in `getConfigDir()` (user data file with TemplateConfig records) | Data migration script: read templates.json, convert each TemplateConfig to ApiConfig, write to api-configs.json, then delete/rename templates.json |
| Live service config | None -- no external services store template strings | None |
| OS-registered state | None -- CLI tool, no OS-level registrations | None |
| Secrets/env vars | `ANTHROPIC_API_KEY` stored in templates.json `provider.env` field | Code edit: ApiConfig stores `apiKey` as top-level field (already in api-configs.json format); migration must extract from `provider.env.ANTHROPIC_API_KEY` |
| Build artifacts | `node_modules/` contains ink, react, and 7 related packages; `dist/` may contain compiled TUI code | `npm uninstall` for packages; `npm run build` after changes to regenerate dist |

**Nothing found in category:**
- Live service config: None -- verified by codebase scan (no external service integration)
- OS-registered state: None -- verified by codebase scan (CLI tool only)

## Common Pitfalls

### Pitfall 1: Broken theme.ts barrel export

**What goes wrong:** Phase 14-04 deleted `src/cli/prompts/utils/theme.ts` but `src/cli/prompts/utils/index.ts` still exports `* from './theme.js'` and 4 wizard files still import `styleSuccess, styleError, styleWarning, separator` from `../utils/theme.js`. This causes TypeScript compilation errors TODAY.
**Why it happens:** The deletion was partial -- theme.ts was removed but consumers were not updated.
**How to avoid:** First task of this phase must fix the broken imports: either (a) update wizard imports to use `../../theme/index.js` formatters, or (b) recreate `src/cli/prompts/utils/theme.ts` as a re-export shim from `../../theme/index.js`. Option (a) is cleaner.
**Warning signs:** `tsc --noEmit` shows `TS2307: Cannot find module './theme.js'` errors.

### Pitfall 2: TemplateConfig -> ApiConfig field mapping errors

**What goes wrong:** TemplateConfig has `provider.name` (which is model name), `provider.baseUrl`, `provider.env.ANTHROPIC_API_KEY`. ApiConfig has `name`, `apiKey`, `baseUrl`, `mode`, `modelName`. Incorrect mapping (e.g., `provider.name` -> `name` instead of `modelName`) silently corrupts data.
**Why it happens:** Both types have a `name` field but they mean different things: TemplateConfig.name = config name, TemplateConfig.provider.name = model name.
**How to avoid:** Use explicit mapping with Zod validation: `TemplateConfig.name -> ApiConfig.name`, `TemplateConfig.provider.name -> ApiConfig.modelName`, `TemplateConfig.provider.baseUrl -> ApiConfig.baseUrl`, `TemplateConfig.provider.env.ANTHROPIC_API_KEY -> ApiConfig.apiKey`.
**Warning signs:** Migration produces configs with `modelName = configName` or `apiKey = ''`.

### Pitfall 3: ExportPayloadSchema still references TemplateConfigSchema

**What goes wrong:** `export-schema.ts` line 78 has `template: TemplateConfigSchema.nullable()`. After removing TemplateConfigSchema, Zod validation at runtime crashes when reading export files.
**Why it happens:** ExportPayloadSchema is defined in a types file, not a service file -- easy to overlook.
**How to avoid:** Change `template: TemplateConfigSchema.nullable()` to `config: ApiConfigSchema.nullable()` and update ExportService to use `apiConfigStore.get()` instead of `templateStore.get()`.
**Warning signs:** Import/export commands crash with Zod validation error.

### Pitfall 4: chalk.level = 0 in launchPromptsTUI()

**What goes wrong:** `main-wizard.ts:launchPromptsTUI()` line 185 sets `chalk.level = 0` for NO_COLOR. After chalk removal, this line breaks.
**Why it happens:** Direct chalk manipulation was the old NO_COLOR pattern before Phase 14 centralized it.
**How to avoid:** Remove the `chalk.level = 0` line entirely; NO_COLOR is now handled by `src/cli/theme/detection.ts`.
**Warning signs:** `chalk is not defined` ReferenceError at runtime.

### Pitfall 5: barrel exports reference deleted modules

**What goes wrong:** `src/lib/services/index.ts` exports `TemplateService` and `type TemplateConfig`. `src/lib/store/index.ts` exports `TemplateStore` and `type TemplateStoreData`. After deleting the source files, barrel exports break.
**Why it happens:** Barrel exports are often forgotten during deletion.
**How to avoid:** Remove Template* exports from both barrel files. Also check `src/lib/types/index.ts` which re-exports from `provider.ts`.
**Warning signs:** `Module not found` errors at build time.

### Pitfall 6: select-template.ts references TemplateInfo interface

**What goes wrong:** `src/cli/prompts/components/select-template.ts` defines a `TemplateInfo` interface with `provider` field. This concept doesn't exist in ApiConfig.
**Why it happens:** The component was designed for the Template* model.
**How to avoid:** Rename/refactor to use ApiConfig-based interface, or simply remove `provider` field from the info type.
**Warning signs:** Type errors when passing ApiConfig data to selectTemplate().

## Code Examples

### ExportService TemplateStore -> ApiConfigStore migration

```typescript
// src/lib/services/export-service.ts BEFORE:
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

// AFTER:
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

### ExportPayloadSchema update

```typescript
// src/lib/types/export-schema.ts BEFORE:
import { TemplateConfigSchema } from './provider.js';
export const ExportPayloadSchema = z.object({
  metadata: ExportMetadataSchema,
  project: ProjectRefSchema,
  settings: ClaudeSettingsSchema,
  template: TemplateConfigSchema.nullable(),
}).strict();

// AFTER:
import { ApiConfigSchema } from './api-config.js';
export const ExportPayloadSchema = z.object({
  metadata: ExportMetadataSchema,
  project: ProjectRefSchema,
  settings: ClaudeSettingsSchema,
  config: ApiConfigSchema.nullable(),  // renamed from 'template'
}).strict();
```

### Theme module usage pattern (for chalk replacement)

```typescript
// Instead of:
import chalk from 'chalk';
console.log(chalk.green(`✓ 配置 "${name}" 已创建`));
console.log(chalk.gray('提示信息'));
console.log(chalk.red('错误信息'));
console.log(chalk.cyan('标题'));
console.log(chalk.yellow('警告'));

// Use:
import { formatters, colors, separator } from '../theme/index.js';
console.log(formatters.success(`配置 "${name}" 已创建`));
console.log(formatters.hint('提示信息'));
console.log(formatters.error('错误信息'));
console.log(formatters.message('标题'));
console.log(formatters.warning('警告'));
console.log(separator(40));
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Ink + React TUI | prompts library | Phase 09 (v2.0) | Ink/React are dead code; can be deleted |
| TemplateConfig (provider-embedded) | ApiConfig (flat structure) | Phase 10 (v2.0) | Template* is redundant; migration path exists |
| chalk (ANSI colors) | picocolors via theme module | Phase 14 (v2.0) | chalk imports are legacy; theme module is source of truth |
| Deep merge (template apply) | replaceEnvModel (precise replacement) | Phase 10 (v2.0) | applyTemplate uses deep merge; applyApiConfig uses precise replacement |
| Manual NO_COLOR in wizards | Centralized in detection.ts | Phase 14-04 (v2.0) | `chalk.level = 0` is dead code |

**Deprecated/outdated:**
- `src/tui/`: Entire directory -- replaced by `src/cli/prompts/` in Phase 09
- `TemplateService.applyTemplate()`: Uses deep merge -- replaced by `ApiService.applyConfig()` with precise replacement
- `ConfigService.applyTemplate()`: Same deep merge -- replaced by `ConfigService.applyApiConfig()`
- `chalk` direct imports: Replaced by `src/cli/theme/` module (Phase 14)
- `src/cli/prompts/utils/theme.ts`: Deleted in Phase 14-04 but imports still broken

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | chalk is only a transitive dependency (not in package.json) | Standard Stack | If chalk is a direct dep, `npm uninstall chalk` needed; low risk since package.json does not list it |
| A2 | vitest is the test framework (inherited from v1.0) | Validation | If changed, test commands would differ; low risk since vitest.config.ts exists |
| A3 | ExportPayload backward compat not required (v1.0 export files) | Architecture | If users have v1.0 export files with `template` field, import would break; medium risk |
| A4 | No runtime systems reference `templates.json` path outside codebase | Runtime State | If external tools read templates.json, they break after migration; low risk (personal tool) |

## Open Questions

1. **Export file backward compatibility**
   - What we know: ExportPayloadSchema currently has `template: TemplateConfigSchema.nullable()`. Changing to `config: ApiConfigSchema.nullable()` breaks reading old export files.
   - What's unclear: Whether any users have exported config files from v1.0 that they need to import.
   - Recommendation: Add a `migrateExportPayload()` function that detects old format (`template` field present) and converts to new format (`config` field). This is low cost and high safety.

2. **template command deprecation strategy (Claude's Discretion)**
   - What we know: `cc-config config add/list/remove` already exists (Phase 11). `cc-config template list/create/delete` is legacy.
   - What's unclear: Whether any users have muscle memory for template commands.
   - Recommendation: Keep `template` as a hidden alias that redirects to `config` with a deprecation notice. Full removal can happen in v3.

3. **Data migration timing**
   - What we know: templates.json may exist on user machines. ApiConfigStore reads from api-configs.json.
   - What's unclear: Best migration strategy (auto-migrate on first run vs manual script vs both).
   - Recommendation: Auto-migrate on first ApiConfigStore load: detect templates.json existence, convert to api-configs.json, rename templates.json to templates.json.bak. This is transparent to users.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Runtime | ✓ | v22+ | -- |
| npm | Package management | ✓ | 10+ | -- |
| vitest | Testing | ✓ | (installed) | -- |
| TypeScript | Compilation | ✓ | (installed) | -- |

**Missing dependencies with no fallback:**
- None

**Missing dependencies with fallback:**
- None

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest |
| Config file | vitest.config.ts |
| Quick run command | `npx vitest run --reporter=verbose 2>&1 \| tail -20` |
| Full suite command | `npx vitest run` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| TUI-06 | No Ink/React imports remain | integration | `grep -r "from 'ink'\|from 'react'" src/` | N/A (grep check) |
| TUI-06 | src/tui/ directory deleted | manual-only | `ls src/tui/` | N/A (directory check) |
| TUI-06 | No React deps in package.json | integration | `cat package.json \| grep react` | N/A (file check) |
| CFG-06 | TemplateService/TemplateStore removed | integration | `grep -r "TemplateService\|TemplateStore" src/` | N/A (grep check) |
| CFG-06 | ApiConfig migration works end-to-end | integration | `npx vitest run src/lib/services/api-service.test.ts` | Wave 0 |
| CFG-06 | Data migration templates->apiConfigs | unit | `npx vitest run src/lib/store/migration.test.ts` | Wave 0 (new) |
| CFG-06 | chalk imports fully replaced | integration | `grep -r "from 'chalk'" src/` | N/A (grep check) |

### Sampling Rate
- **Per task commit:** `npx vitest run --reporter=verbose`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green + grep checks pass (no chalk/ink/react/Template* references)

### Wave 0 Gaps
- [ ] `src/lib/store/migration.test.ts` -- data migration tests (templates.json -> api-configs.json)
- [ ] `src/lib/services/export-service.test.ts` -- update for ApiConfigStore instead of TemplateStore
- [ ] Fix broken `src/cli/prompts/utils/theme.ts` import (theme.ts was deleted but barrel still references it)

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | -- |
| V3 Session Management | no | -- |
| V4 Access Control | no | -- |
| V5 Input Validation | yes | Zod schemas (ApiConfigSchema, ExportPayloadSchema) |
| V6 Cryptography | no | -- |

### Known Threat Patterns for CLI + Migration

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Data corruption during migration | Tampering | Backup templates.json before conversion; validate migrated data with Zod before write |
| ANSI injection via user input | Tampering | stripAnsi() on user input before passing to formatters (T-14-05) |
| API key exposure in migration logs | Information Disclosure | Mask apiKey during migration log output (maskApiKey utility) |

## Sources

### Primary (HIGH confidence)
- Codebase analysis: All files in src/tui/, src/cli/, src/lib/ read directly
- src/lib/types/api-config.ts -- ApiConfig schema verified in codebase
- src/lib/services/api-service.ts -- ApiService verified with full CRUD + applyConfig
- src/lib/store/api-config.ts -- ApiConfigStore verified with CRUD + backup
- src/lib/services/config-service.ts -- applyApiConfig() verified, applyTemplate() identified for removal
- src/cli/theme/ -- picocolors module verified (colors.ts, detection.ts, borders.ts, formatters.ts)
- package.json -- dependency versions verified
- npm registry -- picocolors 1.1.1, prompts 2.4.2 versions confirmed

### Secondary (MEDIUM confidence)
- Context7 /alexeyraspopov/picocolors -- API patterns for pc.createColors(), color functions
- Git history (9a7a357) -- Phase 14-04 deletion of theme.ts confirmed

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - all verified in codebase or npm registry
- Architecture: HIGH - ApiConfig replacement layer fully implemented and tested
- Pitfalls: HIGH - TypeScript compilation errors confirmed (broken theme.ts import), field mapping documented from source code
- Migration: MEDIUM - data migration logic needs design (Claude's discretion), but field mapping is clear

**Research date:** 2026-05-08
**Valid until:** 2026-06-07 (stable domain -- removal/migration, no fast-moving dependencies)
