---
phase: 15-ink-removal
reviewed: 2026-05-10T20:00:00.000Z
depth: standard
security_review: true
files_reviewed: 28
files_reviewed_list:
  - src/cli/commands/config.test.ts
  - src/cli/commands/config.ts
  - src/cli/commands/current.ts
  - src/cli/commands/export.ts
  - src/cli/commands/import.ts
  - src/cli/commands/list.ts
  - src/cli/commands/register.ts
  - src/cli/commands/scan.ts
  - src/cli/commands/switch.ts
  - src/cli/commands/undo.ts
  - src/cli/index.ts
  - src/cli/prompts/components/confirm-action.ts
  - src/cli/prompts/components/input-api-key.ts
  - src/cli/prompts/components/select-api-config.test.ts
  - src/cli/prompts/components/select-api-config.ts
  - src/cli/prompts/components/select-directory.ts
  - src/cli/prompts/utils/index.ts
  - src/cli/utils/diff-render.test.ts
  - src/cli/utils/diff.ts
  - src/cli/utils/index.ts
  - src/lib/services/config-service.test.ts
  - src/lib/services/config-service.ts
  - src/lib/services/export-service.test.ts
  - src/lib/services/export-service.ts
  - src/lib/store/migration.test.ts
  - src/lib/store/migration.ts
  - src/lib/store/watcher.ts
  - src/lib/types/export-schema.ts
  - src/lib/types/merge.ts
findings:
  critical: 0
  warning: 5
  info: 3
  total: 8
status: issues_found
---

# Phase 15: Code Review Report

**Reviewed:** 2026-05-10T20:00:00.000Z
**Depth:** standard
**Files Reviewed:** 28
**Status:** issues_found

## Summary

Reviewed 28 source files across CLI commands, prompt components, services, store, and types. The codebase is well-structured with consistent patterns: constructor injection for services, Zod schema validation, proper API key masking, and thorough test coverage. Security patterns are strong (password-type input, masked API keys in display, Zod validation). No critical issues found.

The main concerns are: unhandled edge cases (NaN from parseInt, missing HOME env var), missing input validation for import strategy, a dead/unused filter in directory selection, and an unhandled promise rejection path in the file watcher.

## Security Analysis

<security_analysis>

### Threat Model (STRIDE)

**Spoofing:** API keys are input via password-type prompts (SEC-04) and masked in all display output. No plaintext API key appears in CLI args, logs, or stdout displays. The use of Zod schemas provides validation against malformed input.

**Tampering:** Config write operations create backups before overwriting. The import flow validates payload structure via Zod schemas. Env/model replacement is precise (not a blind deep merge of all fields), preventing accidental overwrite of permissions/hooks/mcpServers.

**Repudiation:** Export metadata includes ISO timestamps. Undo service provides backup-based rollback with timestamps.

**Information Disclosure:** API keys are masked in diff previews (`maskApiKeyInConfig`), table output (`maskApiKey`), and error messages (sanitized via regex replacement). Password-type prompts prevent terminal history exposure. One concern: the sanitization regex `sk-[a-zA-Z0-9-]+` covers only the Anthropic API key format -- non-Anthropic keys with different formats are not sanitized.

**Denial of Service:** No DoS vectors identified in the reviewed files. File operations are local only.

**Elevation of Privilege:** CLI commands run with the user's existing privileges. No privilege escalation paths identified.

### Key Security Findings

- **Positive:** All API key handling follows security best practices (password input, masked display, Zod validation, no hardcoded keys).
- **Positive:** Error messages sanitize API key patterns before display (config.ts:50-53).
- **Concern:** API key sanitization regex (`sk-[a-zA-Z0-9-]+`) is Anthropic-specific. Keys from other providers (OpenAI `sk-proj-*`, OpenRouter, etc.) would not be sanitized.
- **Concern:** No rate limiting on API operations, but this is a local CLI tool so the threat surface is minimal.

</security_analysis>

---

## Warnings

### WR-01: NaN from parseInt when `--depth` is non-numeric

**File:** `src/cli/commands/scan.ts:79`
**Issue:** `parseInt(options.depth, 10)` returns `NaN` when the user passes a non-numeric value like `--depth abc`. The NaN value propagates to `projectService.scanProjects(NaN, overrideDirs)`, which may cause undefined behavior or hard-to-debug errors.

```typescript
// Current code (line 79):
const depth = options.depth !== undefined ? parseInt(options.depth, 10) : 3;
```

**Fix:** Validate the parse result before using it:

```typescript
const depth = options.depth !== undefined ? parseInt(options.depth, 10) : 3;
if (isNaN(depth) || depth < 1) {
  console.error(colors.danger('Invalid depth value. Using default depth of 3.'));
  depth = 3;
}
```

Alternatively, use `Number()` and check `Number.isInteger()` for stricter validation.

---

### WR-02: `process.env.HOME` fallback creates path starting with "undefined"

**File:** `src/cli/commands/register.ts:54-56`
**Issue:** When `process.env.HOME` is undefined (possible in constrained environments), `path.join(undefined, projectPath.slice(1))` coerces `undefined` to the string `'undefined'`, producing a path like `'undefined/path/to/project'`. This path passes `fs.pathExists` checks and leads to confusing "no .claude directory" errors rather than a clear message about the missing HOME variable.

```typescript
// Current code:
const expandedPath = projectPath.startsWith('~')
  ? path.join(process.env.HOME ?? '', projectPath.slice(1))
  : path.resolve(projectPath);
```

