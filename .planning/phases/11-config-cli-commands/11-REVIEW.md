---
phase: 11-config-cli-commands
reviewed: 2026-05-02T15:30:00Z
depth: standard
files_reviewed: 4
files_reviewed_list:
  - src/cli/commands/config.test.ts
  - src/cli/commands/config.ts
  - src/cli/index.ts
  - src/cli/prompts/wizards/config-wizard.ts
findings:
  critical: 0
  warning: 1
  info: 3
  total: 4
status: issues_found
---

# Phase 11: Code Review Report

**Reviewed:** 2026-05-02T15:30:00Z
**Depth:** standard
**Files Reviewed:** 4
**Status:** issues_found

## Summary

Reviewed 4 TypeScript files implementing Phase 11 CLI config commands (add/list/remove). Code quality is good with comprehensive test coverage (26 tests). The implementation follows project conventions and security requirements (SEC-01, SEC-02, SEC-04, CFG-03, CFG-04).

One warning-level issue was found: `displayValidationErrors` function is defined and tested but never integrated into the error handling flow. The function is exported and has 5 dedicated tests, but is not called in actual command paths. This means validation errors would be displayed generically instead of with the intended grouped format (SEC-02/D-11/D-12).

## Warnings

### WR-01: displayValidationErrors Not Integrated into Error Flow

**File:** `src/cli/commands/config.ts:121`
**Issue:** The `displayValidationErrors` function (lines 38-81) is exported and tested but never called in the command's error handling. When a `ValidationError` is thrown during config creation, it would be caught by `handleCLIError()` which only handles `ServiceError` and generic `Error` types. The grouped error display (SEC-02/D-11/D-12) would never be shown to users.

**Current code (lines 99-123):**
```typescript
.action(async () => {
  try {
    // ... creation logic ...
  } catch (error) {
    handleCLIError(error);  // ValidationError not handled specially
  }
});
```

**Fix:** Update the catch block to handle ValidationError:
```typescript
import { ValidationError } from '../../lib/types/validation.js';

// In the action handler:
} catch (error) {
  if (error instanceof ValidationError) {
    displayValidationErrors(error);
    process.exit(ExitCodes.CONFIG_ERROR);
  }
  handleCLIError(error);
}
```

## Info

### IN-01: Deprecated Wizard Code Still Present

**File:** `src/cli/prompts/wizards/config-wizard.ts:1-194`
**Issue:** The entire wizard file is marked as deprecated (lines 16-30) with migration instructions to use CLI commands instead. This adds maintenance burden and code size. Per the deprecation notice, it should be removed in Phase 15.

**Suggestion:** Schedule removal in Phase 15 as documented. No immediate action needed.

### IN-02: API Key Sanitization Pattern Could Miss Non-Anthropic Formats

**File:** `src/cli/commands/config.ts:53-54`
**Issue:** The regex `/sk-[a-zA-Z0-9-]+/g` only sanitizes Anthropic-style API keys (starting with `sk-`). Other providers (OpenRouter, etc.) may use different key formats that would not be masked in error messages.

**Current code:**
```typescript
const sanitizedMessage = path.includes('apiKey')
  ? message.replace(/sk-[a-zA-Z0-9-]+/g, '***')
  : message;
```

**Suggestion:** Consider a more general pattern or provider-specific sanitization:
```typescript
const sanitizedMessage = path.includes('apiKey')
  ? message.replace(/[\w-]{20,}/g, '***')  // Mask any long alphanumeric string
  : message;
```

### IN-03: Test Assertion Could Be More Specific

**File:** `src/cli/commands/config.test.ts:345`
**Issue:** Test 11 uses `expect(hasAnthropic || hasOpenrouter).toBe(true)` which passes if either config name is found. This is a weak assertion that wouldn't catch issues where only one config is displayed when both should be.

**Suggestion:** Assert both configs are present:
```typescript
expect(hasAnthropic).toBe(true);
expect(hasOpenrouter).toBe(true);
```

---

_Reviewed: 2026-05-02T15:30:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_