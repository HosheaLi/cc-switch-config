# Architecture Research: Prompts Integration with Clean Architecture

**Domain:** CLI/TUI Tool Architecture - Prompts Integration
**Researched:** 2026-04-30
**Confidence:** HIGH

## Standard Architecture

### System Overview (Current → Target)

```
┌─────────────────────────────────────────────────────────────┐
│                    CLI Layer (Entry Point)                   │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │ Commands │  │ Prompts  │  │ Utils    │  │ Output   │    │
│  │(Commander│  │ Wizards  │  │(launch)  │  │(chalk)   │    │
│  │   .js)   │  │(prompts) │  │          │  │          │    │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘    │
│       │             │             │             │           │
│       └─────────────┴─────────────┴─────────────┘           │
│                     ↓ (Service Injection)                   │
├─────────────────────────────────────────────────────────────┤
│                   Service Layer (Business Logic)             │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │ApiConfig │  │ Project  │  │  Config  │  │  Undo    │    │
│  │ Service  │  │ Service  │  │ Service  │  │ Service  │    │
│  │  (NEW)   │  │          │  │          │  │          │    │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘    │
│       └─────────────┴─────────────┴─────────────┘           │
│                     ↓ (Store Injection)                     │
├─────────────────────────────────────────────────────────────┤
│                   Store Layer (Persistence)                  │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │ApiConfig │  │ Project  │  │ AppState │  │  Config  │    │
│  │  Store   │  │  Index   │  │          │  │  Files   │    │
│  │  (NEW)   │  │          │  │(extended)│  │          │    │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘    │
└─────────────────────────────────────────────────────────────┘

M4 Boundary: Prompts ONLY in CLI layer, NOT in lib/services
```

### Component Responsibilities

| Component | Responsibility | Implementation |
|-----------|----------------|----------------|
| **CLI Commands** | CLI argument parsing, command routing | Commander.js program with register*Command functions |
| **Prompts Wizards** | Interactive flows, user input collection | prompts library with select/multiselect/autocomplete |
| **CLI Utils** | Launch helpers, shared utilities | promptsLaunch(), selectProject(), selectApiConfig() |
| **ApiConfigService** | API config CRUD, config application | Constructor DI with ApiConfigStore, read/writeConfig |
| **ApiConfigStore** | API config persistence | XDG data storage, CRUD operations, schema validation |
| **AppState (extended)** | Wizard state, first run flag | conf package, firstRunCompleted field |

## Integration Points

### New Components

| Component | Location | Purpose | Dependencies |
|-----------|----------|---------|--------------|
| **src/cli/prompts//** | CLI layer | Prompts-based wizards (M4 safe) | prompts library, kleur for theme |
| **ApiConfigStore** | lib/store/ | Replace TemplateStore, simpler 三元组 | lib/types/api-config.ts |
| **ApiConfigService** | lib/services/ | Replace TemplateService | ApiConfigStore, read/writeConfig |
| **config command** | cli/commands/ | CLI-01: add/list/remove API configs | ApiConfigService |

### Modified Components

