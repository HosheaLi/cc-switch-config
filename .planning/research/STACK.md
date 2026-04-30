# Stack Research

**Domain:** Terminal UI prompts (replacing Ink React TUI)
**Researched:** 2026-04-30
**Confidence:** HIGH

## Recommended Stack

### Core Technology: prompts (terkelg/prompts)

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| prompts | 2.4.2 | Terminal interactive prompts | npm-style navigation (j/k + Enter), lightweight (2 deps), Node >=6 compatible |

**Why prompts over alternatives:**

1. **Exact UX match** - The project explicitly wants "npm 风格列表选择 (j/k + Enter)". prompts uses the same navigation pattern as npm CLI.
2. **Node.js compatibility** - Works with Node >=6. Project requires >=18.17. No version conflict.
3. **Lightweight footprint** - Only `kleur` + `sisteransi` dependencies. No React overhead.
4. **Commander.js friendly** - Prompts can be called directly within command handlers:
   ```typescript
   program.command('select')
     .action(async () => {
       const response = await prompts({
         type: 'select',
         name: 'project',
         message: 'Select a project',
         choices: [...]
       });
     });
   ```
5. **Testing support** - `prompts.inject()` for automated testing without mocking frameworks.

### Supporting Libraries (Keep Existing)

| Library | Version | Purpose | Notes |
|---------|---------|---------|-------|
| commander | 14.0.3 | CLI framework | Keep - prompts integrates directly in command handlers |
| zod | 4.3.6 | Validation | Keep - validates prompt inputs |
| chalk | 5.6.2 | Terminal colors | Keep - prompts uses kleur internally, chalk for custom output |
| cli-table3 | 0.6.5 | Table display | Keep - for non-interactive output |
| fuse.js | 7.3.0 | Fuzzy search | Keep - combine with prompts autocomplete |
| conf | 15.1.0 | Config persistence | Keep - stores app state |
| fs-extra | 11.3.4 | File operations | Keep |
| execa | 9.6.1 | Process execution | Keep |

### Development Tools (Keep Existing)

| Tool | Version | Purpose | Notes |
|------|---------|---------|-------|
| vitest | 3.2.4 | Testing framework | Keep - prompts.inject() works with vitest |
| tsup | 8.5.1 | Build | Keep - no changes needed |
| typescript | 6.0.2 | Compiler | Keep - prompts has TypeScript support |

## Installation

```bash
# Add prompts
npm install prompts@2.4.2

# Remove Ink + React (v2.0 cleanup)
npm uninstall ink ink-confirm-input ink-select-input ink-spinner ink-text-input react
npm uninstall -D @testing-library/react @types/react ink-testing-library
```

## Prompt Types Needed

| Type | Use Case | Example |
|------|----------|---------|
| `select` | Project/API selection (single) | TUI-01: npm-style list |
| `multiselect` | Project scan (multi) | ScanScreen: select multiple projects |
| `text` | API key input | ONB-01: fill API config |
| `confirm` | Apply confirmation | U5: y/n confirmation |
| `autocomplete` | Fuzzy search (optional) | F14: project search |

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| prompts | inquirer@9.3.8 | If need richer TypeScript types or more prompt varieties (editor, password, expand). Requires Node >=18 (compatible). Last publish Sep 2025. |
| prompts | @inquirer/prompts@8.4.2 | **NOT COMPATIBLE** - Requires Node >=20.12.0, project uses >=18.17 |
| prompts | enquirer@2.4.1 | **NOT RECOMMENDED** - Last publish Jul 2023, not maintained |

### inquirer@9.3.8 as Alternative

If the team prefers better TypeScript support:

```bash
npm install inquirer@9.3.8
```

**Pros:**
- More prompt types (select, checkbox, confirm, input, password, editor, expand, number, rawlist, search)
- Active maintenance (Sep 2025 publish)
- Better TS type inference

