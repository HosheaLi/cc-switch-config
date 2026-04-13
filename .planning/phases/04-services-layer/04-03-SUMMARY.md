---
phase: 04-services-layer
plan: 03
subsystem: services
tags: [project-management, directory-scanning, tdd, D-04, D-05]
requires: [04-01]
provides: [ProjectService class, AppState scanDirectories extension]
affects: [ui-layer]
tech_stack:
  added: [ProjectService]
  patterns: [constructor injection, ServiceError, directory recursion]
key_files:
  created:
    - src/lib/services/project-service.ts
  modified:
    - src/lib/services/project-service.test.ts
    - src/lib/store/project.ts
    - src/lib/store/state.ts
decisions:
  - D-01: Services as classes + constructor injection
  - D-02: Services throw Error (caller handles)
  - D-04: Auto scan user-configured roots + manual confirm
  - D-05: Scan directories stored in AppState
  - F4: ProjectService handles project index and CRUD
metrics:
  duration: "3m"
  tasks: 2
  files: 4
  tests: 48 (state: 20, project-service: 28)
  started: "2026-04-13T16:04:00Z"
  completed: "2026-04-13T16:09:30Z"
---

# Phase 04 Plan 03: ProjectService - Project Management

ProjectService class with project detection (D-04), registration, listing (F4), and management operations. AppState extended with scanDirectories field (D-05).

## One-Liner

Implemented ProjectService class with directory scanning, CRUD operations, and scan directories management via AppState; fixed shared DEFAULT_DATA bug in ProjectIndex for proper test isolation.

## Decisions Made

| Decision | Choice | Rationale |
|----------|--------|-----------|
| ProjectService structure | Class with constructor injection | Per D-01: Services as classes |
| Error handling | Throw ServiceError | Per D-02: Services throw, caller handles |
| Directory scanning | Recursive walk with maxDepth=3 | Per D-04: Auto scan with depth limit |
| Scan directories storage | AppState.scanDirectories | Per D-05: User-configured roots |
| DEFAULT_DATA fix | Function returning fresh object | Bug fix: shared constant caused test pollution |

## Implementation Details

### Task 1: AppState scanDirectories Extension (D-05)

Extended `AppStateData` interface with `scanDirectories: string[]` field for user-configured scan roots. Added default value `[]` (empty array) to `DEFAULT_STATE`.

### Task 2: ProjectService Implementation

Created `ProjectService` class with:
- **Constructor injection**: Accepts `ProjectIndex` and `AppState` per D-01
- **scanProjects**: Recursive directory scan with configurable `maxDepth` (default 3)
  - Finds `.claude/settings.json` directories
  - Skips `node_modules` and hidden directories (`.git`, `.hidden`)
  - Marks results as `isNew` based on registration status
- **CRUD operations**: `registerProject`, `listProjects`, `getProjectByPath`, `getProjectById`, `updateProject`, `removeProject`
- **scanDirectories management**: `getScanDirectories`, `addScanDirectory`, `removeScanDirectory` via AppState

### Bug Fix: Shared DEFAULT_DATA

Fixed critical bug in `ProjectIndex` where `DEFAULT_DATA` constant was shared across all instances. When file didn't exist, `load()` returned the shared object, causing all `register()` calls to pollute the same `projects` and `pathIndex` objects. Fixed by replacing constant with `createDefaultData()` function that returns fresh objects.

## Test Results

```
 ✓ src/lib/store/state.test.ts (20 tests) 653ms
 ✓ src/lib/services/project-service.test.ts (28 tests) 724ms

 Test Files  2 passed (2)
      Tests  48 passed (48)
```

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed shared DEFAULT_DATA bug in ProjectIndex**
- **Found during:** Task 2 test execution
- **Issue:** `DEFAULT_DATA` constant was shared across all `ProjectIndex` instances. When `load()` returned `DEFAULT_DATA` (file not found), all instances modified the same `projects` and `pathIndex` objects.
- **Fix:** Replaced `const DEFAULT_DATA` with `function createDefaultData()` that returns fresh objects.
- **Files modified:** `src/lib/store/project.ts`
- **Commit:** 9e05bb8

## Commits

| Hash | Message |
|------|---------|
| f184256 | feat(04-03): extend AppState with scanDirectories field (D-05) |
| 9e05bb8 | feat(04-03): implement ProjectService with project management |

## Files Modified

| File | Action | Purpose |
|------|--------|---------|
| src/lib/store/state.ts | modified | D-05: scanDirectories field in AppStateData |
| src/lib/services/project-service.ts | created | ProjectService class (254 lines) |
| src/lib/services/project-service.test.ts | modified | 28 tests for ProjectService |
| src/lib/store/project.ts | modified | Bug fix: createDefaultData() |

## Self-Check: PASSED

- [x] AppStateData has scanDirectories: string[] field (line 36)
- [x] DEFAULT_STATE has scanDirectories: [] (line 51)
- [x] ProjectService class exists at src/lib/services/project-service.ts (254 lines)
- [x] ProjectService constructor accepts ProjectIndex + AppState
- [x] scanProjects method has maxDepth parameter and depth limit logic
- [x] scanProjects skips node_modules and hidden dirs
- [x] listProjects returns ProjectEntry[]
- [x] ServiceError thrown on register failure
- [x] 48 tests pass
- [x] Commit f184256 exists
- [x] Commit 9e05bb8 exists

---

*Summary created: 2026-04-13T16:09:30Z*