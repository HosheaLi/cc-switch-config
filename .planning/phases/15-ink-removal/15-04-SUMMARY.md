---
phase: 15-ink-removal
plan: 04
subsystem: cli
tags: [typescript, chalk, theme, picocolors, migration]

# Dependency graph
requires:
  - phase: 14-terminal-aesthetic
    provides: src/cli/theme/ module (colors, formatters, detection, borders)
  - phase: 15-ink-removal/15-01
    provides: fixed theme imports in wizards
provides:
  - Migrated 10 CLI layer files from chalk to theme module
  - Updated 3 test files for theme module mocks
affects: [15-ink-removal, cli-commands, prompts-components]

# Tech tracking
tech-stack:
  added: []
  patterns: [colors namespace import, formatters namespace import, separator function]

key-files:
  created: []
  modified:
    - src/cli/commands/switch.ts
    - src/cli/commands/config.ts
    - src/cli/commands/current.ts
    - src/cli/commands/list.ts
    - src/cli/commands/undo.ts
    - src/cli/prompts/components/select-template.ts
    - src/cli/prompts/components/confirm-action.ts
    - src/cli/prompts/components/select-directory.ts
    - src/cli/prompts/components/input-api-key.ts
    - src/cli/prompts/components/select-api-config.ts
    - src/cli/commands/config.test.ts
    - src/cli/prompts/components/select-api-config.test.ts
    - src/cli/utils/diff-render.test.ts

key-decisions:
  - "Plan scope limited to 16 files per files_modified frontmatter; remaining chalk files deferred to future plans"
  - "Task 03 utils files (autocomplete, cancel, format-choices, select) already migrated or don't exist"
  - "chalk cannot be uninstalled due to remaining imports in wizards and other command files"

requirements-completed: [TUI-06]

# Metrics
duration: 15min
completed: 2026-05-08
---

# Phase 15 Plan 04: Migrate All chalk Imports to Theme Module Summary

**Migrated 10 CLI layer files and 3 test files from chalk to theme module; chalk uninstall deferred due to remaining imports outside plan scope**

## Performance

- **Duration:** 15 min
- **Started:** 2026-05-08T04:25:32Z
- **Completed:** 2026-05-08T04:40:XXZ
- **Tasks:** 4
- **Files modified:** 13

## Accomplishments

- Migrated 5 command files (switch.ts, config.ts, current.ts, list.ts, undo.ts) from chalk to theme module
- Migrated 5 prompts components from chalk to theme module
- Verified prompts utils already migrated or non-existent (Task 03)
- Updated 3 test files to use theme module mocks instead of chalk mocks
- All 827 tests passing

## Task Commits

Each task was committed atomically:

1. **Task 1: Migrate 5 command files** - `10ead15` (feat)
2. **Task 2: Migrate 5 prompts components** - `cc4a7f2` (feat)
3. **Task 3: Verify prompts utils already migrated** - `a833a4e` (verify)
4. **Task 4: Test file updates + verification** - `5300f14` (test)

## Files Modified

| File | Changes |
|------|---------|
| switch.ts | chalk imports → colors, formatters, separator; 12 chalk calls replaced |
| config.ts | chalk imports → colors, formatters, separator; 18 chalk calls replaced |
| current.ts | chalk imports → colors, formatters; 8 chalk calls replaced |
| list.ts | chalk imports → colors; 1 chalk call replaced |
| undo.ts | chalk imports → colors, formatters; 8 chalk calls replaced |
| select-template.ts | chalk imports → colors; 2 chalk calls replaced |
| confirm-action.ts | chalk imports → colors; 8 chalk calls replaced |
| select-directory.ts | chalk imports → colors; 3 chalk calls replaced |
| input-api-key.ts | chalk imports → colors, formatters, separator; 4 chalk calls replaced |
| select-api-config.ts | chalk imports → colors; 2 chalk calls replaced |
| config.test.ts | Removed unused chalk import; updated test name |
| select-api-config.test.ts | chalk mock → colors mock; updated test |
| diff-render.test.ts | Removed unused chalk import |

## Deviations from Plan

### Task 03: Files Not Found/Already Migrated

**Files listed in plan that don't exist or already migrated:**
- `src/cli/prompts/utils/cancel.ts` - File does not exist; `handle-cancel.ts` exists and has no chalk import
- `src/cli/prompts/select.ts` - File does not exist
- `src/cli/prompts/utils/format-choices.ts` - Already migrated to theme module (colors import)
- `src/cli/prompts/utils/autocomplete.ts` - No chalk import (uses Fuse.js only)

**Resolution:** Committed verification commit documenting these files already migrated or non-existent.

### Task 04: Chalk Uninstall Deferred

**Issue:** Chalk cannot be uninstalled due to remaining imports outside plan scope.

**Files with remaining chalk imports (not in plan scope):**
- `src/cli/commands/export.ts`
- `src/cli/commands/import.ts`
- `src/cli/commands/register.ts`
- `src/cli/commands/scan.ts`
- `src/cli/prompts/wizards/config-wizard.ts`
- `src/cli/prompts/wizards/main-wizard.ts`
- `src/cli/prompts/wizards/scan-wizard.ts`
- `src/cli/prompts/wizards/switch-wizard.ts`

**Resolution:** chalk uninstall deferred to future plan(s) that will migrate remaining 8 files. Plan scope was limited to 16 files per frontmatter `files_modified`.

**Acceptance Criteria Status:**
- `grep -r "from 'chalk'" src/cli/commands/` - NOT empty (4 additional files remain)
- `grep -r "from 'chalk'" src/cli/prompts/components/` - Empty ✓
- `npx tsc --noEmit` - Pre-existing errors unrelated to chalk migration
- `npx vitest run` - 827 tests passing ✓

## Deferred Items

| Category | Item | Status | Deferred At |
|----------|------|--------|-------------|
| chalk-migration | export.ts, import.ts, register.ts, scan.ts commands | Future plan | 2026-05-08 |
| chalk-migration | 4 wizard files (config, main, scan, switch) | Future plan | 2026-05-08 |
| chalk-uninstall | npm uninstall chalk | Blocked | 2026-05-08 |

## Self-Check: PASSED

- All 4 commits exist in git log ✓
- All modified files exist ✓
- Tests passing (827 tests) ✓