# Phase 7: Project Management Features - Research

**Researched:** 2026-04-14
**Domain:** Shell integration, TUI multi-select, config import/export
**Confidence:** HIGH

## Summary

Phase 7 implements project management enhancements: auto-switch by directory (F9), project directory scan UI (F10), and import/export configs (F13). Fuzzy search (F14) was already implemented in Phase 06 via useFuzzySearch hook.

The shell hook pattern follows direnv's approach using PROMPT_COMMAND (bash) and chpwd_functions (zsh) arrays. The user's existing model-switch.js provides a reference implementation for project-level settings.local.json manipulation. Import/export uses JSON with a versioned schema, leveraging existing deepMergeConfig for conflict handling. Scan UI can use ink-select-input (already in dependencies) for multi-select functionality.

**Primary recommendation:** Use direnv-style shell hooks with silent output, leverage existing deepMergeConfig for import conflicts, extend ink-select-input for multi-select in ScanScreen.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Shell hook implementation — similar to direnv mode
  - Why: Standard Unix tool pattern, no background resource consumption, user-controlled trigger timing
  - How: Provide chdir hook script, user adds to bashrc/zshrc

- **D-02:** Silent + only output on switch — does not interfere with normal shell operations
  - Why: cd is a frequent operation, frequent output would cause interference
  - How: Only output one message when actual config switch occurs

- **D-03:** Prompt to register new project — prompt when .claude directory detected
  - Why: Auto-registration may accidentally add unwanted directories
  - How: When current directory has .claude/settings.json but not registered, prompt user to register

- **D-04:** Reference existing model-switch.js — user already has similar implementation
  - Why: Consistency with existing workflow, reuse proven patterns
  - How: Reference ~/.claude/hooks/model-switch.js for config hierarchy handling logic

- **D-05:** Single project scope — export current project config
  - Why: Single project export/import is the most common scenario, simplifies operation
  - How: `export <project-id>` and `import <file.json>` commands

- **D-06:** Single JSON file format — simple and readable
  - Why: JSON format consistent with existing config, can be directly edited/viewed
  - How: Export file contains settings + template + metadata

- **D-07:** Interactive conflict handling — detect conflicts let user choose
  - Why: Flexible handling of various import scenarios, avoid accidental overwrite
  - How: On import detect conflict fields, popup selection interface (merge/overwrite/skip)

- **D-08:** Two trigger modes — TUI shortcut + CLI command
  - Why: Satisfy different use scenarios, TUI convenient for interaction, CLI convenient for scripting
  - How: TUI press S key trigger, CLI `cc-config scan` command

- **D-09:** TUI selection interface — popup selection list after scan
  - Why: User can checkmark projects to register, avoid registering all
  - How: ScanScreen displays newly discovered project list, already registered projects marked gray

### Claude's Discretion

- Shell hook installation instruction detailed documentation
- Export JSON file specific schema structure
- ScanScreen and ProjectListScreen interaction flow
- Import conflict detection specific field comparison logic
- Auto-Switch prompt registration timing (first enter vs every enter)

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| F9 | Auto-Switch by Directory | Shell hook patterns: direnv chpwd/PROMPT_COMMAND, model-switch.js reference |
| F10 | Project Directory Scan | ScanScreen TUI: ink-select-input multi-select, ProjectService.scanProjects() integration |
| F13 | Import/Export Configs | JSON schema design: ClaudeSettings extension, deepMergeConfig for conflicts |
| F14 | Fuzzy Search | Already implemented in Phase 06 (useFuzzySearch hook) |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| ink | 7.0.0 | TUI framework | Already in use, React-based CLI |
| ink-select-input | 6.2.0 | Multi-select component | Already in dependencies, checkbox support |
| commander | 14.0.3 | CLI framework | Already in use, command registration |
| zod | 4.3.6 | Schema validation | Already in use, ClaudeSettings validation |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| fs-extra | 11.3.4 | Atomic file operations | Export/import file writes |
| conf | 15.1.0 | XDG config storage | Already in AppState |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| ink-select-input | ink-checkbox | ink-select-input already installed, supports multi-select via focus/select |
| Custom shell hook | direnv wrapper | Custom hook gives control over message format and timing |

