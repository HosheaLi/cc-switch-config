---
phase: 12-first-run-wizard
fixed_at: 2026-05-10T00:00:00Z
review_path: .planning/phases/12-first-run-wizard/12-REVIEW.md
iteration: 1
findings_in_scope: 5
fixed: 4
skipped: 1
status: partial
---

# Phase 12: Code Review Fix Report

**Fixed at:** 2026-05-10T00:00:00Z
**Source review:** .planning/phases/12-first-run-wizard/12-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 5
- Fixed: 4
- Skipped: 1

## Fixed Issues

### WR-02: Inconsistent Prompt Usage - Missing Cancel Handler

**Files modified:** `src/cli/commands/config.ts`
**Commit:** 88f8635
**Applied fix:** Replaced `prompts` default import with `promptWithCancel` import from `../prompts/utils/handle-cancel.js`. Changed the confirmation prompt in the `remove` command from direct `prompts()` call to `promptWithCancel<boolean>()`, with corresponding result access (`result.value` instead of `confirmed.value`).

### WR-03: Direct `prompts` Usage Bypassing Cancel Handler

**Files modified:** `src/cli/prompts/components/select-directory.ts`
**Commit:** 2113db8
**Applied fix:** Replaced `prompts()` call with inline `onCancel` in `selectMultipleDirectories` with `promptWithCancel<string[]>()`. Changed return from `result.directories ?? null` to `result.value ?? null`. Removed unused `prompts` default import (only `type { Choice }` remains).

### WR-04: Potential Interval Leak in Spinner

**Files modified:** `src/cli/utils/spinner.ts`, `src/cli/prompts/wizards/onboarding-wizard.ts`
**Commit:** d64d0f1
**Applied fix:** In `spinner.ts`: added `cleared` flag and shared `clear()` function with double-clear protection. `succeed`, `fail`, and `stop` now use the shared `clear()`. In `onboarding-wizard.ts`: wrapped the `createSpinner`/`scanProjects` usage in try-catch, calling `spinner.succeed()` on success and `spinner.fail()` on error (which triggers cleanup via `clear()`).

### WR-05: Incomplete Path Expansion Validation

**Files modified:** `src/cli/prompts/components/select-directory.ts`
**Commit:** 50b845d
**Applied fix:** Added `import os from 'os'`. Updated the `inputCustomDirectory` validation function to expand `~` prefix paths using `path.join(os.homedir(), trimmed.slice(1))` before running `fs.existsSync` and `fs.statSync` checks, instead of returning early with `true`.

## Skipped Issues

### WR-01: Dead Code in Directory Existence Check

**File:** `src/cli/prompts/components/select-directory.ts:161-168`
**Reason:** Already fixed in current code. The `quickSelectScanDirectory` filter already uses `fs.existsSync(dir)` (not the broken `return true` pattern described in the review).
**Original issue:** The filter function always returned `true`, making directory existence check useless.

---

_Fixed: 2026-05-10T00:00:00Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
