# Architecture Research

**Domain:** CLI/TUI Configuration Management Tools
**Researched:** 2026-04-13
**Confidence:** HIGH

## Standard Architecture

### System Overview

CLI/TUI configuration management tools follow a **layered architecture** with clear separation between interface, business logic, and data persistence.

```
+------------------------------------------------------------------+
|                        Presentation Layer                          |
|  +----------------+  +----------------+  +------------------+     |
|  |  CLI Interface |  |  TUI Components|  |  Interactive UI   |     |
|  |  (commander)   |  |  (ink/React)   |  |  (prompts, forms)|     |
|  +-------+--------+  +-------+--------+  +--------+---------+     |
|          |                  |                    |                |
+----------|------------------|--------------------|----------------+
           |                  |                    |
           v                  v                    v
+------------------------------------------------------------------+
|                        Application Layer                          |
|  +----------------+  +----------------+  +------------------+     |
|  | State Manager  |  |   Services     |  |   Validators     |     |
|  | (React hooks)  |  | (config ops)   |  | (json schema)    |     |
|  +-------+--------+  +-------+--------+  +--------+---------+     |
|          |                  |                    |                |
+----------|------------------|--------------------|----------------+
           |                  |                    |
           v                  v                    v
+------------------------------------------------------------------+
|                          Data Layer                                |
|  +----------------+  +----------------+  +------------------+     |
|  | Config Store   |  | Template Store |  |  Project Index   |     |
|  | (settings.json)|  | (templates.json|  | (projects.json)  |     |
|  +----------------+  +----------------+  +------------------+     |
|  +----------------------------------------------------------------+
|  |                    File System Layer                            |
|  |  +-------------+  +-------------+  +-------------+              |
|  |  | JSON Reader |  | JSON Writer |  | File Watcher|              |
|  |  +-------------+  +-------------+  +-------------+              |
+--+----------------------------------------------------------------+
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| **CLI Interface** | Parse commands, flags, arguments | commander, yargs, oclif |
| **TUI Components** | Interactive UI, forms, lists, tables | ink (React), blessed, @inquirer/prompts |
| **State Manager** | Centralized state, reactive updates | React hooks (useState/useReducer), zustand |
| **Services** | Business logic, config operations | Plain TypeScript modules |
| **Validators** | Schema validation, type checking | zod, jsonschema, ajv |
| **Config Store** | Persist settings, templates, projects | JSON files in XDG config dir |
| **Template Store** | Provider presets, reusable configs | JSON files, embedded defaults |
| **Project Index** | Track managed projects, their configs | JSON file with project paths |
| **File System** | Read/write/watch config files | node:fs, chokidar, fs-extra |

## Recommended Project Structure

```
src/
+-- cli/                    # CLI entry point and command routing
|   +-- index.ts            # Main entry, program setup
|   +-- commands/           # Command handlers
|   |   +-- list.ts         # List projects command
|   |   +-- add.ts          # Add project command
|   |   +-- switch.ts       # Switch config command
|   |   +-- template.ts     # Template management commands
|   |   +-- config.ts       # Config preview/edit commands
|   +-- middlewares/        # CLI middleware (validation, logging)
|
+-- tui/                    # TUI components (ink/React)
|   +-- App.tsx             # Main app component
|   +-- screens/            # Screen-level components
|   |   +-- ProjectList.tsx # Project list screen
|   |   +-- ProjectDetail.tsx# Project detail screen
|   |   +-- TemplateList.tsx # Template management screen
|   |   +-- ConfigEditor.tsx # Config editor screen
|   +-- components/         # Reusable UI components
|   |   +-- Select.tsx      # Dropdown select
|   |   +-- Input.tsx       # Text input
|   |   +-- Table.tsx       # Table display
|   |   +-- StatusBadge.tsx # Status indicator
|   |   +-- JsonPreview.tsx # JSON previewer
|   +-- hooks/              # TUI-specific hooks
|   |   +-- useNavigation.ts# Navigation state
|   |   +-- useKeyInput.ts  # Keyboard handling
|
+-- services/               # Business logic layer
|   +-- config/             # Configuration services
|   |   +-- reader.ts       # Read config files
|   |   +-- writer.ts       # Write config files
|   |   +-- merger.ts       # Merge config layers
|   |   +-- validator.ts    # Validate config schema
|   +-- project/            # Project management
|   |   +-- scanner.ts      # Scan for projects
|   |   +-- index.ts        # Project index CRUD
|   |   +-- detector.ts     # Detect project type
|   +-- template/           # Template management
|   |   +-- store.ts        # Template CRUD
|   |   +-- apply.ts        # Apply template to project
|   +-- provider/           # API provider logic
|   |   +-- test.ts         # Test API connectivity
|   |   +-- defaults.ts     # Built-in provider presets
|
+-- store/                  # State management
|   +-- index.ts            # Central store
|   +-- slices/             # State slices
|   |   +-- projects.ts     # Projects state
|   |   +-- templates.ts    # Templates state
|   |   +-- settings.ts     # App settings
|   +-- middleware/          # Store middleware
|   |   +-- persistence.ts  # Auto-save to disk
|
+-- lib/                    # Core utilities
|   +-- file-system/        # File operations
|   |   +-- json.ts         # JSON read/write with comments
|   |   +-- watcher.ts      # File watching
|   |   +-- backup.ts       # Backup/restore
|   +-- validation/         # Validation utilities
|   |   +-- schema.ts        # JSON schemas
|   |   +-- types.ts         # TypeScript types
|   +-- paths/              # Path resolution
|   |   +-- xdg.ts          # XDG base directory
|   |   +-- claude.ts       # Claude Code paths
|
+-- types/                  # TypeScript definitions
|   +-- config.ts           # Config types
|   +-- project.ts          # Project types
|   +-- template.ts         # Template types
|   +-- provider.ts         # Provider types
|
+-- constants/              # Constants and defaults
|   +-- providers.ts        # Built-in provider templates
|   +-- schema.ts           # Default config schema
|
+-- index.ts                # Package exports
```

### Structure Rationale

- **cli/**: Separate from TUI allows non-interactive usage and clear command routing
- **tui/**: Ink components organized by screens (routes) and reusable components
- **services/**: Core business logic independent of UI, easily testable
- **store/**: Centralized state for reactive UI updates
- **lib/**: Low-level utilities with no business logic dependencies
- **types/**: Shared TypeScript definitions, single source of truth

## Architectural Patterns

### Pattern 1: Repository Pattern for Config Access

**What:** Abstract file system operations behind a repository interface
**When to use:** When you need to swap storage backends or simplify testing
**Trade-offs:** Slight indirection, but enables easy mocking and future migrations

**Example:**
```typescript
// lib/file-system/json.ts
interface ConfigRepository {
  read(path: string): Promise<Config>;
  write(path: string, config: Config): Promise<void>;
  exists(path: string): Promise<boolean>;
  backup(path: string): Promise<string>;
}

