---
phase: 04-services-layer
plan: 01
subsystem: services
tags: [foundation, error-handling, tdd, wave-0]
requires: []
provides: [ServiceError class, test infrastructure for services]
affects: [config-service, project-service, template-service, provider-service]
tech_stack:
  added: [ServiceError]
  patterns: [Error extension, barrel export]
key_files:
  created:
    - src/lib/services/types.ts
    - src/lib/services/types.test.ts
    - src/lib/services/config-service.test.ts
    - src/lib/services/project-service.test.ts
    - src/lib/services/template-service.test.ts
    - src/lib/services/provider-service.test.ts
  modified: []
decisions:
  - D-02: Services throw Error (caller handles)
metrics:
  duration: "2m13s"
  tasks: 2
  files: 6
  tests: 79 (8 passing, 71 todo)
  started: "2026-04-13T15:51:25Z"
  completed: "2026-04-13T15:53:38Z"
---

# Phase 04 Plan 01: Services Foundation - ServiceError and Wave 0 Stubs

ServiceError class for error handling plus Nyquist Wave 0 test stubs enabling TDD workflow in subsequent plans.

## One-Liner

Created ServiceError class extending Error with code and context properties, plus 71 test stubs across 4 service test files for Wave 0 TDD foundation.

## Decisions Made

| Decision | Choice | Rationale |
|----------|--------|-----------|
| ServiceError structure | extends Error + code + optional context | Follows ValidationError pattern, enables categorization |
| Test stub pattern | it.todo() with descriptive names | Nyquist Wave 0 - immediate fail triggers Wave 1 implementation |
| Services directory | src/lib/services/ | New directory per D-07 barrel export requirement |

## Implementation Details

### ServiceError Class

Following ValidationError pattern from `src/lib/types/validation.ts`:
- Extends native Error class
- `name` property set to 'ServiceError'
- `code` property for error categorization (e.g., 'CONFIG_ERROR', 'NOT_FOUND')
- Optional `context` property for additional debugging data

### Wave 0 Test Stubs

Created test scaffolds for 4 services:
- **ConfigService** (15 stubs): read/write, merge, validate, apply
- **ProjectService** (20 stubs): scan, register, list, update, get, remove
- **TemplateService** (22 stubs): create, get, list, update, delete, apply
- **ProviderService** (14 stubs): testConnectivity, testProvider, batchTest

All stubs use `it.todo()` pattern and include temp directory setup/teardown.

## Test Results

```
 ✓ src/lib/services/types.test.ts (8 tests) 2ms
 ↓ src/lib/services/config-service.test.ts (15 tests | 15 skipped)
 ↓ src/lib/services/template-service.test.ts (22 tests | 22 skipped)
 ↓ src/lib/services/provider-service.test.ts (14 tests | 14 skipped)
 ↓ src/lib/services/project-service.test.ts (20 tests | 20 skipped)

 Test Files  1 passed | 4 skipped (5)
      Tests  8 passed | 71 todo (79)
```

## Commits

| Hash | Message |
|------|---------|
| c2e1144 | feat(04-01): implement ServiceError class for services layer |
| 7c80c92 | test(04-01): add Wave 0 test stubs for all services |

## Deviations from Plan

None - plan executed exactly as written.

## Files Modified

| File | Action | Purpose |
|------|--------|---------|
| src/lib/services/types.ts | created | ServiceError class definition |
| src/lib/services/types.test.ts | created | ServiceError unit tests (8 passing) |
| src/lib/services/config-service.test.ts | created | ConfigService Wave 0 stubs (15 todo) |
| src/lib/services/project-service.test.ts | created | ProjectService Wave 0 stubs (20 todo) |
| src/lib/services/template-service.test.ts | created | TemplateService Wave 0 stubs (22 todo) |
| src/lib/services/provider-service.test.ts | created | ProviderService Wave 0 stubs (14 todo) |

## Self-Check: PASSED

- [x] ServiceError class exists at src/lib/services/types.ts (44 lines)
- [x] types.test.ts passes all 8 tests
- [x] All 4 test stub files exist with describe blocks and it.todo() stubs
- [x] Commit c2e1144 exists
- [x] Commit 7c80c92 exists

---

*Summary created: 2026-04-13T15:53:38Z*