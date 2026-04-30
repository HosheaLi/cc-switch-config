---
phase: 10-config-service
plan: 02
subsystem: config
security_review: true
tags: [api-config, crud, atomic-write, backup, service-layer, tdd]

# Dependency graph
requires:
  - phase: 10-01
    provides: ApiConfig type, ApiConfigSchema, replaceEnvModel function
provides:
  - ApiConfigStore class with CRUD operations for global API configs
  - ApiService class for config management and project application
affects: [10-03, 10-04, CLI commands, switch flow]

# Tech tracking
tech-stack:
  added: []
  patterns: [TDD RED-GREEN cycle, atomic write-rename, backup before modification, constructor injection]

key-files:
  created:
    - src/lib/store/api-config.ts
    - src/lib/store/api-config.test.ts
    - src/lib/services/api-service.ts
    - src/lib/services/api-service.test.ts
  modified:
    - src/lib/store/index.ts
    - src/lib/services/index.ts

key-decisions:
  - "ApiConfigStore follows TemplateStore pattern exactly (D-07/D-08)"
  - "ApiConfig file stored in getConfigDir() (cc-config-switch config dir)"
  - "Atomic write via writeJSON (R1/SEC-03)"
  - "Backup before modifications (R2/SEC-03)"
  - "ApiService uses replaceEnvModel for precise env/model replacement (CFG-02/D-13)"

patterns-established:
  - "Store pattern: load/save private methods, lazy loading, schema validation, timestamp management"
  - "Service pattern: constructor injection, ServiceError codes, CRUD + apply method"

requirements-completed: [CFG-01, SEC-03]

# Metrics
duration: 5min
completed: 2026-04-30
---

# Phase 10 Plan 02: API Config Store and Service Summary

**ApiConfigStore and ApiService implementing CRUD operations with atomic write safety and precise env/model replacement**

## Performance

- **Duration:** 4min 54s
- **Started:** 2026-04-30T11:25:05Z
- **Completed:** 2026-04-30T11:29:59Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- ApiConfigStore class with CRUD operations (getAll, get, set, delete, list)
- Schema validation against ApiConfigSchema (unified/granular modes)
- Atomic write pattern (R1) via writeJSON
- Backup before modifications (R2/SEC-03)
- ApiService class with CRUD and applyConfig method
- Precise env/model replacement via replaceEnvModel (CFG-02/D-13)
- 40 tests passing (22 store + 18 service)

## Task Commits

Each task was committed atomically following TDD:

1. **Task 1: ApiConfigStore class** - 2 commits (TDD RED-GREEN)
   - `b1da022` test(10-02): add failing tests for ApiConfigStore CRUD operations
   - `d1d51d5` feat(10-02): implement ApiConfigStore class with CRUD operations

2. **Task 2: ApiService class** - 2 commits (TDD RED-GREEN)
   - `10bf7dc` test(10-02): add failing tests for ApiService CRUD and apply operations
   - `443ac3f` feat(10-02): implement ApiService class for API config management

**Plan metadata:** (pending final commit)

_Note: TDD tasks have test commit first (RED), implementation commit second (GREEN)_

## Files Created/Modified
- `src/lib/store/api-config.ts` - ApiConfigStore class with CRUD operations
- `src/lib/store/api-config.test.ts` - 22 tests for ApiConfigStore
- `src/lib/services/api-service.ts` - ApiService class with CRUD and applyConfig
- `src/lib/services/api-service.test.ts` - 18 tests for ApiService
- `src/lib/store/index.ts` - Barrel export added for ApiConfigStore
- `src/lib/services/index.ts` - Barrel export added for ApiService

## Decisions Made
- ApiConfigStore stored in `getConfigDir()/api-configs.json` (cc-config-switch config dir, NOT ~/.claude/)
  - Note: Plan D-07 stated ~/.claude/ but getConfigDir() returns cc-config-switch paths (env-paths)
  - This is correct for app-owned config files (api-configs.json is not Claude's file)
- Followed TemplateStore pattern exactly for consistency with v1.0 architecture
- ApiService uses replaceEnvModel for precise field replacement (not deep merge)
- ServiceError codes: CONFIG_ALREADY_EXISTS, CONFIG_NOT_FOUND, CONFIG_CREATE_FAILED, CONFIG_UPDATE_FAILED, CONFIG_APPLY_FAILED

## Deviations from Plan

None - plan executed exactly as written. Both tasks followed TDD flow:
- RED: Created failing tests first
- GREEN: Implemented to pass all tests
- Tests verified acceptance criteria before commit

## Issues Encountered
None - smooth execution following established patterns from TemplateStore and TemplateService.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- ApiConfigStore ready for CLI commands (10-03, CLI-01)
- ApiService ready for switch flow integration (10-04, CFG-02)
- applyConfig method preserves permissions/hooks/mcpServers (CFG-02 verified)

## Security Analysis

### STRIDE Threat Model (from PLAN.md)

| Threat ID | Category | Component | Disposition | Mitigation | Status |
|-----------|----------|-----------|-------------|------------|--------|
| T-10-06 | Tampering | ApiConfigStore.set | mitigate | R1: Atomic writeJSON (temp file + rename) | Implemented |
| T-10-04 | Information Disclosure | api-configs.json file | accept | Recommend chmod 600 via validateTokenSecurity pattern | Deferred to Phase 15 |
| T-10-05 | Information Disclosure | api-configs.json in git | accept | Recommend .gitignore entry, checkGitTracking validates | Deferred to Phase 15 |

### Trust Boundaries

| Boundary | Description | Protection |
|----------|-------------|------------|
| Store -> Filesystem | Config persistence layer | Atomic write (R1) prevents partial corruption |
| Services -> Store | Service layer to data layer | ServiceError wrapping, no raw exceptions |

### Security Controls Implemented

- **Tampering Prevention (R1):** Atomic write-rename pattern via writeJSON prevents partial write corruption on crash
- **Backup System (R2):** createBackup before every modification enables recovery from mistakes
- **Schema Validation:** ApiConfigSchema.strict() rejects unknown fields, preventing injection via extra fields
- **Timestamp Management:** createdAt/updatedAt audit trail for config changes

### Deferred Security Items

- File permission chmod 600 recommendation deferred to Phase 15 (integration with existing validateTokenSecurity)
- .gitignore entry recommendation deferred to Phase 15 (integration with existing checkGitTracking pattern)

## TDD Gate Compliance

Verified in git log:
1. `test(...)` commit exists for Task 1 (RED gate)
2. `feat(...)` commit exists after it for Task 1 (GREEN gate)
3. `test(...)` commit exists for Task 2 (RED gate)
4. `feat(...)` commit exists after it for Task 2 (GREEN gate)

All TDD gates present - compliant execution.

---
*Phase: 10-config-service*
*Completed: 2026-04-30*

## Self-Check: PASSED

**Files verified:**
- FOUND: src/lib/store/api-config.ts
- FOUND: src/lib/store/api-config.test.ts
- FOUND: src/lib/services/api-service.ts
- FOUND: src/lib/services/api-service.test.ts

**Commits verified:**
- FOUND: b1da022 (test commit)
- FOUND: d1d51d5 (feat commit)
- FOUND: 10bf7dc (test commit)
- FOUND: 443ac3f (feat commit)

**Tests verified:**
- 40 tests passing (22 store + 18 service)