| Component | Change | Impact |
|-----------|--------|--------|
| **tui-launch.ts** | Rename → interactive-launch.ts, use prompts | Entry point for no-args CLI |
| **AppState** | Add firstRunCompleted field | ONB-02: first-time wizard detection |
| **services barrel** | Replace TemplateService with ApiConfigService | All imports update |
| **lib/types/** | Remove complex TemplateConfig, add simple ApiConfig | CFG-01: 三元组 simplification |

### Removed Components

| Component | Reason | Migration Path |
|-----------|--------|----------------|
| **src/tui/** (Ink) | TUI-02: Remove React TUI layer | Replace with prompts wizards |
| **TemplateService** | CFG-01: Simplified to ApiConfigService | ApiConfigService.create/update/delete |
| **TemplateStore** | CFG-01: Simplified to ApiConfigStore | ApiConfigStore (三元组 storage) |
| **TemplateConfig type** | CFG-01: Complex config removed | ApiConfig (name + apiKey + baseUrl + modelName) |

## Recommended Project Structure

```
src/
├── cli/                        # CLI Layer (Entry Point)
│   ├── prompts/                # NEW: Prompts-based wizards (M4 safe)
│   │   ├── wizards/            # Multi-step wizard flows
│   │   │   ├── first-run.ts    # ONB-01: First-time onboarding
│   │   │   ├── switch-flow.ts  # Project + API config selection
│   │   │   └── config-wizard.ts # CLI-01: Add/list/remove configs
│   │   ├── components/         # Reusable prompt wrappers
│   │   │   ├── select-project.ts    # Project selection prompt
│   │   │   ├── select-api-config.ts # API config selection prompt
│   │   │   └── confirm-action.ts    # Confirmation prompt
│   │   ├── theme/              # UI-01: OpenCode Terminal Aesthetic
│   │   │   ├── colors.ts       # Warm palette (#201d1d/#fdfcfc)
│   │   │   ├── styles.ts       # Monospace, semantic colors
│   │   │   └── onRender.ts     # kleur styling helpers
│   │   └── index.ts            # Barrel export for prompts
│   ├── commands/               # Commander.js command registrations
│   │   ├── config.ts           # NEW: CLI-01 config command
│   │   ├── switch.ts           # Modified: use prompts wizard
│   │   └── [existing commands] # Other Phase 05/07/08 commands
│   ├── utils/                  # CLI utilities
│   │   ├── interactive-launch.ts # Modified: launch prompts wizards
│   │   ├── [existing utils]    # diff, auto-switch, etc.
│   ├── output/                 # Output formatting
│   │   └── [existing]          # table, error, chalk styling
│   └── index.ts                # CLI entry point
│
├── lib/                        # Library Layer (Business Logic + Data)
│   ├── services/               # Service Layer (Business Logic)
│   │   ├── api-config-service.ts # NEW: Replace TemplateService
│   │   ├── project-service.ts  # Existing: Project management
│   │   ├── config-service.ts   # Existing: Config read/write
│   │   ├── undo-service.ts     # Existing: Undo operations
│   │   ├── [existing]          # provider, export services
│   │   └ index.ts              # Modified: ApiConfigService export
│   │
│   ├── store/                  # Store Layer (Persistence)
│   │   ├── api-config-store.ts # NEW: Replace TemplateStore
│   │   ├── project.ts          # Existing: ProjectIndex
│   │   ├── state.ts            # Modified: AppState + firstRunCompleted
│   │   ├── config.ts           # Existing: Config read/write
│   │   └ index.ts              # Modified: ApiConfigStore export
│   │
│   ├── types/                  # Type definitions
│   │   ├── api-config.ts       # NEW: 三元组 (name + apiKey + baseUrl + modelName)
│   │   ├── [existing]          # config, export-schema, validation
│   │   └ index.ts              # Modified: ApiConfig type export
│   │
│   ├── file-system/            # File utilities
│   │   └── [existing]          # json, backup utilities
│   ├── paths/                  # Path resolution
│   │   └── [existing]          # xdg, claude paths
│   └── index.ts                # Library barrel
│
└── tui/                        # DELETED: Remove Ink React TUI (TUI-02)
    └ [Delete entire folder]
```

### Structure Rationale

- **cli/prompts/:** NEW folder for prompts-based wizards. All UI code in CLI layer (M4 boundary respected)
- **cli/prompts/wizards/:** Multi-step flows for first-run, switch, config management
- **cli/prompts/components/:** Reusable prompt wrappers for consistent UX
- **cli/prompts/theme/:** OpenCode Terminal Aesthetic styling (UI-01/02)
- **lib/services/api-config-service.ts:** NEW service replacing TemplateService (simplified logic)
- **lib/store/api-config-store.ts:** NEW store replacing TemplateStore (三元组 storage)
- **lib/types/api-config.ts:** NEW type for simplified configuration (CFG-01)
- **lib/store/state.ts:** MODIFIED to add firstRunCompleted field (ONB-02)
- **tui/:** DELETE entire Ink React TUI layer (TUI-02)

## Architectural Patterns

### Pattern 1: Constructor Injection (D-01)

**What:** Services receive dependencies via constructor, enabling testability and flexibility.
**When to use:** All service instantiation (existing pattern, maintain for new services).
**Trade-offs:** More verbose than direct imports, but enables mocking in tests.

**Example:**
```typescript
// api-config-service.ts
export class ApiConfigService {
  constructor(
    private apiConfigStore: ApiConfigStore,
    private readConfigFn: (filepath: string) => Promise<ClaudeSettings | null>,
    private writeConfigFn: (filepath: string, config: ClaudeSettings) => Promise<void>
  ) {}

  async applyConfig(projectPath: string, configName: string): Promise<void> {
    const config = await this.apiConfigStore.get(configName);
    if (!config) throw new ServiceError('Config not found', 'CONFIG_NOT_FOUND');
    // ... precise field replacement (CFG-02)
  }
}
```

### Pattern 2: Prompts Wizard Flow

**What:** Multi-step wizard using sequential prompts with state accumulation.
**When to use:** First-time onboarding (ONB-01), switch flow, config management (CLI-01).
**Trade-offs:** More complex than single prompts, but provides guided UX for complex flows.

**Example:**
```typescript
// first-run.ts
export async function runFirstRunWizard(): Promise<FirstRunResult> {
  // Step 1: API Configuration
  const apiConfig = await prompts([
    { type: 'text', name: 'name', message: 'Configuration name:' },
    { type: 'text', name: 'apiKey', message: 'API Key:' },
    { type: 'text', name: 'baseUrl', message: 'Base URL:', initial: 'https://api.anthropic.com' },
    { type: 'text', name: 'modelName', message: 'Model name:', initial: 'claude-3-5-sonnet-20241022' }
  ]);

  // Step 2: Directory Selection
  const scanDirs = await prompts({
    type: 'list',
    name: 'directories',
    message: 'Directories to scan (comma-separated):',
    separator: ','
  });

  // Step 3: Execute Scan
  const scanResults = await projectService.scanProjects(scanDirs.directories);

  // Step 4: Select Projects to Register
  const selectedProjects = await prompts({
    type: 'multiselect',
    name: 'projects',
    message: 'Select projects to register:',
    choices: scanResults.map(r => ({ title: r.path, value: r.path }))
  });

  return { apiConfig, scanDirs, selectedProjects };
}
```

### Pattern 3: Theme Injection via onRender

**What:** Dynamic styling injection using prompts onRender(kleur) callback.
**When to use:** All prompt rendering (UI-01: OpenCode Terminal Aesthetic).
**Trade-offs:** Slightly more complex, but enables consistent branding across all prompts.

**Example:**
```typescript
// theme/onRender.ts
import kleur from 'kleur';

export const openCodeTheme = {
  primary: '#201d1d',  // Warm dark background
  secondary: '#fdfcfc', // Warm light foreground
  accent: '#ff6b6b',   // Apple HIG Red
  success: '#4caf50',  // Apple HIG Green
  warning: '#ff9800',  // Apple HIG Orange
};

export function styleMessage(msg: string, type: 'default' | 'success' | 'warning' = 'default') {
  const k = kleur;
  switch (type) {
    case 'success': return k.green(msg);
    case 'warning': return k.orange(msg);
    default: return k.cyan(msg);
  }
}

// Usage in prompt
{
  type: 'select',
  message: 'Select a project',
  onRender(kleur) {
    this.msg = styleMessage(this.msg, 'default');
  }
}
```

### Pattern 4: Barrel Exports (D-01)

**What:** Single entry point per layer for clean imports and dependency management.
**When to use:** All layers (existing pattern, extend for new components).
**Trade-offs:** Requires maintaining barrel files, but enables clean imports.

**Example:**
```typescript
// cli/prompts/index.ts
export { runFirstRunWizard } from './wizards/first-run.js';
export { runSwitchFlow } from './wizards/switch-flow.js';
export { selectProject } from './components/select-project.js';
export { selectApiConfig } from './components/select-api-config.js';

// Usage in cli/commands/switch.ts
import { runSwitchFlow } from '../prompts/index.js';
```

## Data Flow

### Request Flow (First-Time Wizard)

```
User runs CLI (no args)
    ↓
interactiveLaunch() checks AppState.firstRunCompleted
    ↓ (false)
runFirstRunWizard() [cli/prompts/wizards/first-run.ts]
    ↓
Step 1: prompts (API config input) → ApiConfigStore.set()
    ↓
Step 2: prompts (directory selection) → AppState.set('scanDirectories')
    ↓
Step 3: ProjectService.scanProjects() → ScanResult[]
    ↓
Step 4: prompts (multiselect) → ProjectService.registerProject() for each
    ↓
AppState.set('firstRunCompleted', true)
    ↓
Return to main menu
```

### Request Flow (Switch Wizard)

```
User runs 'cc-config switch' (no arg)
    ↓
switchCommand checks for argument
    ↓ (no arg)
runSwitchFlow() [cli/prompts/wizards/switch-flow.ts]
    ↓
Step 1: selectProject() [cli/prompts/components/select-project.ts]
    ↓
ProjectService.listProjects() → ProjectEntry[]
    ↓
prompts({ type: 'select', choices: projects })
    ↓
Step 2: selectApiConfig() [cli/prompts/components/select-api-config.ts]
    ↓
ApiConfigService.listConfigs() → ApiConfig[]
    ↓
prompts({ type: 'select', choices: configs })
    ↓
Step 3: confirmApply() [cli/prompts/components/confirm-action.ts]
    ↓
prompts({ type: 'confirm', message: 'Apply this config?' })
    ↓
ApiConfigService.applyConfig(projectPath, configName)
    ↓
ConfigService.writeConfig() (precise field replacement CFG-02)
    ↓
UndoService.createBackup()
    ↓
Success message → Return
```

### State Management

```
AppState (conf package)
    ↓ (subscribe via get/set)
┌─────────────────────────────────────────┐
│ AppStateData                             │
├─────────────────────────────────────────┤
│ - activeProjectId: string | null         │
│ - lastUsedConfig: string | null (NEW)    │
│ - firstRunCompleted: boolean (NEW)       │
│ - uiPreferences: { theme, showPreview }  │
│ - recentProjects: string[]               │
│ - scanDirectories: string[]              │
└─────────────────────────────────────────┘
    ↓ (read on launch)
interactiveLaunch() → determines wizard flow
    ↓ (write after wizard)
AppState.set('firstRunCompleted', true)
```

### Key Data Flows

1. **First-time wizard:** User → prompts (4 steps) → ApiConfigStore + ProjectService + AppState → Persist
2. **Switch wizard:** User → prompts (select project → select config → confirm) → ApiConfigService.applyConfig → Config write + Undo backup
3. **Config management:** User → config command (add/list/remove) → ApiConfigService CRUD → ApiConfigStore persistence
4. **Project registration:** Scan → prompts (multiselect) → ProjectService.registerProject() → ProjectIndex persistence

## M4 Boundary Verification

### Boundary Rules (Strict)

| Rule | Verification | Consequence |
|------|--------------|-------------|
| **Prompts ONLY in CLI layer** | Check imports: lib/services must NOT import prompts | If violated: move to cli/prompts/ |
| **Services do NOT import UI libraries** | Check imports: lib/services must NOT import ink, prompts, chalk | If violated: refactor to pure business logic |
| **Stores do NOT import UI libraries** | Check imports: lib/store must NOT import ink, prompts, chalk | If violated: refactor to pure persistence |
| **Wizard flows in CLI layer** | All wizard code in cli/prompts/wizards/ | Enables Clean Architecture separation |

### Verification Example

```typescript
// CORRECT: Service layer (lib/services/api-config-service.ts)
import { ApiConfigStore } from '../store/api-config-store.js';
import { readConfig, writeConfig } from '../store/config.js';
// NO prompts imports here ✓

// CORRECT: CLI layer (cli/prompts/wizards/switch-flow.ts)
import prompts from 'prompts';
import { ApiConfigService } from '../../lib/services/index.js';
// Prompts in CLI layer ✓

// INCORRECT: Would violate M4
// lib/services/api-config-service.ts importing prompts ✗
```

### Component Classification (M4 Compliance)

| Component | Layer | M4 Status | Notes |
|-----------|-------|-----------|-------|
| **cli/prompts/** | CLI | ✓ SAFE | Prompts allowed in CLI layer |
| **cli/commands/** | CLI | ✓ SAFE | Commands can use prompts wizards |
| **lib/services/api-config-service.ts** | Service | ✓ SAFE | Pure business logic, no UI |
| **lib/store/api-config-store.ts** | Store | ✓ SAFE | Pure persistence, no UI |
| **lib/types/api-config.ts** | Types | ✓ SAFE | Type definitions, no code |
| **lib/store/state.ts** | Store | ✓ SAFE | AppState extension, no UI |

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| **1-10 projects** | Current architecture optimal (single prompts wizard, no caching needed) |
| **10-100 projects** | Add in-memory caching for ApiConfigStore, ProjectIndex (lazy load) |
| **100+ projects** | Add pagination for project list prompts, search optimization |

### Scaling Priorities

1. **First bottleneck:** Project list grows > 50 → Add autocomplete prompts with fuzzy search (existing fuzzy search logic migrate to prompts)
2. **Second bottleneck:** Config files grow > 20 → Add config grouping/categories, pagination in prompts

**Note:** CLI/TUI tools rarely need scaling beyond 100s of items. Premature optimization NOT recommended.

## Anti-Patterns

### Anti-Pattern 1: Prompts in Service Layer

**What people do:** Import prompts directly in service files for convenience.
**Why it's wrong:** Violates M4 boundary, mixes UI with business logic, prevents testing without UI.
**Do this instead:** Keep prompts in cli/prompts/, services call services with data, prompts call services.

**Example:**
```typescript
// WRONG: lib/services/api-config-service.ts
import prompts from 'prompts'; // ✗ M4 violation
export class ApiConfigService {
  async promptForConfig() { ... } // ✗ UI in service
}

// RIGHT: cli/prompts/wizards/config-wizard.ts
import prompts from 'prompts'; // ✓ CLI layer
import { ApiConfigService } from '../../lib/services/index.js';

export async function runConfigWizard() {
  const input = await prompts([...]);
  await apiConfigService.createConfig(input);
}
```

### Anti-Pattern 2: Giant Monolithic Wizard

**What people do:** One giant wizard function handling all flows in a single file.
**Why it's wrong:** Hard to test, hard to reuse, hard to maintain, violates single responsibility.
**Do this instead:** Break into components (select-project, select-config, confirm-action) and compose wizards.

**Example:**
```typescript
// WRONG: cli/prompts/wizards/all-in-one.ts
export async function runGiantWizard() {
  // 100+ lines mixing project selection, config selection, scan, register, etc.
}

// RIGHT: cli/prompts/components/select-project.ts + switch-flow.ts
export async function selectProject(projects: ProjectEntry[]) {
  return await prompts({ type: 'select', choices: projects });
}

export async function runSwitchFlow() {
  const project = await selectProject(projects);
  const config = await selectApiConfig(configs);
  await confirmAndApply(project, config);
}
```

### Anti-Pattern 3: Over-Complex Type Definitions

**What people do:** Keep complex nested types (TemplateConfig with provider, tags, timestamps, description).
**Why it's wrong:** CFG-01 goal is simplification, complex types increase maintenance burden, user confusion.
**Do this instead:** Use simple 三元组 (name + apiKey + baseUrl + modelName), remove nested structures.

**Example:**
```typescript
// WRONG: lib/types/provider.ts (keeping complex)
export const TemplateConfigSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  provider: ApiProviderConfigSchema, // nested
  tags: z.array(z.string()).optional(),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
}).strict();

// RIGHT: lib/types/api-config.ts (simple 三元组)
export const ApiConfigSchema = z.object({
  name: z.string().min(1, 'Config name required'),
  apiKey: z.string().min(1, 'API key required'),
  baseUrl: z.string().url('Valid URL required'),
  modelName: z.string().min(1, 'Model name required'),
}).strict();

export type ApiConfig = z.infer<typeof ApiConfigSchema>;
```

## Integration Points

### External Dependencies

| Library | Integration Pattern | Notes |
|---------|---------------------|-------|
| **prompts** | npm install prompts, import in CLI layer | M4: Only import in cli/prompts/ |
| **kleur** | npm install kleur, use in onRender | UI-01: Theme injection for OpenCode aesthetic |
| **Commander.js** | Existing, extend with config command | CLI-01: Add registerConfigCommand |
| **conf** | Existing, extend AppState schema | ONB-02: Add firstRunCompleted field |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| **CLI ↔ Service** | Service injection via constructor | ApiConfigService injected into prompts wizards |
| **Service ↔ Store** | Store injection via constructor | ApiConfigStore injected into ApiConfigService |
| **Service ↔ Config Files** | readConfig/writeConfig functions | CFG-02: Precise field replacement |
| **AppState ↔ Wizard** | AppState.get/set for state checks | firstRunCompleted determines wizard flow |

### Migration Path (Template → ApiConfig)

| Old Component | New Component | Migration Action |
|---------------|---------------|------------------|
| **TemplateStore** | ApiConfigStore | Rename file, simplify schema to 三元组 |
| **TemplateService** | ApiConfigService | Rename file, simplify methods (create/update/delete/list/apply) |
| **TemplateConfig type** | ApiConfig type | Replace in lib/types/, update all imports |
| **template command** | config command | Rename command, adjust to ApiConfigService |
| **src/tui/ screens** | cli/prompts/ wizards | Delete Ink screens, create prompts wizards |

## Sources

- Context7 prompts documentation: /terkelg/prompts (list selection, autocomplete, onRender, onSubmit, onCancel)
- Project architecture: .planning/PROJECT.md (Clean Architecture: CLI → Services → Repositories)
- Current CLI entry: src/cli/index.ts (Commander.js setup)
- Current TUI app: src/tui/app.tsx (Ink React TUI, to be removed)
- Current services: src/lib/services/index.ts (barrel exports)
- Current stores: src/lib/store/ (TemplateStore, ProjectIndex, AppState)
- M4 verification: src/cli/m4-verification.test.ts (boundary tests)

---
*Architecture research for: prompts integration with existing Clean Architecture*
*Researched: 2026-04-30*
*Confidence: HIGH (based on existing architecture analysis and prompts library docs)*