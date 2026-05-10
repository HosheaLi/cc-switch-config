---
phase: 14-terminal-aesthetic
reviewed: 2026-05-10T12:00:00Z
depth: standard
security_review: true
files_reviewed: 77
files_reviewed_list:
  - .gitignore
  - CHANGELOG.md
  - LICENSE
  - README.md
  - README_CN.md
  - USAGE.md
  - docs/CODE-REVIEW-2026-05-08.md
  - docs/superpowers/specs/2026-05-08-scan-enhancement-design.md
  - package.json
  - scripts/benchmark.bench.ts
  - src/cli/commands/auto-check.ts
  - src/cli/commands/config.ts
  - src/cli/commands/current.ts
  - src/cli/commands/export.ts
  - src/cli/commands/import.ts
  - src/cli/commands/list.ts
  - src/cli/commands/register.ts
  - src/cli/commands/scan.ts
  - src/cli/commands/switch.ts
  - src/cli/commands/undo.ts
  - src/cli/commands/unregister.ts
  - src/cli/dashboard/dashboard.ts
  - src/cli/dashboard/quick-switch.ts
  - src/cli/index.ts
  - src/cli/output/error.ts
  - src/cli/output/table.ts
  - src/cli/output/index.ts
  - src/cli/prompts/components/confirm-action.ts
  - src/cli/prompts/components/input-api-key.ts
  - src/cli/prompts/components/select-api-config.ts
  - src/cli/prompts/components/select-directory.ts
  - src/cli/prompts/components/select-project.ts
  - src/cli/prompts/components/index.ts
  - src/cli/prompts/index.ts
  - src/cli/prompts/utils/autocomplete.ts
  - src/cli/prompts/utils/format-choices.ts
  - src/cli/prompts/utils/handle-cancel.ts
  - src/cli/prompts/utils/index.ts
  - src/cli/prompts/wizards/index.ts
  - src/cli/prompts/wizards/onboarding-wizard.ts
  - src/cli/theme/borders.ts
  - src/cli/theme/colors.ts
  - src/cli/theme/detection.ts
  - src/cli/theme/formatters.ts
  - src/cli/theme/index.ts
  - src/cli/utils/auto-switch.ts
  - src/cli/utils/cli-launch.ts
  - src/cli/utils/diff-render.ts
  - src/cli/utils/diff.ts
  - src/cli/utils/index.ts
  - src/cli/utils/mask-config.ts
  - src/cli/utils/service-factory.ts
  - src/cli/utils/spinner.ts
  - src/cli/utils/string-utils.ts
  - src/index.ts
  - src/lib/constants/index.ts
  - src/lib/constants/skip-dirs.ts
  - src/lib/paths/claude.ts
  - src/lib/security/api-key.ts
  - src/lib/security/index.ts
  - src/lib/services/api-service.ts
  - src/lib/services/config-service.ts
  - src/lib/services/export-service.ts
  - src/lib/services/index.ts
  - src/lib/services/project-service.ts
  - src/lib/services/provider-service.ts
  - src/lib/services/undo-service.ts
  - src/lib/store/api-config.ts
  - src/lib/store/config.ts
  - src/lib/store/index.ts
  - src/lib/store/migration.ts
  - src/lib/store/project.ts
  - src/lib/store/state.ts
  - src/lib/store/template.ts
  - src/lib/store/watcher.ts
  - src/lib/types/api-config.ts
  - src/lib/types/config.ts
  - src/lib/types/export-schema.ts
  - src/lib/types/index.ts
  - src/lib/types/merge.ts
  - src/lib/types/replacement.ts
  - src/lib/types/validation.ts
  - src/version.ts
  - tsup.config.ts
  - typedoc.json
  - vitest.config.ts
findings:
  critical: 0
  warning: 5
  info: 10
  total: 15
status: issues_found
---

# Phase 14: Code Review Report

**Reviewed:** 2026-05-10T12:00:00Z
**Depth:** standard
**Security Review:** true
**Files Reviewed:** 77
**Status:** issues_found