**Fix:** Check for HOME explicitly and provide a clear error:

```typescript
const expandedPath = projectPath.startsWith('~')
  ? (() => {
      const home = process.env.HOME;
      if (!home) {
        console.error(colors.danger('Cannot expand ~: HOME environment variable is not set.'));
        process.exit(ExitCodes.MISUSE);
      }
      return path.join(home, projectPath.slice(1));
    })()
  : path.resolve(projectPath);
```

Note: The `~user` expansion case (e.g., `~otheruser/project`) is also not handled -- only `~/path` works correctly. This is an acceptable scope limitation if documented.

---

### WR-03: Unused filter logic in `quickSelectScanDirectory`

**File:** `src/cli/prompts/components/select-directory.ts:162-168`
**Issue:** The `filter()` callback always returns `true` in the try block without performing any actual check on whether the directory exists. The comment says "Check if directory exists (simplified)" but the implementation is empty.

```typescript
// Current code:
const validDirs = commonDirs.filter(dir => {
  try {
    // Check if directory exists (simplified)
    return true;
  } catch {
    return false;
  }
});
```

**Fix:** Either implement the actual check or remove the dead filter logic:

```typescript
const validDirs = commonDirs.filter(dir => {
  try {
    return fs.existsSync(dir);
  } catch {
    return false;
  }
});
```

---

### WR-04: Unhandled error during watcher `start()` can cause 5-second hang

**File:** `src/lib/store/watcher.ts:238,245-266`
**Issue:** If chokidar emits an `'error'` event before the `'ready'` event, the promise returned by `start()` hangs for the full 5-second timeout instead of rejecting immediately. The error handler on line 238 logs the error but does not reject the promise, leaving only the 5-second safety timeout to unblock the caller with a confusing timeout error.

```typescript
// Current code: error handler only logs
this.watcher.on('error', (err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  console.error(`FileWatcher error: ${message}`);
});
```

**Fix:** Store a rejection function from the promise and call it on error:

```typescript
await new Promise<void>((resolve, reject) => {
  // ... existing code ...

  this.watcher.on('error', (err: unknown) => {
    clearTimeout(timeout);
    reject(err instanceof Error ? err : new Error(String(err)));
  });

  // ... rest of existing code ...
});
```

---

### WR-05: Missing validation for `--strategy` option value

**File:** `src/cli/commands/import.ts:107-109`
**Issue:** Commander does not validate the `<merge|overwrite|skip>` enum notation -- the pipe syntax in the description is purely documentation. If a user passes `--strategy invalid`, the value silently falls through to the `else` branch in `importProject()` and is treated as `merge` strategy, which could lead to unexpected behavior.

```typescript
// Current code:
if (options.strategy) {
  strategy = options.strategy;
}
```

**Fix:** Validate the strategy value explicitly:

```typescript
const VALID_STRATEGIES = ['merge', 'overwrite', 'skip'] as const;
if (options.strategy) {
  if (!VALID_STRATEGIES.includes(options.strategy as typeof VALID_STRATEGIES[number])) {
    console.error(colors.danger(`Invalid strategy: "${options.strategy}". Valid values: merge, overwrite, skip`));
    process.exit(ExitCodes.MISUSE);
  }
  strategy = options.strategy;
}
```

---

## Info

### IN-01: Dead code after `migrateExportPayload` validation

**File:** `src/cli/commands/import.ts:85-95`
**Issue:** `migrateExportPayload()` (called on line 82) either returns a valid `ExportPayload` or throws. The subsequent null/type checks on `payload` and `payload.project.path` are unreachable because `ExportPayloadSchema` guarantees both fields via Zod validation. The `as Record<string, unknown>` casts are also unnecessary noise on an already-typed variable.

```typescript
// These checks can never trigger after migrateExportPayload succeeds:
if (typeof payload !== 'object' || payload === null) { ... }
if (typeof projectObj?.path !== 'string') { ... }
```

**Fix:** Remove the dead code. The payload is guaranteed to be valid after `migrateExportPayload`:

```typescript
const payload = migrateExportPayload(payloadRaw);
// payload is guaranteed to be a valid ExportPayload with project.path as string
const targetPath = options.target ?? payload.project.path;
```

---

### IN-02: Unused private method `deriveProjectName`

**File:** `src/lib/services/export-service.ts:286-288`
**Issue:** The `deriveProjectName` private method is defined but never called within the class. It appears to have been intended for constructing project names during export, but the actual project name comes from `project.name` in the `ProjectIndex` entry.

```typescript
private deriveProjectName(projectPath: string): string {
  return path.basename(projectPath);
}
```

**Fix:** Either remove the unused method, or use it to provide a fallback name when `project.name` is missing.

---

### IN-03: Duplicated tilde expansion logic in FileWatcher

**File:** `src/lib/store/watcher.ts:198,299,325,354`
**Issue:** The tilde-to-home-directory path normalization logic is duplicated across four methods (`start`, `addPath`, `removePath`, `isWatching`). All use the same `p.startsWith('~') ? path.join(os.homedir(), p.slice(1)) : path.resolve(p)` pattern, creating a maintenance burden if the normalization logic ever needs to change.

**Fix:** Extract a private helper method:

```typescript
private normalizePath(filepath: string): string {
  if (filepath.startsWith('~')) {
    return path.join(os.homedir(), filepath.slice(1));
  }
  return path.resolve(filepath);
}
```

Replace all four occurrences with `this.normalizePath(p)`.

---

_Reviewed: 2026-05-10T20:00:00.000Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