class JsonConfigRepository implements ConfigRepository {
  async read(path: string): Promise<Config> {
    const content = await fs.readFile(path, 'utf-8');
    return JSON.parse(stripJsonComments(content));
  }

  async write(path: string, config: Config): Promise<void> {
    await fs.mkdir(dirname(path), { recursive: true });
    await fs.writeFile(path, JSON.stringify(config, null, 2));
  }
}
```

### Pattern 2: Service Layer for Business Logic

**What:** Encapsulate all business logic in service modules, keep components thin
**When to use:** Always - ensures logic is testable and UI-agnostic
**Trade-offs:** More files, but cleaner separation and easier testing

**Example:**
```typescript
// services/project/index.ts
class ProjectService {
  constructor(
    private configRepo: ConfigRepository,
    private projectIndex: ProjectIndex
  ) {}

  async addProject(path: string): Promise<Project> {
    const configPath = join(path, '.claude', 'settings.json');
    const existing = await this.configRepo.exists(configPath);

    if (existing) {
      const config = await this.configRepo.read(configPath);
      // Validate and index the project
    }

    return this.projectIndex.add({ path, configPath, status: 'active' });
  }

  async applyTemplate(project: Project, template: Template): Promise<void> {
    const config = await this.configRepo.read(project.configPath);
    const merged = this.mergeConfig(config, template.config);
    await this.configRepo.backup(project.configPath);
    await this.configRepo.write(project.configPath, merged);
  }
}
```

### Pattern 3: React Hooks for TUI State

**What:** Use custom hooks to encapsulate stateful logic, share across components
**When to use:** For any stateful operation (navigation, forms, async data)
**Trade-offs:** Learning curve for React patterns, but excellent composability

**Example:**
```typescript
// tui/hooks/useProjects.ts
function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    projectService.listAll()
      .then(setProjects)
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);

  const refresh = useCallback(() => {
    setLoading(true);
    projectService.listAll()
      .then(setProjects)
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);

  return { projects, loading, error, refresh };
}