## Summary

This review covers the full cc-config-switch codebase (77 files) at standard depth, superseding the prior review (15 files). The project is well-structured with clean layering: CLI commands delegate to services, services depend on stores, and types are consistently inferred from Zod schemas. Security practices are strong (password input for API keys, validation before write, masked key display, CLI arg rejection). 

Since the prior review, the `stripAnsi` duplication (WR-01) has been properly consolidated into `string-utils.ts`, and the hardcoded `VERSION` (IN-02) now reads from `package.json`. Both are verified fixed.

Five warnings and ten info items are reported. No critical security vulnerabilities were found. The most impactful warnings are: (1) a partial-parameter crash risk in the undo command, (2) an unsafe backup strategy during migration that could lose rollback state, (3) unreachable code after `process.exit()` across multiple commands, (4) a missing default case in the diff-render switch, and (5) a NO_COLOR spec violation.

## Security Analysis

A threat-model assessment using STRIDE was conducted for the security-relevant code paths (API key handling, config file I/O, CLI argument processing).

| Category | Risk | Status |
|---|---|---|
| **S**poofing | API key substitution during config apply | Mitigated -- keys read from store, never from CLI args |
| **T**ampering | Config file modification during write | Mitigated -- atomic write-rename pattern, pre-write backup |
| **R**epudiation | No audit logs | Acceptable -- CLI tool, not a multi-user service |
| **I**nformation Disclosure | API key leak in display/diff/error | Partially mitigated -- `maskApiKey` in display, `validateNoCliApiKey` in CLI. IN-05 flags regex gap for non-Anthropic key prefix |
| **D**enial of Service | Backup disk exhaustion | Low risk -- user-initiated operations only |
| **E**levation of Privilege | Config injection via .claude/settings.json | Mitigated -- Zod strict schemas reject unknown fields, model validation |

**Key security controls verified:**
- `src/lib/security/api-key.ts:80-111`: `validateNoCliApiKey` rejects `--api-key`, `--apiKey`, `-k` flags -- prevents shell history exposure
- `src/cli/prompts/components/input-api-key.ts:21-37`: Password-type input with minimum length (10 chars) -- prevents shoulder-surfing
- `src/lib/store/config.ts:66-84`: `writeConfig` validates with Zod schema and creates backup before write -- prevents corrupt config persistence
- `src/lib/store/api-config.ts:178-220`: `set` validates input, creates backup, manages timestamps -- audit trail for configuration changes
- `src/lib/types/config.ts:80-87`: `ClaudeSettingsSchema` uses `.strict()` to reject unknown keys -- prevents injection of arbitrary fields

**Gaps identified:**
1. IN-05: Non-Anthropic API key prefixes not masked in error messages
2. IN-10: ANSI escape codes not stripped from project names in prompt choices
3. WR-02: Migration creates multiple backups, losing clean rollback state
4. WR-05: NO_COLOR check violates spec (empty string does not disable colors)

## Warnings

### WR-01: Undo Command partial parameter support causes runtime crash

**File:** `/Users/lihaoxuan/code/P07_CCAPISwitch/src/cli/commands/undo.ts:29-37`
**Issue:** The `executeUndoCommand` function accepts optional `appState`, `projectIndex`, and `undoService` parameters. When both `appState` and `projectIndex` are omitted, `defaultSvc` is created. However, if only ONE of the two is provided, `defaultSvc` is `null` and the non-null assertion `defaultSvc!` crashes at runtime.

```typescript
// Line 35-37: if only one param is passed, defaultSvc is null and defaultSvc! throws
const defaultSvc = (!appState || !projectIndex) ? createServices() : null;
const state = appState ?? defaultSvc!.appState;  // crashes if defaultSvc is null
const index = projectIndex ?? defaultSvc!.projectIndex;
```

**Fix:** Make the parameters mutually exclusive (both or neither):

