---
phase: 15-ink-removal
plan: 01
subsystem: tui
tags: [typescript, theme, imports, picocolors, formatters]

# Dependency graph
requires:
  - phase: 14-terminal-aesthetic
    provides: src/cli/theme/ module (colors, formatters, detection, borders)
provides:
  - Fixed theme imports in 4 wizard files and barrel export
  - All TS2307 errors for theme.js resolved
affects: [15-ink-removal, tui-wizards]

# Tech tracking
tech-stack:
  added: []
  patterns: [formatters namespace import from theme module, separator aliased as themeSeparator]

key-files:
  created: []
  modified:
    - src/cli/prompts/wizards/config-wizard.ts
    - src/cli/prompts/wizards/main-wizard.ts
    - src/cli/prompts/wizards/switch-wizard.ts
    - src/cli/prompts/wizards/scan-wizard.ts
    - src/cli/prompts/utils/index.ts

key-decisions:
  - "Import separator as themeSeparator to avoid name collision with any local separator function"
  - "Remove chalk.level=0 dead code from main-wizard.ts; NO_COLOR detection centralized in theme/detection.ts"

patterns-established:
  - "formatters namespace import: import { formatters, separator as themeSeparator } from '../../theme/index.js'"

requirements-completed: [TUI-06]

# Metrics
duration: 10min
completed: 2026-05-08
---

# Phase 15 Plan 01: Fix Broken Theme Imports Summary

**Replaced 4 broken `../utils/theme.js` imports with `../../theme/index.js` formatters and removed dead barrel re-export, resolving all TS2307 compilation errors**

## Performance

- **Duration:** 10 min
- **Started:** 2026-05-08T01:31:26Z
- **Completed:** 2026-05-08T01:41:33Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Fixed all 4 wizard files to import from the new `src/cli/theme/` module instead of deleted `src/cli/prompts/utils/theme.js`
- Replaced `styleSuccess/styleError/styleWarning` calls with `formatters.success/error/warning` namespace pattern
- Removed `chalk.level = 0` dead code from `main-wizard.ts` (NO_COLOR handled centrally by `detection.ts`)
- Removed broken `export * from './theme.js'` from `src/cli/prompts/utils/index.ts` barrel
- All 1159 tests passing, zero TS2307 theme-related errors

## Task Commits

Each task was committed atomically:

1. **Task 1: Update 4 wizard files to import from theme module** - `ad478a7` (fix)
2. **Task 2: Fix barrel export in prompts/utils/index.ts** - `7375285` (fix)

## Files Created/Modified
- `src/cli/prompts/wizards/config-wizard.ts` - Replaced theme imports, styleSuccess/Error/Warning -> formatters, separator -> themeSeparator
- `src/cli/prompts/wizards/main-wizard.ts` - Same replacements + removed chalk.level=0 dead code
- `src/cli/prompts/wizards/switch-wizard.ts` - Replaced theme imports (no separator usage)
- `src/cli/prompts/wizards/scan-wizard.ts` - Replaced theme imports, separator -> themeSeparator
- `src/cli/prompts/utils/index.ts` - Removed broken `export * from './theme.js'`

## Decisions Made
- Imported `separator as themeSeparator` to avoid any potential name collision with local variables
- Removed `chalk.level = 0` dead code as NO_COLOR handling is centralized in `src/cli/theme/detection.ts`

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- The `replace_all` approach for `separator` -> `themeSeparator` in config-wizard.ts and main-wizard.ts accidentally produced `themeSeparator as themeSeparator` in the import line (because the import already contained `separator` which matched the replacement). Fixed by manually correcting the import to `separator as themeSeparator`.
- scan-wizard.ts had `separator()` calls in the function body that needed manual replacement since the import line was already changed.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- TypeScript compilation no longer blocked by theme.js TS2307 errors
- All wizard files now consistently use `src/cli/theme/` module
- Ready for subsequent Phase 15 plans (chalk removal from wizard files, Ink component cleanup)

---
*Phase: 15-ink-removal*
*Completed: 2026-05-08*

## Self-Check: PASSED

All 5 modified files verified present. Both task commits (ad478a7, 7375285) verified in git log.
