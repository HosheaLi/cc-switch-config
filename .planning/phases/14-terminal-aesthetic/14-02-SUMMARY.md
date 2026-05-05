---
phase: 14-terminal-aesthetic
plan: 02
subsystem: ui
tags: [picocolors, ansi, truecolor, terminal-detection, borders, tdd, vitest]

# Dependency graph
requires:
  - phase: 14-01
    provides: "picocolors installed, test scaffolds, src/cli/theme/ directory"
provides:
  - "Terminal capability detection (detectColorSupport, colorSupport singleton)"
  - "OpenCode palette colors via truecolor ANSI codes (#201d1d/#fdfcfc/#9a9898)"
  - "Apple HIG semantic color functions (accent/danger/success/warning)"
  - "createColors() factory for terminal-aware color functions"
  - "Unicode/ASCII border character sets with getBorders() selection"
affects: [14-03, 14-04]

# Tech tracking
tech-stack:
  added: []
  patterns: [tdd-red-green-cycle, terminal-capability-detection, createColors-factory, border-ascii-fallback]

key-files:
  created:
    - src/cli/theme/detection.ts
    - src/cli/theme/colors.ts
    - src/cli/theme/borders.ts
  modified:
    - src/cli/theme/detection.test.ts
    - src/cli/theme/colors.test.ts
    - src/cli/theme/borders.test.ts

key-decisions:
  - "Clean env per test (not spreading originalEnv) to avoid host environment leaking into detection tests"
  - "createColors() factory pattern enables testing with custom ColorSupport without env mocking"

patterns-established:
  - "TDD per module: RED (failing tests) → GREEN (implementation) → commit"
  - "Terminal detection: NO_COLOR → FORCE_COLOR → WT_SESSION → COLORTERM → TERM_PROGRAM → platform → default"
  - "Color factory: createColors(support) returns color functions that respect enabled/truecolor flags"
  - "Border selection: Unicode for modern terminals, ASCII for Windows CMD (per D-11)"

requirements-completed: [UI-01, UI-04, UI-05, UI-06]

# Metrics
duration: 9min
completed: 2026-05-05
---

# Phase 14 Plan 02: Core Theme Components Summary

**Terminal detection, OpenCode palette truecolor colors with picocolors semantic colors, and Unicode/ASCII border selection -- all 24 tests passing via TDD**

## Performance

- **Duration:** 9 min
- **Started:** 2026-05-05T15:24:43Z
- **Completed:** 2026-05-05T15:33:46Z
- **Tasks:** 3
- **Files modified:** 6 (3 created, 3 modified)

## Accomplishments
- Terminal detection module with NO_COLOR/FORCE_COLOR/WT_SESSION/COLORTERM/TERM_PROGRAM/platform checks (8 tests)
- OpenCode palette with truecolor ANSI codes and picocolors-based semantic colors (8 tests)
- Border characters with Unicode box-drawing and ASCII fallback for Windows CMD (8 tests)
- All 24 tests passing across 3 modules

## Task Commits

Each task was committed atomically:

1. **Task 1: Implement terminal detection module** - `d397787` (feat)
2. **Task 2: Implement colors module with OpenCode palette and semantic colors** - `20d43e4` (feat)
3. **Task 3: Implement border characters module** - `85e78ce` (feat)

_Note: All 3 tasks followed TDD RED/GREEN cycle (test file written first, failing, then implementation, then passing)_

## Files Created/Modified
- `src/cli/theme/detection.ts` - Terminal capability detection (ColorSupport interface, detectColorSupport, colorSupport singleton)
- `src/cli/theme/colors.ts` - OpenCode palette ANSI codes, createColors factory, colors singleton with semantic colors
- `src/cli/theme/borders.ts` - BORDERS constant (unicode/ascii), getBorders() selection function
- `src/cli/theme/detection.test.ts` - 8 tests: NO_COLOR, FORCE_COLOR, WT_SESSION, COLORTERM, iTerm2, Apple_Terminal, Windows CMD, singleton export
- `src/cli/theme/colors.test.ts` - 8 tests: OPENCODE_PALETTE codes, semantic colors, palette colors, modifiers, NO_COLOR handling, truecolor/gray fallback
- `src/cli/theme/borders.test.ts` - 8 tests: Unicode chars, ASCII chars, single-char validation, WT_SESSION/COLORTERM/iTerm2/Windows CMD/macOS selection

## Decisions Made
- Used clean env objects per test instead of spreading `originalEnv` -- host environment variables (e.g., `COLORTERM=truecolor`) leaked into tests causing false positives
- `createColors()` factory pattern enables testing color behavior with custom `ColorSupport` without environment variable mocking
- Tests stub `process` globally via `vi.stubGlobal('process', ...)` with clean `env: {}` and preserved `platform`

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed environment variable leakage in detection tests**
- **Found during:** Task 1 (terminal detection module)
- **Issue:** Tests used `process.env = { ...originalEnv, ... }` which spread host environment variables (like `COLORTERM=truecolor`) into test env, causing macOS Terminal and Windows CMD tests to fail (truecolor was `true` instead of `false`)
- **Fix:** Changed test setup to use clean `process.env = { NO_COLOR: '1' }` etc. without spreading originalEnv
- **Files modified:** src/cli/theme/detection.test.ts
- **Verification:** All 8 detection tests pass with isolated env
- **Committed in:** d397787 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Minor fix for test isolation. No scope creep.

## Issues Encountered
- Host environment `COLORTERM=truecolor` leaked into tests via `originalEnv` spread -- resolved by using clean env objects per test

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- detection.ts, colors.ts, borders.ts ready for consumption by Wave 2+ (formatters, theme index, consumer modules)
- 14-03-PLAN.md (Wave 2) can import from these modules for formatter and theme integration
- 14-04-PLAN.md (Wave 3) can wire theme into output modules (table, error, diff-render)

## Self-Check: PASSED

All claimed files verified present. All commit hashes verified in git log. 24/24 tests passing.

---
*Phase: 14-terminal-aesthetic*
*Completed: 2026-05-05*
