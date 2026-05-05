---
phase: 14-terminal-aesthetic
plan: 04
subsystem: ui
tags: [picocolors, theme-integration, ansi-colors, terminal-output, chalk-removal, security]

# Dependency graph
requires:
  - phase: 14-03
    provides: "formatters, barrel export index.ts with 38 passing theme tests"
provides:
  - "table.ts using theme colors and border characters"
  - "error.ts using theme colors.danger for error output"
  - "diff-render.ts using theme semantic colors (muted/danger/success/warning)"
  - "format-choices.ts using theme semantic colors (success/muted/danger)"
  - "index.ts without chalk import or manual NO_COLOR handling"
  - "ANSI injection mitigation (stripAnsi) in table.ts and diff-render.ts (T-14-06, T-14-07)"
affects: [14-05, ink-removal-phase]

# Tech tracking
tech-stack:
  added: []
patterns: [theme-module-consumption, ansi-stripping-for-user-input, border-chars-from-theme, semantic-color-names]

key-files:
  created: []
  modified:
    - src/cli/output/table.ts
    - src/cli/output/error.ts
    - src/cli/utils/diff-render.ts
    - src/cli/prompts/utils/format-choices.ts
    - src/cli/index.ts
  deleted:
    - src/cli/prompts/utils/theme.ts

key-decisions:
  - "stripAnsi() added as local utility in table.ts and diff-render.ts for T-14-06/T-14-07 mitigation"
  - "Used colors.danger directly in error.ts instead of formatters.error() to preserve custom formatting ([code] prefix)"
  - "Table border characters sourced from getBorders() for Windows CMD ASCII fallback support"
  - "NO_COLOR handling fully centralized in theme module (removed manual chalk.level = 0 from index.ts)"

patterns-established:
  - "Consumer files import { colors, getBorders } from '../theme/index.js' (relative to location)"
  - "User input sanitized via stripAnsi() before passing to color functions"
  - "Semantic color names: accent=interactive, danger=errors/removals, success=active/additions, warning=pending/changes, muted=secondary"

requirements-completed: [UI-01, UI-02, UI-03, UI-04, UI-05, UI-06]

# Metrics
duration: 7min
completed: 2026-05-06
---

# Phase 14 Plan 04: Theme Integration Summary

**All CLI output consumers (table, error, diff-render, format-choices) migrated to unified theme module with ANSI injection mitigations -- chalk fully removed from plan-scope files**

## Performance

- **Duration:** 7 min
- **Started:** 2026-05-05T15:56:41Z
- **Completed:** 2026-05-06T00:03:50Z
- **Tasks:** 3
- **Files modified:** 5 (1 deleted)

## Accomplishments
- Replaced all chalk imports with theme module (colors, getBorders) in table.ts, error.ts, diff-render.ts, format-choices.ts
- Added ANSI injection mitigations (stripAnsi) for user-provided strings in table.ts (T-14-06) and diff-render.ts (T-14-07)
- Removed chalk import and manual NO_COLOR handling from CLI index.ts
- Deleted old prompts/utils/theme.ts (replaced by new src/cli/theme/ module)
- Table rendering now uses theme border characters for Windows CMD fallback support
- All 1159 project tests passing

## Task Commits

Each task was committed atomically:

1. **Task 1: Update table.ts and error.ts to use theme module** - `1cac26f` (feat)
2. **Task 2: Update diff-render.ts and format-choices.ts to use theme module** - `71a78c3` (feat)
3. **Task 3: Update CLI index.ts and remove old theme.ts** - `9a7a357` (feat)

## Files Created/Modified
- `src/cli/output/table.ts` - Theme-based table rendering with semantic colors and border chars from getBorders()
- `src/cli/output/error.ts` - Theme-based error output using colors.danger
- `src/cli/utils/diff-render.ts` - Theme-based diff rendering with semantic colors and stripAnsi for user input
- `src/cli/prompts/utils/format-choices.ts` - Theme-based choice formatting using semantic colors
- `src/cli/index.ts` - Removed chalk import and manual NO_COLOR handling
- `src/cli/prompts/utils/theme.ts` - Deleted (replaced by src/cli/theme/)

## Decisions Made
- Used colors.danger directly in error.ts instead of formatters.error() because error.ts has custom formatting patterns ([code] prefix, "Error:" prefix) that formatters.error() would override with its own symbol
- Added stripAnsi() as local const in each consumer file (table.ts, diff-render.ts) rather than exporting from theme module -- the sanitization is a consumer responsibility per threat model
- Table chars configured from getBorders() to support Windows CMD ASCII fallback (per D-11)
- NO_COLOR handling now exclusively in theme module's detection.ts, removing the manual chalk.level = 0 from index.ts

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Wave 3 integration complete for plan-scope output files
- Remaining CLI files with chalk imports (commands/*, wizards/*, components/*, tui-launch.ts) are out of this plan's scope -- they will be migrated in subsequent phases (likely Ink Removal phase)
- Theme module fully functional: 38 theme tests + 1159 total project tests passing
- diff-render.test.ts still imports chalk (test infrastructure, not consumer code) -- no action needed

## Known Stubs
None

## Self-Check: PASSED

All 5 modified files verified present. Old theme.ts confirmed deleted. All 3 commit hashes verified in git log (1cac26f, 71a78c3, 9a7a357). 96 scoped tests passing.

---
*Phase: 14-terminal-aesthetic*
*Completed: 2026-05-06*