// tui/screens/ProjectList.tsx
function ProjectList() {
  const { projects, loading, error } = useProjects();

  if (loading) return <Text>Loading...</Text>;
  if (error) return <Text color="red">{error.message}</Text>;

  return (
    <Box flexDirection="column">
      {projects.map(p => (
        <ProjectRow key={p.path} project={p} />
      ))}
    </Box>
  );
}
```

### Pattern 4: Configuration Layering (Precedence Chain)

**What:** Support multiple config sources with clear precedence
**When to use:** When users need flexibility in how they configure
**Trade-offs:** More complexity in resolution logic, but matches user expectations

**Precedence Order (highest to lowest):**
1. CLI flags (immediate override)
2. Environment variables (session-level)
3. Local config (`settings.local.json` - not in git)
4. Project config (`settings.json` - in git)
5. User config (`~/.claude/settings.json` - global)
6. Default values (built-in)

**Example:**
```typescript
// services/config/merger.ts
function resolveConfig(projectPath: string, options: CliOptions): ResolvedConfig {
  const defaults = loadDefaults();
  const userConfig = loadUserConfig();
  const projectConfig = loadProjectConfig(projectPath);
  const localConfig = loadLocalConfig(projectPath);
  const envConfig = loadFromEnv();
  const cliConfig = parseCliOptions(options);

  return {
    ...defaults,
    ...userConfig,
    ...projectConfig,
    ...localConfig,
    ...envConfig,
    ...cliConfig
  };
}
```

## Data Flow

### Request Flow (Config Switch)

```
User Input (select provider)
    |
    v
+----------------+
| TUI Component  |  <- User clicks "Apply"
+-------+--------+
        |
        v
+----------------+
| useAction Hook |  <- Hook handles async operation
+-------+--------+
        |
        v
+----------------+
| ProjectService |  <- Business logic
+-------+--------+
        |
        v
+----------------+
| ConfigRepository| <- Read current config
+-------+--------+
        |
        v
+----------------+
| ConfigMerger   |  <- Merge template with current
+-------+--------+
        |
        v
+----------------+
| ConfigRepository| <- Write new config (with backup)
+-------+--------+
        |
        v
+----------------+
| File System    |  <- Atomic write to disk
+----------------+
        |
        v
    TUI Update (success message)
```

### State Management Flow

```
+------------------+
|   User Action    |
+--------+---------+
         |
         v
+------------------+     +------------------+
|   Action Hook    |---->|  Service Layer   |
+--------+---------+     +--------+---------+
         |                        |
         v                        v
+------------------+     +------------------+
|   Local State    |     |   File System    |
|   (useState)     |     |   (persist)      |
+--------+---------+     +------------------+
         |
         v
+------------------+
|  UI Re-render    |
+------------------+
```

### Key Data Flows

1. **Project Discovery Flow:**
   - Scan directory → Detect `.claude/` → Read `settings.json` → Index project → Display in list

2. **Template Application Flow:**
   - Select template → Read project config → Merge template values → Backup original → Write new config → Verify success

3. **Config Validation Flow:**
   - Read config → Validate against schema → Check API connectivity → Report errors/warnings → Allow save with warnings

4. **Settings Synchronization Flow:**
   - File watcher detects change → Reload config → Validate → Update state → Re-render affected components

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| Claude Code | File system only | Read/write `.claude/settings.json` |
| API Providers | HTTP connectivity test | Verify API key and endpoint work |
| Git | File system detection | Detect if project uses git for warnings |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| CLI → TUI | Function call, shared state | CLI flags can pre-select TUI state |
| TUI → Services | Direct function call | Services are stateless, pass all data |
| Services → Store | Return data, don't modify | Store handles persistence |
| Services → File System | Repository pattern | Abstract for testability |

## Build Order Implications

Based on dependencies between components, recommended build sequence:

### Phase 1: Foundation (No Dependencies)
1. **types/** - Define all TypeScript interfaces first
2. **constants/** - Provider defaults, schemas
3. **lib/paths/** - Path resolution utilities

### Phase 2: Data Layer (Depends on Foundation)
4. **lib/file-system/** - JSON read/write, backup
5. **lib/validation/** - Schema validation
6. **store/** - State management setup

### Phase 3: Services (Depends on Data)
7. **services/config/** - Config read/write/merge
8. **services/project/** - Project indexing
9. **services/template/** - Template management
10. **services/provider/** - API testing

### Phase 4: Interface Layer (Depends on Services)
11. **tui/components/** - Reusable UI components
12. **tui/hooks/** - Custom hooks
13. **tui/screens/** - Screen components
14. **tui/App.tsx** - Main app composition

### Phase 5: CLI Entry (Depends on Everything)
15. **cli/commands/** - Command handlers
16. **cli/index.ts** - Entry point

### Dependency Graph
```
types, constants, paths
        |
        v
