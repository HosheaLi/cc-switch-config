---
phase: 14-terminal-aesthetic
reviewed: 2026-05-05T00:00:00Z
depth: standard
files_reviewed: 15
files_reviewed_list:
  - package.json
  - src/cli/index.ts
  - src/cli/output/error.ts
  - src/cli/output/table.ts
  - src/cli/prompts/utils/format-choices.ts
  - src/cli/theme/borders.test.ts
  - src/cli/theme/borders.ts
  - src/cli/theme/colors.test.ts
  - src/cli/theme/colors.ts
  - src/cli/theme/detection.test.ts
  - src/cli/theme/detection.ts
  - src/cli/theme/formatters.ts
  - src/cli/theme/index.ts
  - src/cli/theme/theme.test.ts
  - src/cli/utils/diff-render.ts
findings:
  critical: 0
  warning: 3
  info: 3
  total: 6
status: issues_found
---

# Phase 14: Code Review Report

**Reviewed:** 2026-05-05T00:00:00Z
**Depth:** standard
**Files Reviewed:** 15
**Status:** issues_found

## Summary

Reviewed the terminal aesthetic design system implementation across 15 files. The theme module (detection, colors, borders, formatters, barrel export) is well-structured with proper NO_COLOR/FORCE_COLOR handling, truecolor detection, and Windows CMD ASCII fallback. The codebase follows the UI-SPEC design contract consistently.

Key concerns: three instances of duplicated `stripAnsi` utility that should be consolidated into a shared module, a missing switch default case in diff-render, and a potential edge case in project name fallback logic. No security vulnerabilities or critical bugs found.

## Warnings

### WR-01: Duplicated stripAnsi function across modules

**File:** `src/cli/output/table.ts:14` and `src/cli/utils/diff-render.ts:24`
**Issue:** The `stripAnsi` function is identically defined in two separate source files (`table.ts` and `diff-render.ts`) and also in `theme.test.ts`. Duplicated security-critical sanitization logic creates maintenance risk: if the ANSI-stripping regex needs to be updated (e.g., to handle CSI sequences beyond `\x1b[`), all copies must be changed or some inputs remain unsanitized.
**Fix:** Extract `stripAnsi` into a shared utility (e.g., `src/cli/utils/ansi.ts`) and import it from both consumers:
```typescript
// src/cli/utils/ansi.ts
export const stripAnsi = (str: string): string => str.replace(/\x1b\[[0-9;]*m/g, '');
```
Then in `table.ts` and `diff-render.ts`:
```typescript
import { stripAnsi } from '../utils/ansi.js';
```

### WR-02: Missing default case in diff render switch statement

**File:** `src/cli/utils/diff-render.ts:104`
**Issue:** The `switch (line.type)` statement handles `'removed'`, `'added'`, and `'modified'` but has no `default` case. If a `DiffLine` with an unexpected type is encountered, it will be silently skipped with no indication to the user. This could mask data integrity issues in diff output.
**Fix:** Add a default case that logs or displays the unknown line type:
```typescript
default: {
  const _exhaustive: never = line;
  console.log(colors.muted(`? ${stripAnsi(line.path)}: [unknown type]`));
}
```

### WR-03: NO_COLOR check uses empty-string exclusion that may not match spec

**File:** `src/cli/theme/detection.ts:34`
**Issue:** The NO_COLOR spec (https://no-color.org/) states: "Command-line software which outputs colored text should check for the presence of a NO_COLOR environment variable that, when present (regardless of its value), prevents the addition of ANSI color." The current check `env.NO_COLOR && env.NO_COLOR !== ''` excludes the empty string, meaning `NO_COLOR=""` would NOT disable colors. Per the spec, even an empty value should disable colors.
**Fix:** Change the condition to only check for presence:
```typescript
if (env.NO_COLOR !== undefined) {
  return { enabled: false, truecolor: false, reason: 'NO_COLOR set' };
}
```

## Info

### IN-01: formatValue does not handle circular object references

**File:** `src/cli/utils/diff-render.ts:55`
**Issue:** `JSON.stringify(value)` on line 55 will throw if `value` is a circular object. While this is unlikely for config values, it is a defensive programming gap. `JSON.stringify` accepts a replacer; a common pattern is to use a `seen` WeakSet to detect cycles.
**Fix:** Wrap in a try-catch or use a safe stringify:
```typescript
let jsonStr: string;
try {
  jsonStr = JSON.stringify(value);
} catch {
  jsonStr = '[circular]';
}
```

### IN-02: Hardcoded VERSION in index.ts should reference package.json

**File:** `src/cli/index.ts:24`
**Issue:** `const VERSION = '0.1.0'` is hardcoded and must be manually kept in sync with `package.json` version. If the package version changes, this constant will become stale. This is a minor maintainability concern.
**Fix:** Consider reading the version from package.json at build time (tsup can replace this via define/replace), or at least add a comment noting the coupling.

### IN-03: formatProjectChoice does not strip ANSI from user-provided strings

**File:** `src/cli/prompts/utils/format-choices.ts:18-29`
**Issue:** Per T-14-05/T-14-06, user input should be stripped of ANSI escape codes before being formatted. `formatProjectChoice` uses `project.name` and `project.path` directly without sanitization, unlike `formatProjectTable` in `table.ts` which calls `stripAnsi(project.path)`. While `project.name` is likely controlled data, `project.path` is a filesystem path that could theoretically contain injected sequences. This is informational since the `prompts` library likely handles this, but the inconsistency is worth noting.
**Fix:** Apply `stripAnsi` to user-facing inputs consistently:
```typescript
import { stripAnsi } from '../utils/ansi.js'; // after WR-01 refactor
const safeName = stripAnsi(project.name);
const safePath = stripAnsi(project.path);
```

---

_Reviewed: 2026-05-05T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