```typescript
export async function executeUndoCommand(
  appState?: AppState,
  projectIndex?: ProjectIndex,
  undoService?: UndoService
): Promise<void> {
  const defaultSvc = (appState === undefined && projectIndex === undefined)
    ? createServices() : null;
  const state = appState ?? defaultSvc?.appState ?? new AppState();
  const index = projectIndex ?? defaultSvc?.projectIndex ?? new ProjectIndex();
  // ...
}
```

---

### WR-02: Migration backup strategy loses single rollback point

**File:** `/Users/lihaoxuan/code/P07_CCAPISwitch/src/lib/store/migration.ts:158`
**Issue:** The migration loop calls `apiConfigStore.set(name, data)` for each config, and each `set()` call internally calls `createBackup()` which overwrites the previous backup. If migration is interrupted midway, the backup reflects a partially migrated state, making rollback impossible. This creates a data integrity risk during the one-time migration from templates.json to api-configs.json.

```typescript
for (const [name, template] of Object.entries(templates)) {
  // ...
  await apiConfigStore.set(name, parseResult.data);  // creates backup each time, overwriting previous
  result.migrated++;
}
```

**Fix:** Backup once before the loop, then write all configs in a single operation:

```typescript
// Single backup before loop
if (await exists(apiConfigStore.filePath)) {
  await createBackup(apiConfigStore.filePath);
}
// Collect all valid configs in memory, then single write
for (...) { /* convert and collect */ }
await apiConfigStore.save();  // single atomic write
```

---

### WR-03: Unreachable code after process.exit() in multiple commands

**Files:**
- `/Users/lihaoxuan/code/P07_CCAPISwitch/src/cli/commands/register.ts:67-68`
- `/Users/lihaoxuan/code/P07_CCAPISwitch/src/cli/commands/unregister.ts:48-49`
- `/Users/lihaoxuan/code/P07_CCAPISwitch/src/cli/commands/undo.ts:50-51`
- `/Users/lihaoxuan/code/P07_CCAPISwitch/src/cli/commands/current.ts:42,54-55`

**Issue:** Multiple locations have code placed after `process.exit()` that will never execute. This indicates either missing logic or leftover code. Additionally, `executeCurrentCommand` and `executeUndoCommand` are exported as testable functions but contain `process.exit()`, making them impossible to unit test.

```typescript
// register.ts:67-68 - throw after exit is unreachable
process.exit(ExitCodes.MISUSE);
throw new Error(`Path does not exist: ${expandedPath}`);  // NEVER REACHED

// unregister.ts:48-49 - return after exit is unreachable
process.exit(ExitCodes.NOT_FOUND);
return;  // NEVER REACHED
```

**Fix:** Remove unreachable statements. For testable functions, replace `process.exit()` with throws for Commander to handle:

```typescript
// register.ts - remove the throw, exit is sufficient
process.exit(ExitCodes.MISUSE);

// current.ts - replace with throw for Commander exitOverride handler
throw new Error('No active project set.');
```

---

### WR-04: Missing default case in diff render switch statement

**File:** `/Users/lihaoxuan/code/P07_CCAPISwitch/src/cli/utils/diff-render.ts:99-114`
**Issue:** The `switch (line.type)` statement handles `'removed'`, `'added'`, and `'modified'` but has no `default` case. If a `DiffLine` with an unexpected type is encountered, it is silently skipped with no indication to the user. This could mask data integrity issues in diff output, particularly after refactoring the `DiffLine` type.

```typescript
switch (line.type) {
  case 'removed': ...
  case 'added': ...
  case 'modified': ...
  // no default - unexpected types are silently dropped
}
```

**Fix:** Add a default case with an exhaustiveness check:

```typescript
switch (line.type) {
  case 'removed': ...
  case 'added': ...
  case 'modified': ...
  default: {
    const _exhaustive: never = line;
    console.log(colors.muted(`? ${line.path}: [unknown type]`));
  }
}
```

---