**Cons:**
- Heavier dependency tree
- Different UX pattern (arrow keys default, not j/k)

**Decision:** Use prompts for npm-style UX. inquirer if TypeScript types priority.

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| ink + react | Heavy React overhead for simple prompts, v1.0 feedback "逻辑混乱样式难看" | prompts (declarative async functions) |
| @inquirer/prompts v8+ | Node >=20.12.0 required, project uses >=18.17 | prompts or inquirer@9 |
| enquirer | Last update Jul 2023, unmaintained | prompts (active) |
| ink-testing-library | Ink-specific, unnecessary with prompts.inject() | vitest + prompts.inject() |

## Integration Pattern with Commander.js

```typescript
// src/cli/commands/select.ts
import prompts from 'prompts';
import { Command } from 'commander';

export function registerSelectCommand(program: Command) {
  program.command('select')
    .description('Select project and apply configuration')
    .action(async () => {
      // Step 1: Select project
      const { project } = await prompts({
        type: 'select',
        name: 'project',
        message: 'Select a project',
        choices: projects.map(p => ({
          title: p.name,
          value: p.path,
          description: p.description
        }))
      });

      if (!project) return; // User cancelled

      // Step 2: Select API config
      const { config } = await prompts({
        type: 'select',
        name: 'config',
        message: 'Select API configuration',
        choices: configs.map(c => ({
          title: c.name,
          value: c.id
        }))
      });

      // Step 3: Confirm
      const { confirm } = await prompts({
        type: 'confirm',
        name: 'confirm',
        message: 'Apply configuration?',
        initial: false
      });

      if (confirm) {
        // Apply configuration
      }
    });
}
```

## Testing Pattern

```typescript
// src/cli/commands/select.test.ts
import prompts from 'prompts';
import { describe, it, expect, vi } from 'vitest';

describe('select command', () => {
  it('should select project and config', async () => {
    // Inject answers for testing
    prompts.inject(['project-a', 'config-1', true]);

    const result = await runSelectCommand();

    expect(result.project).toBe('project-a');
    expect(result.config).toBe('config-1');
  });

  it('should handle cancel', async () => {
    // Inject undefined (cancel)
    prompts.inject([undefined]);

    const result = await runSelectCommand();

    expect(result).toBeUndefined();
  });
});
```

## Migration Impact

### Files to DELETE (Ink TUI)

```
src/tui/app.tsx
src/tui/app.test.tsx
src/tui/performance.test.tsx
src/tui/components/*.tsx (7 files)
src/tui/screens/*.tsx (7 files)
src/tui/hooks/*.tsx (4 files)
```

### Files to CREATE (prompts TUI)

```
src/tui/prompts.ts          - Main prompts orchestration
src/tui/prompts.test.ts     - Tests with prompts.inject()
```

### No changes needed

- `src/cli/` - Commander commands (add prompts calls)
- `src/services/` - Business logic (unchanged)
- `src/repositories/` - Data access (unchanged)
- `src/utils/` - Utilities (unchanged)

## Version Compatibility

| Package | Version | Node Required | Compatible |
|---------|---------|---------------|------------|
| prompts | 2.4.2 | >=6 | YES (project >=18.17) |
| inquirer | 9.3.8 | >=18 | YES (project >=18.17) |
| @inquirer/prompts | 8.4.2 | >=20.12.0 | NO (project >=18.17) |
| commander | 14.0.3 | >=18 | YES |
| zod | 4.3.6 | - | YES |

## Sources

- Context7 `/terkelg/prompts` — Usage, select/multiselect/autocomplete, inject for testing
- Context7 `/sboudrias/inquirer.js` — Select API, theming, Commander integration patterns
- npm registry — Version checks, Node engine requirements, publish dates
- GitHub terkelg/prompts — Lightweight, npm-style navigation, kleur/sisteransi deps

---
*Stack research for: prompts TUI replacing Ink React*
*Researched: 2026-04-30*