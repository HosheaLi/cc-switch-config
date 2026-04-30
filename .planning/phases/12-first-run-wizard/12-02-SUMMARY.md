---
plan: 12-02
phase: 12-first-run-wizard
status: complete
completed: 2026-04-30T23:07:00Z
requirements: [ONB-03]
---

# Plan 12-02: walkDirectory 并行重构

## Objective
Refactor walkDirectory from serial for-of to parallel Promise.all with independent error handling per subdirectory. Implement skip directory merging for ONB-04.

## What Was Built
- **getSkipDirectories helper** — Merges DEFAULT_SKIP_DIRS with user skipDirectories from AppState
- **Promise.all parallel scan** — walkDirectory now scans subdirectories in parallel instead of serial
- **Independent catch per subdirectory** — One failure does not block other directories from being scanned
- **Skip directory filtering** — DEFAULT_SKIP_DIRS entries (node_modules, .git, dist, build, target, .venv, __pycache__) are filtered

## Key Files

| File | Purpose |
|------|---------|
| src/lib/services/project-service.ts | walkDirectory refactored to Promise.all with skipDirs filtering |
| src/lib/services/project-service.test.ts | Tests for parallel scanning and skip directory filtering |

## Deviations
None. All acceptance criteria met.

## Tests
- 34 tests passed in project-service.test.ts
- New tests: parallel scanning, skip directories filtering

## Self-Check: PASSED

### Acceptance Criteria Verification
- [x] project-service.ts contains `import { DEFAULT_SKIP_DIRS }`
- [x] project-service.ts contains `getSkipDirectories()` method
- [x] project-service.ts walkDirectory contains `Promise.all`
- [x] project-service.ts walkDirectory contains independent `try/catch` inside Promise.all
- [x] project-service.ts walkDirectory uses `skipDirs.includes(e.name)` for filtering
- [x] `vitest run src/lib/services/project-service.test.ts` exits 0

## Notes
Per D-05, D-06, D-07, D-08, D-10 from RESEARCH.md:
- D-05: Promise.all for parallel subdirectory scanning
- D-06: Independent catch per subdirectory (partial failure continues)
- D-07: console.error log for failed directories
- D-08: DEFAULT_SKIP_DIRS for common build/dependency directories
- D-10: Merge DEFAULT_SKIP_DIRS with user skipDirectories