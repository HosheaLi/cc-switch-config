---
phase: 15-ink-removal
plan: 02
subsystem: tui-removal
tags: [ink, react, tui, deletion, npm-uninstall]

# Dependency graph
requires:
  - phase: 15-ink-removal
    provides: research confirming tui/ and Template* are dead code with full replacements
provides:
  - Complete removal of Ink/React TUI layer (38 files)
  - Removal of TemplateService/TemplateStore/template command source and tests
  - Removal of TemplateConfigSchema/TemplateStoreSchema/TemplateConfig/TemplateStore types
  - Uninstallation of 9 ink/react npm packages
  - Updated barrel exports excluding Template* re-exports
affects: [15-ink-removal-plan-03, consumer-migration]

# Tech tracking
tech-stack:
  added: []
  patterns: []

key-files:
  created: []
  modified:
    - src/lib/types/provider.ts (removed Template* schemas and types)
    - src/lib/types/provider.test.ts (removed Template* test cases)
    - src/lib/services/index.ts (removed TemplateService/TemplateConfig re-exports)
    - src/lib/store/index.ts (removed TemplateStore/TemplateStoreData re-exports)
    - package.json (removed 9 ink/react packages)

key-decisions:
  - "Deleted src/cli/m4-verification.test.ts alongside tui/ — it references deleted tui directory and tests now-invalid architectural boundaries"
  - "provider.test.ts trimmed to keep AuthType/ApiProviderConfig tests only — Template* test blocks removed"
  - "types/index.ts left unchanged — export * from provider.js automatically excludes deleted types"

patterns-established: []

requirements-completed: [TUI-06, CFG-06]

# Metrics
duration: 10min
completed: 2026-05-08
---

# Phase 15 Plan 02: Delete Ink TUI Layer Summary

**Atomically deleted src/tui/ (38 files), Template* source/test/types, and 9 npm packages -- codebase has zero Ink/React code remaining**

## Performance

- **Duration:** 10 min
- **Started:** 2026-05-08T01:45:35Z
- **Completed:** 2026-05-08T01:55:32Z
- **Tasks:** 4
- **Files modified:** 50+ (38 deleted in tui/, 6 Template* files deleted, 3 barrel files modified, 1 test modified, 1 npm uninstall)

## Accomplishments
- Completely removed src/tui/ directory (38 files: 7 screens, 6 components, 6 hooks, app, index, tests)
- Deleted all Template* source and test files (TemplateStore, TemplateService, template command)
- Removed TemplateConfigSchema, TemplateStoreSchema, TemplateConfig, TemplateStore from provider.ts
- Updated barrel exports (services/index.ts, store/index.ts) to remove Template* re-exports
- Uninstalled 9 npm packages: ink, ink-confirm-input, ink-select-input, ink-spinner, ink-text-input, react, @testing-library/react, @types/react, ink-testing-library
- Preserved fuse.js (used by prompts/autocomplete)

## Task Commits

Each task was committed atomically:

1. **Task 1: Delete src/tui/ directory entirely** - `8d7616e` (feat)
2. **Task 2: Delete Template* source and test files** - `ac05bf3` (feat)
3. **Task 3: Update barrel exports to remove Template* re-exports** - `c3d2966` (feat)
4. **Task 4: Uninstall 9 npm packages** - `092b027` (feat)

## Files Created/Modified
- `src/tui/` - Entire directory deleted (38 files)
- `src/cli/m4-verification.test.ts` - Deleted (referenced deleted tui/)
- `src/lib/store/template.ts` - Deleted (TemplateStore class)
- `src/lib/store/template.test.ts` - Deleted
- `src/lib/services/template-service.ts` - Deleted (TemplateService class)
- `src/lib/services/template-service.test.ts` - Deleted
- `src/cli/commands/template.ts` - Deleted (template command)
- `src/cli/commands/template.test.ts` - Deleted
- `src/lib/types/provider.ts` - Removed TemplateConfigSchema, TemplateStoreSchema, TemplateConfig, TemplateStore
- `src/lib/types/provider.test.ts` - Removed all Template* test cases
- `src/lib/services/index.ts` - Removed TemplateService and TemplateConfig re-exports
- `src/lib/store/index.ts` - Removed TemplateStore and TemplateStoreData re-exports
- `package.json` - Removed 9 ink/react packages

## Decisions Made
- Deleted src/cli/m4-verification.test.ts alongside tui/ directory since it tests architectural boundaries (CLI vs TUI separation) that no longer exist after tui/ removal
- Kept provider.test.ts AuthType and ApiProviderConfig test suites intact -- they are still valid
- types/index.ts uses `export * from './provider.js'` wildcard pattern -- no changes needed since deleted types are automatically excluded

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Deleted obsolete m4-verification.test.ts**
- **Found during:** Task 1 (Delete src/tui/ directory)
- **Issue:** src/cli/m4-verification.test.ts imports and references the deleted src/tui/ directory, testing CLI vs TUI separation boundaries. Post-deletion, this test references non-existent paths and validates meaningless constraints.
- **Fix:** Deleted the test file as it tests an architectural boundary (CLI vs TUI) that no longer exists
- **Files modified:** src/cli/m4-verification.test.ts (deleted)
- **Verification:** No remaining `from 'ink'` imports in src/ after deletion
- **Committed in:** 8d7616e (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Minimal -- the m4-verification.test.ts was a boundary enforcement test for a layer that no longer exists. Removal is correct.

## Issues Encountered
- npm uninstall produced peer dependency warnings during package removal -- expected behavior when removing interdependent packages, not an error

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Ink/React code completely removed from codebase
- Template* types and services deleted -- consumers (wizard, export-service, etc.) will have compilation errors, which is expected
- Plan 03 will handle consumer migration: updating imports from Template* to ApiConfig/ApiService/ApiConfigStore
- tsc --noEmit will fail until Plan 03 completes (expected)

## Self-Check: PASSED

- 15-02-SUMMARY.md: FOUND
- Task 01 commit (8d7616e): FOUND
- Task 02 commit (ac05bf3): FOUND
- Task 03 commit (c3d2966): FOUND
- Task 04 commit (092b027): FOUND

---
*Phase: 15-ink-removal*
*Completed: 2026-05-08*