file-system, validation
        |
        v
     store
        |
        v
services (config, project, template, provider)
        |
        v
tui (components, hooks, screens)
        |
        v
    cli/commands
        |
        v
    cli/index (entry)
```

## Anti-Patterns

### Anti-Pattern 1: Mixing UI and Business Logic in Components

**What people do:** Put file I/O and business logic directly in React components
**Why it's wrong:** Untestable, hard to modify, business logic changes require UI changes
**Do this instead:**
```typescript
// BAD: Business logic in component
function ProjectList() {
  const [projects, setProjects] = useState([]);
  useEffect(() => {
    fs.readFile('projects.json').then(data => setProjects(JSON.parse(data)));
  }, []);
}

// GOOD: Business logic in service, component is thin
function ProjectList() {
  const { projects } = useProjects(); // Hook calls service
}

// services/project/index.ts
export async function listProjects(): Promise<Project[]> {
  const data = await fs.readFile('projects.json', 'utf-8');
  return JSON.parse(data);
}
```

### Anti-Pattern 2: Direct File Access Throughout Codebase

**What people do:** Call `fs.readFile` directly in multiple places
**Why it's wrong:** Hard to mock in tests, changes to file format require multiple edits
**Do this instead:** Use repository pattern with single point of file access

### Anti-Pattern 3: Storing Sensitive Data in Project Config

**What people do:** Put API tokens in `settings.json` (committed to git)
**Why it's wrong:** Tokens leak to git history, visible to anyone with repo access
**Do this instead:** Always use `settings.local.json` for tokens, add to `.gitignore`

### Anti-Pattern 4: Monolithic State Object

**What people do:** Single large state object for all app data
**Why it's wrong:** Re-renders entire app on any change, hard to reason about updates
**Do this instead:** Split state by domain (projects, templates, settings)

### Anti-Pattern 5: Ignoring Claude Code's Config Precedence

**What people do:** Write config without respecting Claude Code's layering
**Why it's wrong:** Config won't work correctly when combined with other sources
**Do this instead:** Follow Claude Code's precedence: user < project < local

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 1-10 projects | Simple in-memory store, file-based persistence sufficient |
| 10-100 projects | Add project indexing, lazy loading of configs |
| 100+ projects | Consider SQLite for project index, caching layer |

### Scaling Priorities

1. **First bottleneck:** Config file I/O becomes slow with many projects
   - Solution: Implement lazy loading, cache resolved configs in memory

2. **Second bottleneck:** TUI re-renders on every keystroke
   - Solution: Debounce inputs, memoize components, virtualize long lists

## Sources

- [cc-switch Repository](https://github.com/farion1231/cc-switch) - Reference implementation (HIGH confidence, analyzed directly)
- [Ink - React for CLI](https://github.com/vadimdemedes/ink) - TUI framework (HIGH confidence, official docs)
- [Ink UI Components](https://github.com/sindresorhus/ink-ui) - Interactive components (HIGH confidence)
- [CLI Architecture Patterns](https://12factor.net/) - Configuration methodology (HIGH confidence)
- [JSON Config Best Practices](https://www.npmjs.com/package/cosmiconfig) - Config loading patterns (MEDIUM confidence, npm docs)

---
*Architecture research for: CLI/TUI Configuration Management Tools*
*Researched: 2026-04-13*