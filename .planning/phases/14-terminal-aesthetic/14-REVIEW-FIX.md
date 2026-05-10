---
phase: 14-terminal-aesthetic
fixed_at: '2026-05-10T16:00:00Z'
review_path: .planning/phases/14-terminal-aesthetic/14-REVIEW.md
iteration: 1
findings_in_scope: 5
fixed: 5
skipped: 0
status: all_fixed
---

# Phase 14: Code Review Fix Report

**Fixed at:** 2026-05-10T16:00:00Z
**Source review:** .planning/phases/14-terminal-aesthetic/14-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 5 (all warnings)
- Fixed: 5
- Skipped: 0

## Fixed Issues

### WR-01: Undo Command partial parameter support causes runtime crash

**Files modified:** `src/cli/commands/undo.ts`
**Commit:** `2b036ef`
**Applied fix:** Changed the conditional logic from `(!appState || !projectIndex)` to `(appState === undefined && projectIndex === undefined)` to make the parameters mutually exclusive (both or neither). Replaced non-null assertion (`defaultSvc!`) with optional chaining (`defaultSvc?.`) and fallback to `new AppState()` / `new ProjectIndex()` for defensive null handling.

### WR-02: Migration backup strategy loses single rollback point

**Files modified:** `src/lib/store/api-config.ts`, `src/lib/store/migration.ts`
**Commit:** `f9cdf91`
**Applied fix:** Added `setBatch()` method to `ApiConfigStore` that performs a single backup before all writes and a single atomic save, preventing per-item backup overwrite. Modified the migration loop in `migration.ts` to collect all valid configs in memory and write them in a single batch call via `setBatch()`.

### WR-03: Unreachable code after process.exit() in multiple commands

**Files modified:** `src/cli/commands/undo.ts`, `src/cli/commands/unregister.ts`
**Commit:** `f4e51f3`
**Applied fix:** Removed unreachable `return;` statements that followed `process.exit()` calls in `undo.ts` (line 51) and `unregister.ts` (line 49).
**Notes:** The review also cited `register.ts:67-68` and `current.ts:42,54-55`, but the current code at those locations does not contain unreachable code after `process.exit()` -- the code context differs from the review. No changes were needed for those files.

### WR-04: Missing default case in diff render switch statement

**Files modified:** `src/cli/utils/diff-render.ts`
**Commit:** `932ae8a`
**Applied fix:** Added a `default` case to the switch statement with an exhaustiveness check (`const _exhaustive: never = line`) and a muted fallback output for unknown diff line types.

### WR-05: NO_COLOR check violates spec (empty string should disable colors)

**Files modified:** `src/cli/theme/detection.ts`
**Commit:** `281c29d`
**Applied fix:** Changed the NO_COLOR check from `env.NO_COLOR && env.NO_COLOR !== ''` to `env.NO_COLOR !== undefined`. Per the official NO_COLOR spec, colors should be disabled whenever the variable is present, regardless of its value. `NO_COLOR=""` now correctly disables colors.

---

_Fixed: 2026-05-10T16:00:00Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
