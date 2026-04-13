---
phase: 03-data-layer
plan: 03
subsystem: database
tags: [project-index, uuid, realpath, persistence, repository-pattern]

# Dependency graph
requires:
  - phase: 01-foundation-safety
    provides: readJSON/writeJSON, backup, XDG paths
  - phase: 02-types-validation
    provides: ValidationError class
provides:
  - ProjectIndex class for project metadata management
  - ProjectEntry/ProjectIndexData types
  - register/getByPath/getById/update/remove/getAll operations
affects: [project-management, template-store, config-repository]

# Tech tracking
tech-stack:
  added: []
  patterns: [UUID stable IDs, realpath normalization, pathIndex fast lookup, backup before write]

key-files:
  created:
    - src/lib/store/project.ts (ProjectIndex implementation, 289 lines)
    - src/lib/store/project.test.ts (17 tests, 258 lines)
  modified: []

key-decisions:
  - "UUID for stable project reference (survives path changes)"
  - "realpath normalization handles symlinks on macOS/Linux"
  - "pathIndex secondary index for fast path-based lookup"
  - "Backup before write operations for crash safety"
  - "Cache with clearCache() for explicit reload control"

patterns-established:
  - "Repository pattern: register/find/update/remove operations"
  - "Secondary index pattern: pathIndex for O(1) path lookup"
  - "Path normalization: fs.realpath for canonical paths"

requirements-completed: [DATA-03]

# Metrics
duration: 6min
completed: 2026-04-13
---
# Phase 03 Plan 03: ProjectIndex Summary

**ProjectIndex class managing project metadata with UUID stable IDs, realpath normalization, and pathIndex fast lookup**

## Performance

- **Duration:** 6 min
- **Started:** 2026-04-13T14:30:45Z
- **Completed:** 2026-04-13T14:36:31Z
- **Tasks:** 1 (TDD)
- **Files modified:** 2

## Accomplishments
- ProjectIndex class with full CRUD operations (register, getByPath, getById, update, remove, getAll)
- UUID for stable reference that survives path changes
- realpath normalization handles symlinks (macOS /var -> /private/var)
- pathIndex secondary index for O(1) path-based lookup
- Persistent storage in getDataDir()/projects.json
- 17 comprehensive tests covering all operations

## Task Commits

Each task was committed atomically:

1. **Task 1: Create ProjectIndex class** - TDD flow
   - `e734a34` (test) - RED: add failing tests for ProjectIndex
   - `a282297` (feat) - GREEN: implement ProjectIndex class

## Files Created/Modified
- `src/lib/store/project.ts` - ProjectIndex class with register/getByPath/getById/update/remove/getAll operations (289 lines)
- `src/lib/store/project.test.ts` - 17 tests for ProjectIndex functionality (258 lines)

## Decisions Made
- UUID for stable project reference (survives path changes, unlike path-based IDs)
- realpath normalization to handle symlinks (macOS /var -> /private/var)
- pathIndex as secondary index for fast O(1) path-based lookup (avoids scanning all projects)
- Backup before write operations (uses createBackup from phase 01)
- Cache with explicit clearCache() for reload control (not automatic on every read)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed macOS realpath resolves /var to /private/var**
- **Found during:** Task 1 (RED phase)
- **Issue:** Tests comparing testProjectDir (raw path) with entry.path (realpath resolved) failed because macOS resolves /var -> /private/var
- **Fix:** Updated tests to use fs.realpath(testProjectDir) for comparison, and testProjectsFile uses tempDirReal (realpath resolved)
- **Files modified:** src/lib/store/project.test.ts
- **Verification:** All 17 tests pass
- **Committed in:** a282297 (GREEN commit)

**2. [Rule 1 - Bug] Fixed timestamp comparison within same millisecond**
- **Found during:** Task 1 (GREEN phase)
- **Issue:** Test 7 expected lastModified to differ after update, but register and update happened within same millisecond
- **Fix:** Added 10ms delay between register and update in Test 7
- **Files modified:** src/lib/store/project.test.ts
- **Verification:** Test 7 passes
- **Committed in:** a282297 (GREEN commit)

---

**Total deviations:** 2 auto-fixed (both Rule 1 - Bug)
**Impact on plan:** Both fixes necessary for test correctness on macOS. No scope creep.

## Issues Encountered
- macOS realpath resolves /var/folders to /private/var/folders, requiring test path normalization
- Vitest shared state across describe blocks, requiring explicit file cleanup in beforeEach/afterEach

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- ProjectIndex ready for use by ConfigRepository, TemplateStore
- store/ directory established for future Repository implementations
- Pattern established: UUID + pathIndex + backup before write

---
*Phase: 03-data-layer*
*Completed: 2026-04-13*

## Self-Check: PASSED

- src/lib/store/project.ts: FOUND
- src/lib/store/project.test.ts: FOUND
- .planning/phases/03-data-layer/03-03-SUMMARY.md: FOUND
- e734a34 (test commit): FOUND
- a282297 (feat commit): FOUND