**Version verification:**
```bash
npm view ink-select-input version  # 6.2.0 (verified)
npm view ink version               # 7.0.0 (in package.json)
npm view commander version         # 14.0.3 (in package.json)
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── cli/
│   ├── commands/
│   │   ├── scan.ts          # NEW: CLI scan command
│   │   ├── export.ts        # NEW: CLI export command
│   │   ├── import.ts        # NEW: CLI import command
│   │   └── auto-check.ts    # NEW: CLI auto-switch check
│   └── utils/
│       └── auto-switch.ts   # NEW: Auto-switch logic
├── lib/
│   ├── services/
│   │   └── export-service.ts # NEW: Export/import service
│   └── types/
│       └── export-schema.ts  # NEW: Export JSON schema
├── tui/
│   ├── screens/
│   │   ├── ScanScreen.tsx    # NEW: Scan results multi-select
│   │   └── ImportConflictScreen.tsx # NEW: Conflict resolution UI
│   └── hooks/
│       └── useMultiSelect.ts # NEW: Multi-select hook (optional)
```

### Pattern 1: Shell Hook Integration (F9)

**What:** Hook into shell's prompt/directory change mechanism to detect and auto-apply project configs.

**When to use:** Auto-switch feature (F9), executed on every cd/chdir.

**Implementation:**

```bash
# Bash hook (add to ~/.bashrc)
_cc_config_chpwd_hook() {
  local output
  output=$(cc-config auto-check --silent 2>&1)
  if [[ -n "$output" ]]; then
    echo "$output"
  fi
}

# Append to existing PROMPT_COMMAND or create new
if [[ -n "$PROMPT_COMMAND" ]]; then
  PROMPT_COMMAND="${PROMPT_COMMAND};_cc_config_chpwd_hook"
else
  PROMPT_COMMAND="_cc_config_chpwd_hook"
fi

# Zsh hook (add to ~/.zshrc)
_cc_config_chpwd_hook() {
  local output
  output=$(cc-config auto-check --silent 2>&1)
  if [[ -n "$output" ]]; then
    echo "$output"
  fi
}

# Add to chpwd_functions array
chpwd_functions+=(_cc_config_chpwd_hook)
```

**Reference:** User's existing model-switch.js shows pattern:
- Project settings.local.json path: `<cwd>/.claude/settings.local.json`
- Config hierarchy: project > global
- Silent operation by default