### WR-05: NO_COLOR check violates spec (empty string should disable colors)

**File:** `/Users/lihaoxuan/code/P07_CCAPISwitch/src/cli/theme/detection.ts:34`
**Issue:** The official NO_COLOR spec (https://no-color.org/) states colors should be disabled whenever the variable is present, regardless of its value. The current check `env.NO_COLOR && env.NO_COLOR !== ''` excludes the empty string, so `NO_COLOR=""` would NOT disable colors. This is a spec compliance issue that affects users who follow the documented NO_COLOR convention.

```typescript
// Current: empty string treated as "not set"
if (env.NO_COLOR && env.NO_COLOR !== '') { ... }
```

**Fix:** Check only for presence (not value):

```typescript
// Per spec: presence of NO_COLOR (any value) disables colors
if (env.NO_COLOR !== undefined) {
  return { enabled: false, truecolor: false, reason: 'NO_COLOR set' };
}
```

---

## Info

### IN-01: Dead code - `deriveProjectName` method never called

**File:** `/Users/lihaoxuan/code/P07_CCAPISwitch/src/lib/services/export-service.ts:286-288`
**Issue:** The `deriveProjectName` private method is defined but never used within the class. Project name is always derived from the `ProjectEntry` object instead.

```typescript
private deriveProjectName(projectPath: string): string {
  return path.basename(projectPath);
}
```

**Fix:** Remove the dead method or add a comment indicating planned future use.

---

### IN-02: Broken JSDoc comment block

**File:** `/Users/lihaoxuan/code/P07_CCAPISwitch/src/cli/prompts/components/select-project.ts:15-18`
**Issue:** A duplicate JSDoc block opens, contains one line, then closes without being attached to any symbol. A second complete JSDoc follows immediately. This is a parseable but confusing artifact.

```typescript
/**
 * Select a single project from a list.

/**
 * Select a single project from a list.
```

**Fix:** Remove the broken duplicate block.

---

### IN-03: Redundant validation after `migrateExportPayload`

**File:** `/Users/lihaoxuan/code/P07_CCAPISwitch/src/cli/commands/import.ts:85-95`
**Issue:** After `migrateExportPayload(payloadRaw)` (line 82) which validates the payload and throws on failure, about 10 lines of manual validation follow. These checks are dead code since the migration already guarantees a valid `ExportPayload`.

```typescript
const payload = migrateExportPayload(payloadRaw);

// All checks below are unreachable - migrateExportPayload already validated
if (typeof payload !== 'object' || payload === null) { ... }
```

**Fix:** Remove the redundant manual validation and use the typed `ExportPayload` directly.

---

### IN-04: Duplicate tilde expansion logic

**File:** `/Users/lihaoxuan/code/P07_CCAPISwitch/src/cli/commands/register.ts:54-63`
**Issue:** The `executeRegister` function implements its own tilde expansion (using `process.env.HOME`), duplicating the same logic in `project-service.ts:202-207` (using `os.homedir()`). Two different home-directory resolution methods could produce different results in edge cases (e.g., `HOME` unset vs `os.homedir()` fallback).

**Fix:** Make `ProjectService.expandPath` public, or extract a shared utility, so tilde expansion is consistent everywhere.

---

### IN-05: API key regex insufficient for non-Anthropic providers

**File:** `/Users/lihaoxuan/code/P07_CCAPISwitch/src/cli/commands/config.ts:52`
**Issue:** The error sanitization regex `sk-[a-zA-Z0-9-]+` only matches keys starting with `sk-`. Non-Anthropic API keys with different formats (e.g., `gsk_...` for Groq, `nvapi-...` for NVIDIA) in error messages would not be masked, potentially leaking credentials in terminal output.

```typescript
const sanitizedMessage = path.includes('apiKey')
  ? message.replace(/sk-[a-zA-Z0-9-]+/g, '***')
  : message;
```

**Fix:** Use a broader pattern that matches any credential-looking value in an `apiKey` context:

```typescript
const sanitizedMessage = path.includes('apiKey')
  ? message.replace(/["\']([A-Za-z0-9_-]{10,})["\']/g, '"***"')
  : message;
```

---

### IN-06: Dead code and redundant listener in FileWatcher

**File:** `/Users/lihaoxuan/code/P07_CCAPISwitch/src/lib/store/watcher.ts:222,251,258,263`
**Issue:** The `interval: 100` option (line 222) is dead code since `usePolling: false`. The `ready` event listener is registered twice (lines 251 and 263), though the duplicate `clearTimeout` call is functionally harmless.

**Fix:** Remove `interval: 100` and consolidate the two `ready` handlers into one:

```typescript
this.watcher.on('ready', () => {
  clearTimeout(timeout);
  normalizedPaths.forEach(p => this.watchedPaths.add(p));
  resolve();
});
```

---

### IN-07: `process.exit()` in testable functions prevents unit testing

**File:**
- `/Users/lihaoxuan/code/P07_CCAPISwitch/src/cli/commands/current.ts:42,54-55`
- `/Users/lihaoxuan/code/P07_CCAPISwitch/src/cli/commands/undo.ts:50`

**Issue:** `executeCurrentCommand` and `executeUndoCommand` are exported specifically for testability (per their JSDoc comments), but contain `process.exit()` calls that terminate the test runner process. This design contradiction means these functions cannot be meaningfully unit tested.

**Fix:** Replace `process.exit(0)` with `throw` statements that the Commander `exitOverride` handler can catch, or with early `return`, and let the Commander action handler manage the exit.

---

### IN-08: Loose `parseInt` for depth argument

**File:** `/Users/lihaoxuan/code/P07_CCAPISwitch/src/cli/commands/scan.ts:80`
**Issue:** `parseInt(options.depth, 10)` silently accepts trailing garbage (`--depth 3abc` parses to 3). `parseInt('0abc')` returns 0, passes the `depth < 1` check, and triggers silent fallback to default 3. Users receive no feedback about their invalid input.

```typescript
let depth = options.depth !== undefined ? parseInt(options.depth, 10) : 3;
```

**Fix:** Use `Number()` or explicit string validation to reject malformed input:

```typescript
if (options.depth !== undefined) {
  const parsed = Number(options.depth);
  if (!Number.isInteger(parsed) || parsed < 1) {
    console.error(colors.danger(`Invalid depth: "${options.depth}". Using 3.`));
    depth = 3;
  } else {
    depth = parsed;
  }
}
```

---

### IN-09: `formatValue` does not handle circular object references

**File:** `/Users/lihaoxuan/code/P07_CCAPISwitch/src/cli/utils/diff-render.ts:51`
**Issue:** `JSON.stringify(value)` in the `formatValue` function throws a `TypeError` if `value` contains circular references. While unlikely for typical config values, it is a defensive programming gap.

**Fix:** Wrap in try-catch:

```typescript
let jsonStr: string;
try {
  jsonStr = JSON.stringify(value);
} catch {
  jsonStr = '[circular]';
}
```

---

### IN-10: `formatProjectChoice` does not strip ANSI from user-provided strings

**File:** `/Users/lihaoxuan/code/P07_CCAPISwitch/src/cli/prompts/utils/format-choices.ts:18-29`
**Issue:** Per T-14-05/T-14-06, user-provided values should be stripped of ANSI escape codes before display to prevent terminal injection. `formatProjectChoice` uses `project.name` and `project.path` directly without sanitization, while `formatProjectTable` in `table.ts` calls `stripAnsi(project.path)`. This inconsistency creates a gap: ANSI codes in project names or paths will not be sanitized when displayed via prompts.

**Fix:** Apply `stripAnsi` consistently:

```typescript
import { stripAnsi } from '../utils/string-utils.js';
const safeName = stripAnsi(project.name || path.basename(project.path));
const safePath = stripAnsi(project.path);
```

---

_Reviewed: 2026-05-10T12:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
