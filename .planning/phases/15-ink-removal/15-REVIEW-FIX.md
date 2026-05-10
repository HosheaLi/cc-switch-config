---
phase: 15-ink-removal
fixed_at: 2026-05-10T20:00:00.000Z
review_path: .planning/phases/15-ink-removal/15-REVIEW.md
iteration: 1
findings_in_scope: 5
fixed: 5
skipped: 0
status: all_fixed
---

# Phase 15: Code Review Fix Report

**Fixed at:** 2026-05-10T20:00:00.000Z
**Source review:** .planning/phases/15-ink-removal/15-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 5
- Fixed: 5
- Skipped: 0

## Fixed Issues

### WR-01: NaN from parseInt when `--depth` is non-numeric

**Files modified:** `src/cli/commands/scan.ts`
**Commit:** e2032ef
**Applied fix:** Changed `const depth` to `let depth` and added isNaN/depth < 1 validation after parseInt, falling back to default depth of 3 with a warning message.

### WR-02: `process.env.HOME` fallback creates path starting with "undefined"

**Files modified:** `src/cli/commands/register.ts`
**Commit:** e26c954
**Applied fix:** Added explicit check for `process.env.HOME` before path.join. When HOME is not set, prints a clear error message and exits with `ExitCodes.MISUSE` instead of silently constructing a path starting with "undefined".

### WR-03: Unused filter logic in `quickSelectScanDirectory`

**Files modified:** `src/cli/prompts/components/select-directory.ts`
**Commit:** b9a582c
**Applied fix:** Replaced the stub `return true;` in the filter callback with `return fs.existsSync(dir);` to actually check whether each common directory exists before including it in the valid list.

### WR-04: Unhandled error during watcher `start()` can cause 5-second hang

**Files modified:** `src/lib/store/watcher.ts`
**Commit:** 92636ea
**Applied fix:** Added an error handler using `this.watcher.once('error', ...)` inside the promise that clears the timeout and calls `reject()`. If chokidar emits an error event before 'ready', the promise now rejects immediately instead of hanging for the full 5-second timeout.

### WR-05: Missing validation for `--strategy` option value

**Files modified:** `src/cli/commands/import.ts`
**Commit:** 7c8e9af
**Applied fix:** Added a `VALID_STRATEGIES` array and upfront validation of the strategy option value. If an invalid strategy is provided, prints an error listing allowed values (merge, overwrite, skip) and exits with `ExitCodes.MISUSE`.

## Skipped Issues

None -- all findings were fixed.

---

_Fixed: 2026-05-10T20:00:00.000Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