Source: [direnv Shell Hook Documentation](https://direnv.net/docs/hook.html), [Stack Overflow: direnv Hook Mechanism](https://stackoverflow.com/questions/63834831/how-does-direnv-hook-into-shell)

### Pattern 2: Export JSON Schema (F13)

**What:** Versioned JSON schema for config export with metadata and conflict detection fields.

**When to use:** Export/import operations (F13).

**Schema Design:**

```typescript
// src/lib/types/export-schema.ts
import { z } from 'zod';
import { ClaudeSettingsSchema } from './config.js';
import { TemplateConfigSchema } from './provider.js';

/**
 * Export metadata schema.
 */
export const ExportMetadataSchema = z.object({
  version: z.literal('1.0'),           // Schema version (fixed for v1)
  exportedAt: z.string().datetime(),   // ISO timestamp
  toolVersion: z.string().optional(),  // cc-config version
});

/**
 * Project reference schema (lightweight, no full ProjectEntry).
 */
export const ProjectRefSchema = z.object({
  id: z.string().uuid(),               // Project UUID
  path: z.string(),                    // Project path (may differ on import)
  name: z.string().optional(),         // Display name (derived from path)
});

/**
 * Full export payload schema.
 */
export const ExportPayloadSchema = z.object({
  metadata: ExportMetadataSchema,
  project: ProjectRefSchema,
  settings: ClaudeSettingsSchema,      // Actual config
  template: TemplateConfigSchema.nullable(), // Applied template (if any)
});

export type ExportMetadata = z.infer<typeof ExportMetadataSchema>;
export type ProjectRef = z.infer<typeof ProjectRefSchema>;
export type ExportPayload = z.infer<typeof ExportPayloadSchema>;
```

Source: [JSON Schema Best Practices](https://json-schema.org/learn/address-instance.html)

### Pattern 3: Import Conflict Detection (F13)

**What:** Compare imported settings with existing, offer merge/overwrite/skip options.

**When to use:** Import operation when target project has existing config.

**Conflict Detection Logic:**

```typescript
// src/lib/services/export-service.ts
interface ConflictField {
  key: string;           // Field path (e.g., 'env.ANTHROPIC_MODEL')
  imported: unknown;     // Value from import file
  existing: unknown;     // Current value in project
}

function detectConflicts(
  imported: ClaudeSettings,
  existing: ClaudeSettings
): ConflictField[] {
  const conflicts: ConflictField[] = [];
  
  // Check env variables
  if (imported.env && existing.env) {
    for (const [key, value] of Object.entries(imported.env)) {
      if (existing.env[key] !== undefined && existing.env[key] !== value) {
        conflicts.push({
          key: `env.${key}`,
          imported: value,
          existing: existing.env[key],
        });
      }
    }
  }
  
  // Check model field
  if (imported.model && existing.model && imported.model !== existing.model) {
    conflicts.push({
      key: 'model',
      imported: imported.model,
      existing: existing.model,
    });
  }
  
  return conflicts;
}
```

**Resolution Options:**
- **Merge:** Use existing deepMergeConfig (imported overwrites existing)
- **Overwrite:** Replace entire config with imported
- **Skip:** Keep existing, discard imported

Source: Existing `src/lib/types/merge.ts` - deepMergeConfig implementation

### Pattern 4: Multi-Select Scan UI (F10)

**What:** TUI screen for selecting which discovered projects to register.

**When to use:** After scan operation, user selects projects to add.

**Implementation using ink-select-input:**

```tsx
// src/tui/screens/ScanScreen.tsx
import React, { useState, useMemo } from 'react';
import { Box, Text, useInput } from 'ink';
import SelectInput from 'ink-select-input';
import type { ScanResult } from '../../lib/services/project-service.js';

interface ScanScreenProps {
  results: ScanResult[];
  onConfirm: (selected: string[]) => void;  // Paths to register
  onCancel: () => void;
}

export const ScanScreen: React.FC<ScanScreenProps> = ({
  results,
  onConfirm,
  onCancel,
}) => {
  // Filter to new projects only (already registered shown as gray info)
  const newProjects = useMemo(
    () => results.filter(r => r.isNew),
    [results]
  );
  
  const [selectedPaths, setSelectedPaths] = useState<Set<string>>(new Set());
  
  // Transform for SelectInput items
  const items = useMemo(
    () => newProjects.map(r => ({
      label: r.path.split('/').pop() ?? r.path,
      value: r.path,
    })),
    [newProjects]
  );
  
  const handleSelect = (item: { value: string }) => {
    // Toggle selection
    setSelectedPaths(prev => {
      const next = new Set(prev);
      if (next.has(item.value)) {
        next.delete(item.value);
      } else {
        next.add(item.value);
      }
      return next;
    });
  };
  
  useInput((input, key) => {
    if (key.escape) {
      onCancel();
    }
    if (key.return && selectedPaths.size > 0) {
      onConfirm(Array.from(selectedPaths));
    }
  });
  
  return (
    <Box flexDirection="column" padding={1}>
      <Text bold color="cyan">Scan Results</Text>
      <Text dimColor>{newProjects.length} new projects found</Text>
      
      <Box marginTop={1} flexDirection="column">
        {items.map(item => (
          <Text
            key={item.value}
            color={selectedPaths.has(item.value) ? 'green' : 'white'}
          >
            {selectedPaths.has(item.value) ? '✓ ' : '  '}
            {item.label}
          </Text>
        ))}
      </Box>
      
      <Box marginTop={1}>
        <Text dimColor>
          Space: toggle | Enter: confirm ({selectedPaths.size} selected) | Esc: cancel
        </Text>
      </Box>
    </Box>
  );
};
```

**Note:** Can also use ink-select-input directly with `onSelect` callback for navigation, then custom useInput for Space toggle.

Source: [ink-select-input npm](https://www.npmjs.com/package/ink-select-input), existing `src/tui/screens/ProjectListScreen.tsx` pattern

### Anti-Patterns to Avoid

- **Daemon/background process for auto-switch:** Per D-01, use shell hooks, not background services
- **Auto-register without confirmation:** Per D-03, prompt user before registration
- **Overwrite without conflict check:** Per D-07, always detect conflicts on import
- **Services importing ink/react:** Per M4 verification, services must not have UI dependencies

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|------|
| Shell hook mechanism | Custom daemon polling | PROMPT_COMMAND/chpwd_functions | Standard Unix pattern, no resource waste |
| Multi-select TUI | Custom checkbox rendering | ink-select-input or existing useKeyInput pattern | Already installed, tested patterns |
| Config merge on import | Custom merge logic | deepMergeConfig from merge.ts | Handles undefined/null/arrays correctly |
| JSON validation | Manual field checking | Zod schemas | Already in use, type inference |

**Key insight:** The project already has most infrastructure: scanProjects() in ProjectService, deepMergeConfig in merge.ts, ConfirmScreen pattern. Only need to add export/import schema and ScanScreen.

## Runtime State Inventory

> Not a rename/refactor/migration phase — omitting this section.

## Common Pitfalls

### Pitfall 1: Shell Hook Overwrites PROMPT_COMMAND

**What goes wrong:** Appending hook to PROMPT_COMMAND may overwrite existing hooks if done incorrectly.

**Why it happens:** naive `PROMPT_COMMAND="_cc_config_hook"` replaces instead of appending.

**How to avoid:** Always append, check if PROMPT_COMMAND exists:
```bash
if [[ -n "$PROMPT_COMMAND" ]]; then
  PROMPT_COMMAND="${PROMPT_COMMAND};_cc_config_hook"
else
  PROMPT_COMMAND="_cc_config_hook"
fi
```

**Warning signs:** Other tools (direnv, etc.) stop working after cc-config hook install.

### Pitfall 2: Import Conflicts Silent Overwrite

**What goes wrong:** Importing config silently overwrites existing values without user awareness.

**Why it happens:** Direct deepMergeConfig without conflict detection.

**How to avoid:** Always run detectConflicts() first, show ImportConflictScreen if conflicts found.

**Warning signs:** User reports missing custom env variables after import.

### Pitfall 3: Scan Shows Already-Registered Projects

**What goes wrong:** ScanScreen shows projects that are already registered as selectable.

**Why it happens:** Not filtering ScanResult.isNew === false.

**How to avoid:** Filter results before display, show already-registered as gray/non-selectable info.

**Warning signs:** User tries to "register" project they already have.

### Pitfall 4: Auto-Switch Output on Every cd

**What goes wrong:** Every cd command shows "No config change" message, cluttering terminal.

**Why it happens:** Auto-check always outputs status message.

**How to avoid:** Per D-02, only output when actual switch occurs (--silent mode, empty output = no message).

**Warning signs:** User complains about "spam" in terminal.

## Code Examples

### Auto-Check CLI Command

```typescript
// src/cli/commands/auto-check.ts
import { ProjectIndex, AppState } from '../../lib/store/index.js';
import { ConfigService } from '../../lib/services/index.js';
import { readConfig, writeConfig } from '../../lib/store/config.js';

export async function autoCheck(silent: boolean = true): Promise<void> {
  const cwd = process.cwd();
  const projectIndex = new ProjectIndex();
  const appState = new AppState();
  
  // Check if current directory is registered
  const project = await projectIndex.getByPath(cwd);
  
  if (project) {
    // Check if active project changed
    const currentActive = appState.getActiveProject();
    if (currentActive !== project.id) {
      // Apply project config (switch)
      appState.setActiveProject(project.id);
      
      if (!silent) {
        console.log(`Switched to project: ${cwd.split('/').pop()}`);
        if (project.activeConfig) {
          console.log(`Template: ${project.activeConfig}`);
        }
      }
    }
    // No change = no output (D-02)
  } else {
    // D-03: Check for unregistered .claude directory
    const claudeDir = path.join(cwd, '.claude', 'settings.json');
    if (fs.existsSync(claudeDir)) {
      if (!silent) {
        console.log('Found .claude directory. Register with: cc-config register');
      }
    }
  }
}
```

### Export Service Implementation

```typescript
// src/lib/services/export-service.ts
import { z } from 'zod';
import { ServiceError } from './types.js';
import { ExportPayloadSchema, type ExportPayload } from '../types/export-schema.js';
import { deepMergeConfig } from '../types/merge.js';
import type { ClaudeSettings } from '../types/config.js';
import type { ProjectEntry } from '../store/project.js';
import type { TemplateConfig } from '../types/provider.js';

export class ExportService {
  constructor(
    private projectIndex: ProjectIndex,
    private templateStore: TemplateStore,
    private configService: ConfigService
  ) {}
  
  async exportProject(projectId: string): Promise<ExportPayload> {
    const project = await this.projectIndex.getById(projectId);
    if (!project) {
      throw new ServiceError('Project not found', 'PROJECT_NOT_FOUND');
    }
    
    const settings = await this.configService.readProjectConfig(project.path);
    const template = project.activeConfig 
      ? await this.templateStore.get(project.activeConfig) 
      : null;
    
    return {
      metadata: {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        toolVersion: '0.1.0',
      },
      project: {
        id: project.id,
        path: project.path,
        name: project.path.split('/').pop(),
      },
      settings: settings ?? {},
      template,
    };
  }
  
  async importProject(
    payload: unknown,
    targetPath: string,
    strategy: 'merge' | 'overwrite' | 'skip'
  ): Promise<void> {
    // Validate payload
    const parsed = ExportPayloadSchema.safeParse(payload);
    if (!parsed.success) {
      throw new ServiceError('Invalid export file', 'IMPORT_INVALID', parsed.error);
    }
    
    const existing = await this.configService.readProjectConfig(targetPath);
    
    if (strategy === 'overwrite') {
      await this.configService.writeProjectConfig(targetPath, parsed.data.settings);
    } else if (strategy === 'merge' && existing) {
      const merged = deepMergeConfig(existing, parsed.data.settings);
      await this.configService.writeProjectConfig(targetPath, merged);
    }
    // 'skip' does nothing
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| direnv-style env diff | Shell hook with silent output | Phase 07 design | Less noise, user-friendly |
| Single-select list | Multi-select checkbox (ink-select-input) | Phase 07 design | Batch project registration |
| Manual config copy | Structured JSON export/import | Phase 07 design | Shareable, validated configs |

**Deprecated/outdated:**
- Background daemon polling for auto-switch: Use shell hooks instead

## Open Questions

1. **Import Conflict Screen Design**
   - What we know: ConfirmScreen exists for y/n actions
   - What's unclear: How to present multiple conflict fields with individual merge/skip choices
   - Recommendation: Start with simple merge-all/skip-all via ConfirmScreen, enhance later if needed

2. **Auto-Switch Registration Prompt Timing**
   - What we know: D-03 requires prompt when .claude detected
   - What's unclear: First enter only vs every enter
   - Recommendation: First enter only, use AppState to track "prompted" status per path

3. **ScanScreen in Navigation Stack**
   - What we know: useNavigation supports 'list', 'editor', 'confirm', 'template-select'
   - What's unclear: Should 'scan' be a new Screen type or modal overlay
   - Recommendation: Add 'scan' as Screen type, push from ProjectListScreen on 'S' key

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Runtime | ✓ | 18+ | — |
| npm | Package manager | ✓ | — | — |
| TypeScript | Build | ✓ | 6.0.2 | — |
| vitest | Testing | ✓ | 3.2.4 | — |
| ink-select-input | Multi-select TUI | ✓ | 6.2.0 | Custom useKeyInput implementation |

**Missing dependencies with no fallback:**
- None — all required dependencies are installed

**Missing dependencies with fallback:**
- ink-select-input: Can implement custom multi-select using existing useKeyInput pattern if needed

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest 3.2.4 |
| Config file | vitest.config.ts |
| Quick run command | `npm test -- src/**/*.test.ts` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| F9 | Auto-switch detects registered project | unit | `npm test -- src/cli/commands/auto-check.test.ts` | ❌ Wave 0 |
| F9 | Shell hook outputs only on actual switch | unit | `npm test -- src/cli/utils/auto-switch.test.ts` | ❌ Wave 0 |
| F9 | Prompts for unregistered .claude dir | unit | `npm test -- src/cli/commands/auto-check.test.ts` | ❌ Wave 0 |
| F10 | ScanScreen shows new projects | unit | `npm test -- src/tui/screens/ScanScreen.test.tsx` | ❌ Wave 0 |
| F10 | Multi-select toggle works | unit | `npm test -- src/tui/screens/ScanScreen.test.tsx` | ❌ Wave 0 |
| F10 | CLI scan command works | unit | `npm test -- src/cli/commands/scan.test.ts` | ❌ Wave 0 |
| F13 | Export creates valid JSON | unit | `npm test -- src/lib/services/export-service.test.ts` | ❌ Wave 0 |
| F13 | Import validates schema | unit | `npm test -- src/lib/services/export-service.test.ts` | ❌ Wave 0 |
| F13 | Conflict detection works | unit | `npm test -- src/lib/services/export-service.test.ts` | ❌ Wave 0 |
| F13 | Merge strategy preserves existing | unit | `npm test -- src/lib/services/export-service.test.ts` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npm test -- src/**/*.test.ts --run`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/cli/commands/auto-check.ts` + test — F9 auto-switch CLI
- [ ] `src/cli/utils/auto-switch.ts` + test — Shell hook integration logic
- [ ] `src/cli/commands/scan.ts` + test — F10 CLI scan command
- [ ] `src/cli/commands/export.ts` + test — F13 CLI export command
- [ ] `src/cli/commands/import.ts` + test — F13 CLI import command
- [ ] `src/lib/services/export-service.ts` + test — F13 export/import service
- [ ] `src/lib/types/export-schema.ts` + test — F13 export JSON schema
- [ ] `src/tui/screens/ScanScreen.tsx` + test — F10 scan results multi-select
- [ ] `src/tui/screens/ImportConflictScreen.tsx` + test — F13 conflict resolution UI
- [ ] Update `src/cli/index.ts` — register new commands
- [ ] Update `src/tui/App.tsx` — add 'scan' screen type to navigation

*(If no gaps: "None — existing test infrastructure covers all phase requirements")*

## Sources

### Primary (HIGH confidence)
- Existing codebase: `src/lib/types/merge.ts` - deepMergeConfig implementation
- Existing codebase: `src/lib/services/project-service.ts` - scanProjects() implementation
- Existing codebase: `src/tui/screens/ConfirmScreen.tsx` - confirmation pattern
- Existing codebase: `src/tui/hooks/useKeyInput.ts` - dual-mode navigation pattern
- Existing codebase: `~/.claude/hooks/model-switch.js` - project-level settings.local.json manipulation reference

### Secondary (MEDIUM confidence)
- [direnv Shell Hook Documentation](https://direnv.net/docs/hook.html) - PROMPT_COMMAND/chpwd_functions patterns
- [Stack Overflow: How does direnv hook into shell?](https://stackoverflow.com/questions/63834831/how-does-direnv-hook-into-shell) - Hook mechanism explanation
- [Zsh Documentation - Hook Functions](https://zsh.sourceforge.io/Doc/Release/Functions.html) - chpwd, precmd_functions arrays
- [JSON Schema Official Docs](https://json-schema.org/learn/address-instance.html) - Schema design patterns
- [ink-select-input npm](https://www.npmjs.com/package/ink-select-input) - Multi-select component (v6.2.0 verified)

### Tertiary (LOW confidence)
- [Stack Overflow: Hooking into directory changes in zsh](https://stackoverflow.com/questions/2134182/hooking-into-directory-changes-in-zsh) - Implementation examples

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All dependencies already installed and verified
- Architecture: HIGH - Existing patterns (shell hook, deep merge, ConfirmScreen) are well-understood
- Pitfalls: HIGH - Based on direnv best practices and existing codebase constraints

**Research date:** 2026-04-14
**Valid until:** 30 days (stable libraries, well-established patterns)