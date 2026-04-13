---
phase: 04-services-layer
plan: 02
subsystem: services
tags: [config-management, constructor-injection, tdd, deep-merge]
requires:
  - phase: 04-01
    provides: ServiceError class, test infrastructure for services
provides:
  - ConfigService class for Profile CRUD operations
  - Constructor injection pattern for services
  - Template application with deep merge
affects: [config-service, project-service, template-service]
tech_stack:
  added: [ConfigService]
  patterns: [Constructor injection, Service layer]
key_files:
  created:
    - src/lib/services/config-service.ts
  modified:
    - src/lib/services/config-service.test.ts
decisions:
  - D-01: Services as classes + constructor injection
  - D-02: Services throw ServiceError on failure (ValidationError passed through)
  - D-03: Template uses deepMergeConfig for application
metrics:
  duration: "3m46s"
  tasks: 1
  files: 2
  tests: 13 (all passing)
  started: "2026-04-13T15:56:36Z"
  completed: "2026-04-13T16:00:22Z"
requirements_completed: [F1]
---

# Phase 04 Plan 02: ConfigService - Profile CRUD Operations

ConfigService class implementing Profile CRUD with constructor injection (D-01), ServiceError handling (D-02), and deep merge template application (D-03).

## One-Liner

ConfigService class with constructor injection for readConfig/writeConfig functions, providing project config read/write/merge operations with ServiceError handling.

## Performance

- **Duration:** 3m46s
- **Started:** 2026-04-13T15:56:36Z
- **Completed:** 2026-04-13T16:00:22Z
- **Tasks:** 1
- **Files modified:** 2

## Accomplishments

- ConfigService class with constructor injection pattern (D-01)
- readProjectConfig returns ClaudeSettings or null
- writeProjectConfig validates and creates backup via injected repository
- mergeTemplateWithConfig uses deepMergeConfig (D-03)
- applyTemplate combines merge + write for template application
- ServiceError thrown on failures, ValidationError passed through (D-02)
- 13 comprehensive tests with real and mock repositories

## Task Commits

Each task was committed atomically (TDD pattern):

1. **Task 1: Implement ConfigService with TDD** - `d204fa8` (test) + `a272fc8` (feat)
   - RED: Write failing tests (converted Wave 0 stubs to real tests)
   - GREEN: Implement ConfigService class with all methods

## Files Created/Modified

- `src/lib/services/config-service.ts` - ConfigService class (165 lines)
  - Constructor injection: readConfigFn, writeConfigFn
  - readProjectConfig, writeProjectConfig, mergeTemplateWithConfig, applyTemplate
- `src/lib/services/config-service.test.ts` - ConfigService tests (13 tests)
  - Tests for read, write, merge, apply, constructor injection
  - Tests with real and mock repository functions

## Decisions Made

| Decision | Choice | Rationale |
|----------|--------|-----------|
| ServiceError vs ValidationError | Let ValidationError pass through | Caller needs validation details, don't wrap |
| Backup directory | Use injected writeConfig behavior | Backup created by repository, not service |
| Template provider mapping | Map provider.env to ClaudeSettings.env | Primary use case, other fields handled later |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] ValidationError wrapped in ServiceError**
- **Found during:** Task 1 (Test: should throw ValidationError on invalid config)
- **Issue:** ServiceError wrapping ValidationError prevented caller from getting validation details
- **Fix:** Check for ValidationError instance and pass through without wrapping
- **Files modified:** src/lib/services/config-service.ts
- **Verification:** Test passes - ValidationError thrown directly
- **Committed in:** a272fc8 (Task 1 feat commit)

**2. [Rule 3 - Blocking] Backup directory path mismatch in tests**
- **Found during:** Task 1 (Test: should create backup before overwrite)
- **Issue:** Test expected backup in `<tempDir>/.backups/` but actual path is `<tempDir>/.claude/.backups/`
- **Fix:** Updated test to check correct backup directory (same directory as config file)
- **Files modified:** src/lib/services/config-service.test.ts
- **Verification:** Both backup tests pass
- **Committed in:** a272fc8 (Task 1 feat commit)

---

**Total deviations:** 2 auto-fixed (1 bug, 1 blocking)
**Impact on plan:** Both fixes essential for correctness. No scope creep.

## Issues Encountered

None - TDD workflow worked smoothly. Tests revealed issues early, fixed during implementation.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- ConfigService ready for use by ProjectService and TemplateService
- Constructor injection pattern established for all services
- Deep merge pattern confirmed for template application
- ServiceError handling pattern refined (ValidationError passthrough)

## Self-Check: PASSED

- [x] ConfigService class exists at src/lib/services/config-service.ts (165 lines)
- [x] Constructor injection with readConfig/writeConfig functions
- [x] All 13 tests pass
- [x] ServiceError thrown on failures (CONFIG_READ_FAILED, CONFIG_WRITE_FAILED)
- [x] ValidationError passed through without wrapping
- [x] deepMergeConfig used for template application (D-03)
- [x] Commit d204fa8 exists (test)
- [x] Commit a272fc8 exists (feat)

---

*Summary created: 2026-04-13T16:00:22Z*
*Phase: 04-services-layer*