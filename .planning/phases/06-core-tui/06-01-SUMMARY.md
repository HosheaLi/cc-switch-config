---
phase: 06-core-tui
plan: 01
subsystem: ui
tags: [ink, react, tui, hooks, fuse.js, vitest, tsx]

# Dependency graph
requires:
  - phase: 05-cli-interface
    provides: CLI foundation, TUI stubs in tui-launch.ts
provides:
  - TUI hook infrastructure (useKeyInput, useNavigation, useFuzzySearch)
  - Vitest configured for .tsx Ink component tests
  - Barrel exports for hooks and TUI module
affects: [06-02, 06-03, 06-04, 06-05, 06-06]

# Tech tracking
tech-stack:
  added: [ink-testing-library@4.0.0, fuse.js@7.3.0, ink-select-input@6.2.0, ink-text-input@6.0.0, ink-spinner@5.0.0, ink-confirm-input@2.0.0]
  patterns: [TDD with ink-testing-library, mocked useInput pattern, React hooks for TUI navigation, fuse.js fuzzy search]

key-files:
  created:
    - src/tui/hooks/useKeyInput.ts
    - src/tui/hooks/useNavigation.ts
    - src/tui/hooks/useFuzzySearch.ts
    - src/tui/hooks/index.ts
    - src/tui/index.ts
  modified:
    - package.json
    - vitest.config.ts

key-decisions:
  - "ink-testing-library for TDD testing of Ink components"
  - "fuse.js threshold 0.4 for balanced precision/recall in fuzzy search"
  - "Dual-mode navigation via useKeyInput (arrows + vim j/k)"
  - "Stack-based navigation via useNavigation for screen transitions"
  - "Barrel exports per M4 constitutional requirement"

patterns-established:
  - "TDD pattern: Mock useInput with vi.mock('ink'), capture handler, simulate key presses"
  - "Hook pattern: useMemo for fuse.js instance creation, memoized search results"
  - "Export pattern: src/tui/hooks/index.ts barrel, src/tui/index.ts root barrel"

requirements-completed: [F14, U3, D-05, D-02]

# Metrics
duration: 6min
completed: 2026-04-14
---
# Phase 06 Plan 01: Wave 0 Foundation Summary

**TUI hook infrastructure with dual-mode navigation, screen stack management, and fuzzy search - vitest configured for .tsx Ink tests**

## Performance

- **Duration:** 6m 21s
- **Started:** 2026-04-14T10:29:44Z
- **Completed:** 2026-04-14T10:36:05Z
- **Tasks:** 5
- **Files modified:** 7 (created: 5, modified: 2)

## Accomplishments
- Installed TUI dependencies (ink-testing-library, fuse.js, ink ecosystem packages)
- Configured vitest for .tsx test files enabling Ink component TDD
- Implemented useKeyInput hook with dual-mode navigation (arrows + vim j/k)
- Implemented useNavigation hook with stack-based screen management
- Implemented useFuzzySearch hook with fuse.js threshold 0.4
- Created barrel exports for hooks and TUI module (M4 constitutional requirement)

## Task Commits

Each task was committed atomically:

1. **Task 1: Install TUI dependencies and configure vitest** - `9df619e` (feat)
2. **Task 2: Implement useKeyInput hook** - `c239d5e` (feat)
3. **Task 3: Implement useNavigation hook** - `7c134f9` (feat)
4. **Task 4: Implement useFuzzySearch hook** - `acb6f89` (feat)
5. **Task 5: Create barrel exports** - `8ff98f5` (feat)

**Plan metadata:** (pending final commit)

_Note: All TDD tasks followed RED (create failing test) -> GREEN (implement to pass) -> verify flow_

## Files Created/Modified
- `package.json` - Added TUI dependencies (ink-testing-library@4.0.0 devDep, fuse.js@7.3.0, ink-select-input@6.2.0, ink-text-input@6.0.0, ink-spinner@5.0.0, ink-confirm-input@2.0.0)
- `vitest.config.ts` - Added .tsx pattern to include array for Ink tests
- `src/tui/hooks/useKeyInput.ts` - Dual-mode navigation hook (arrows + j/k, escape, enter)
- `src/tui/hooks/useKeyInput.test.tsx` - 8 tests for key input handling
- `src/tui/hooks/useNavigation.ts` - Screen stack management (push/pop/reset, isRoot)
- `src/tui/hooks/useNavigation.test.tsx` - 10 tests for navigation stack
- `src/tui/hooks/useFuzzySearch.ts` - Fuzzy search hook using fuse.js
- `src/tui/hooks/useFuzzySearch.test.tsx` - 10 tests for fuzzy filtering
- `src/tui/hooks/index.ts` - Barrel export for hooks
- `src/tui/index.ts` - TUI root barrel export

## Decisions Made
- ink-testing-library for TDD testing (D-13) - Official Ink test utilities, handles async rendering
- fuse.js threshold 0.4 (D-06) - Balanced precision vs recall for fuzzy search
- Mocked useInput pattern - vi.mock('ink') to capture handler, simulate Key presses for testing
- Barrel exports per M4 - Constitutional requirement enforced

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- Pre-existing LoadingIndicator test failures (4 tests) - Out of scope for this plan, deferred to phase owner
- Pre-existing useDelayedLoading hook - Already implemented, tests pass (5 tests)
- Test file extension: Initially created .ts test file with JSX, renamed to .tsx for vitest support

## Deferred Items

**Pre-existing TUI files (out of scope for this plan):**
- `src/tui/components/LoadingIndicator.tsx` - Pre-existing component with 4 failing tests
- `src/tui/hooks/useDelayedLoading.ts` - Pre-existing hook (5 tests passing)
- These files existed before plan execution, not part of 06-01 scope

## Next Phase Readiness
- TUI hook infrastructure complete for Wave 0
- vitest configured for .tsx tests, ready for Ink screen component TDD
- All new tests pass (33 tests for hooks implemented in this plan)
- Ready for Wave 1 screen implementation (ProjectListScreen, etc.)

---
*Phase: 06-core-tui*
*Plan: 01*
*Completed: 2026-04-14*