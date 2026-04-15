# Phase 8: Quality & Polish - Research

**Researched:** 2026-04-15
**Domain:** Diff algorithms, Performance benchmarking, API documentation, Undo mechanisms, Ink performance profiling
**Confidence:** HIGH

## Summary

Phase 8 focuses on quality improvements and user experience optimization. The research confirms that standard, mature libraries exist for all planned features. The `diff` package (v9.0.0) provides unified diff generation with chalk coloring support. Vitest (already installed v3.2.4) has built-in benchmark mode. TypeDoc (v0.28.19) generates API documentation from TypeScript sources. The existing backup system (`backup.ts`) already provides the foundation for undo/rollback functionality.

**Primary recommendation:** Use `diff` package for unified diff generation, Vitest bench mode for performance testing, and leverage existing backup.ts infrastructure for undo mechanism. TypeDoc for API documentation with manual README/USAGE.md files.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Diff Before Apply (F12):**
- **D-01:** Unified diff format - 删除红色、新增绿色，类似 git diff
- **D-02:** 仅显示变更字段 - 紧凑聚焦变化，不显示未变更字段
- **D-03:** 强制显示 Diff before apply - 每次模板应用前自动展示 diff

**Config Validation UI (F11):**
- **D-04:** 全屏 ErrorScreen - 类似 ConfirmScreen 模式，聚焦错误列表
- **D-05:** 阻止继续 - 显示错误后禁止继续应用，必须先修复配置或取消

**Undo/Rollback (U2):**
- **D-06:** 单次撤销 - undo 命令恢复最近一次修改
- **D-07:** CLI undo + TUI U 快捷键 - 双触发机制

**Performance + Docs:**
- **D-08:** 全面性能优化 - Benchmark + TUI Profile + Services Profile
- **D-09:** 完整文档 - README + API Docs + Usage Guide

### Claude's Discretion

- Unified diff 具体颜色方案（chalk 红绿的具体 shade）
- ErrorScreen 错误列表的排序方式（按路径还是按严重性）
- Undo 命令的详细输出消息
- Benchmark 测试的具体工具（vitest bench vs custom）
- API Docs 的生成工具（TypeDoc vs 手写）

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.

</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| F11 | Config Validation with helpful errors | ValidationError class exists, formatValidationErrors produces readable output, ConfirmScreen pattern for full-screen UI |
| F12 | Diff Before Apply (side-by-side comparison) | `diff` package v9.0.0 for unified diff generation, chalk v5.6.2 for coloring, deep-object-diff v1.1.9 for JSON comparison |
| U2 | Undo Support (ability to undo modifications) | backup.ts provides createBackup, restoreBackup, getLatestBackup - direct integration path |
| U5 | Confirmation Prompts for destructive actions | ConfirmScreen already implemented in Phase 06, can be reused/adapted |
| N1 | Fast Startup (<1s cold start) | Vitest bench mode for benchmarking, manual timing with performance.now() |
| N2 | Quick Operations (<100ms for switch/list) | Vitest bench mode for measuring operation latency |
| N3 | Scalable Scanning (<5s for 100 projects) | Vitest bench mode with mock data for scalability tests |
| N4 | Responsive TUI (<50ms render time) | Ink rendering measurement, React DevTools profiler approach |
| M1 | Test Coverage (≥80% for core modules) | Vitest v8 coverage provider configured, existing tests show patterns |

</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| diff | 9.0.0 | Unified diff generation | Industry standard for text/JSON diff, npm 25M+ weekly downloads |
| chalk | 5.6.2 | Diff coloring (red/green) | Already installed, terminal color standard |
| vitest | 3.2.4 | Benchmark + Testing | Already installed, built-in bench mode |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| deep-object-diff | 1.1.9 | JSON object comparison | For detecting changed fields in config objects |
| TypeDoc | 0.28.19 | API documentation generation | For automated API docs from TypeScript sources |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| diff package | diff-match-patch (v1.0.5) | diff-match-patch is more suited for text editing/patching, diff is cleaner for display |
| deep-object-diff | Custom implementation | Custom would require handling all edge cases (nested objects, arrays, circular refs) |
| vitest bench | Custom benchmark script | Custom script loses integration with test runner, vitest bench provides unified reporting |
| TypeDoc | TSDoc comments only | TSDoc is for inline docs, TypeDoc generates full HTML documentation sites |

**Installation:**
```bash
npm install diff deep-object-diff typedoc --save-dev
```

**Version verification:**
- diff: 9.0.0 (published 2026-04-13)
- deep-object-diff: 1.1.9
- typedoc: 0.28.19
- chalk: 5.6.2 (already installed)
- vitest: 3.2.4 (already installed)

## Architecture Patterns

### Recommended Project Structure
```
src/
├── cli/
│   ├── commands/
│   │   └── undo.ts           # NEW: CLI undo command
│   └── utils/
│       └── diff.ts           # NEW: Diff generation utilities
├── tui/
│   ├── screens/
│   │   ├── DiffScreen.tsx    # NEW: Unified diff display
│   │   └── ValidationErrorScreen.tsx  # NEW: Validation error display
│   └── components/
│       └── UnifiedDiff.tsx   # NEW: Diff rendering component
├── lib/
│   ├── services/
│   │   └── undo-service.ts   # NEW: Undo service wrapper
│   └── file-system/
│       └── backup.ts         # EXISTING: Backup foundation
│   └── types/
│       └── validation.ts     # EXISTING: Validation foundation
│       └── merge.ts          # EXISTING: Deep merge (use for diff)
scripts/
├── benchmark.ts              # NEW: Performance benchmark script
docs/
├── api/                      # NEW: TypeDoc generated API docs
README.md                     # UPDATE: Quick start guide
USAGE.md                      # NEW: Detailed user guide
```

### Pattern 1: Unified Diff Generation
**What:** Generate git-style unified diff for JSON config changes
**When to use:** Before applying any template or config modification (D-03 mandatory)
**Example:**
```typescript
// Source: diff package documentation (npmjs.com/package/diff)
import * as Diff from 'diff';

// Generate unified diff for JSON configs
function generateConfigDiff(before: object, after: object): string {
  const beforeJson = JSON.stringify(before, null, 2);
  const afterJson = JSON.stringify(after, null, 2);
  
  const diffResult = Diff.createPatch('settings.json', beforeJson, afterJson);
  return diffResult;
}

// Filter to only show changed fields (D-02)
function filterChangedFields(before: ClaudeSettings, after: ClaudeSettings): DiffLine[] {
  const diff = require('deep-object-diff').diff;
  const changes = diff(before, after);
  
  // Convert changes to diff lines format
  return Object.entries(changes).flatMap(([key, change]) => {
    if (change?.added) {
      return { type: 'added', path: key, value: change.after };
    }
    if (change?.deleted) {
      return { type: 'removed', path: key, value: change.before };
    }
    return { type: 'modified', path: key, before: change.before, after: change.after };
  });
}
```

### Pattern 2: TUI Diff Display Component
**What:** Ink component to render colored unified diff
**When to use:** DiffScreen before ConfigEditorScreen applies template
**Example:**
```typescript
// Based on ImportConflictScreen pattern and chalk coloring
import React from 'react';
import { Box, Text } from 'ink';
import chalk from 'chalk';

interface DiffLine {
  type: 'added' | 'removed' | 'modified';
  path: string;
  value?: unknown;
  before?: unknown;
  after?: unknown;
}

export const UnifiedDiff: React.FC<{ lines: DiffLine[] }> = ({ lines }) => {
  return (
    <Box flexDirection="column">
      <Text bold color="cyan">Changes to Apply:</Text>
      {lines.map((line, i) => (
        <Box key={i} flexDirection="column">
          {line.type === 'removed' && (
            <Text color="red">
              - {line.path}: {JSON.stringify(line.value)}
            </Text>
          )}
          {line.type === 'added' && (
            <Text color="green">
              + {line.path}: {JSON.stringify(line.value)}
            </Text>
          )}
          {line.type === 'modified' && (
            <>
              <Text color="red">- {line.path}: {JSON.stringify(line.before)}</Text>
              <Text color="green">+ {line.path}: {JSON.stringify(line.after)}</Text>
            </>
          )}
        </Box>
      ))}
    </Box>
  );
};
```

### Pattern 3: ValidationErrorScreen (Full-screen error display)
**What:** Full-screen error list display, blocks continuation
**When to use:** When config validation fails before applying template (D-04, D-05)
**Example:**
```typescript
// Based on ConfirmScreen.tsx pattern
import React from 'react';
import { Box, Text, useInput } from 'ink';
import type { ValidationError } from '../../lib/types/validation.js';

interface ValidationErrorScreenProps {
  error: ValidationError;
  onCancel: () => void;  // Only cancel, no confirm (D-05)
}

export const ValidationErrorScreen: React.FC<ValidationErrorScreenProps> = ({
  error,
  onCancel,
}) => {
  useInput((input, key) => {
    if (key.escape) {
      onCancel();
    }
    // No 'y' confirm option - must fix errors first (D-05)
  });

  return (
    <Box flexDirection="column" padding={2}>
      <Text bold color="red">Validation Errors</Text>
      <Box marginTop={1}>
        <Text dimColor>The following issues must be fixed before applying:</Text>
      </Box>
      <Box flexDirection="column" marginTop={1} borderStyle="single" borderColor="red">
        {error.getMessages().map((msg, i) => (
          <Text key={i}>{msg}</Text>
        ))}
      </Box>
      <Box marginTop={2}>
        <Text bold color="yellow">Press Escape to return and fix errors</Text>
      </Box>
    </Box>
  );
};
```

### Pattern 4: Undo Service Integration
**What:** Service wrapper for undo operation using backup system
**When to use:** CLI `undo` command and TUI 'U' key handler (D-06, D-07)
**Example:**
```typescript
// Leverage existing backup.ts infrastructure
import { getLatestBackup, restoreBackup } from '../lib/file-system/backup.js';
import { ServiceError } from './types.js';

export class UndoService {
  constructor(
    private getProjectConfigPath: (projectPath: string) => string
  ) {}

  async undo(projectPath: string): Promise<{ backupTime: Date; restored: boolean }> {
    const configPath = this.getProjectConfigPath(projectPath);
    const latestBackup = await getLatestBackup(configPath);
    
    if (!latestBackup) {
      throw new ServiceError('No backup available to undo', 'NO_BACKUP');
    }

    await restoreBackup(configPath, latestBackup);
    
    // Extract timestamp from backup filename
    const timestamp = this.extractTimestamp(latestBackup);
    return { backupTime: timestamp, restored: true };
  }

  private extractTimestamp(backupPath: string): Date {
    // Format: settings.json.YYYY-MM-DDTHH-mm-ss-msZ
    const match = backupPath.match(/\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}/);
    if (match) {
      return new Date(match[0].replace(/-/g, ':'));
    }
    return new Date();
  }
}
```

### Pattern 5: Vitest Benchmark Tests
**What:** Use vitest bench mode for performance testing
**When to use:** Validate N1-N4 performance requirements
**Example:**
```typescript
// Source: Vitest documentation (vitest.dev/guide/benchmark)
import { bench, describe } from 'vitest';
import { ProjectService } from './project-service.js';
import { TemplateService } from './template-service.js';

describe('performance benchmarks', () => {
  bench('cold startup time < 1s (N1)', async () => {
    // Measure service initialization
    const start = performance.now();
    const service = new ProjectService(/* deps */);
    await service.initialize();
    const elapsed = performance.now() - start;
    // Bench mode automatically records elapsed time
  });

  bench('switch operation < 100ms (N2)', async () => {
    const templateService = new TemplateService(/* deps */);
    await templateService.applyTemplate('/test/project', 'default');
    // Bench mode records elapsed time
  });

  bench('100 project scan < 5s (N3)', async () => {
    const projectService = new ProjectService(/* deps */);
    await projectService.scanDirectory('/test/directory', { maxDepth: 3 });
    // With 100 mock project directories
  });
});

// Run: vitest bench
```

### Anti-Patterns to Avoid
- **Custom diff implementation:** Use `diff` package - handles edge cases like nested objects, arrays, whitespace
- **Manual benchmark scripts:** Use vitest bench - provides consistent measurement, reporting, comparison
- **Inline validation errors:** Use full-screen ValidationErrorScreen - users need to see all errors at once (D-05)
- **Skip backup before undo:** Always verify backup exists before restore - prevents data loss
- **Concatenate arrays in diff:** Arrays REPLACE in merge/diff (see merge.ts D-04 pattern)

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| JSON diff generation | Custom comparison logic | `diff` package (v9.0.0) | Handles nested objects, arrays, produces unified format |
| Object difference detection | Manual field comparison | `deep-object-diff` (v1.1.9) | Handles deep nested structures, circular refs protection |
| Performance measurement | Custom timing scripts | vitest bench mode | Integrated reporting, statistical analysis, comparison |
| API documentation | Manual markdown docs | TypeDoc (v0.28.19) | Generates from TypeScript sources, keeps docs in sync |
| Terminal coloring | ANSI escape codes | chalk (v5.6.2) | Cross-platform, semantic color names, already installed |

**Key insight:** All Phase 8 features have mature, well-maintained libraries. Custom implementations would introduce edge case bugs and maintenance burden.

## Runtime State Inventory

> This phase does NOT involve rename/refactor/migration of existing identifiers.
> Runtime state audit SKIPPED - Phase is additive (new screens, services, docs).

**Status:** Phase 8 adds new components without modifying existing runtime state identifiers.

## Common Pitfalls

### Pitfall 1: Diff Algorithm Edge Cases
**What goes wrong:** JSON stringify order changes, arrays treated as objects, whitespace differences
**Why it happens:** Object property order is not guaranteed in JavaScript, diff package expects text input
**How to avoid:** Use `JSON.stringify(obj, Object.keys(obj).sort(), 2)` for consistent ordering; use `deep-object-diff` for object-level comparison before text diff
**Warning signs:** Diff shows "changes" when values are identical, nested array diff appears corrupted

### Pitfall 2: Backup Race Conditions
**What goes wrong:** Multiple operations create backups simultaneously, getLatestBackup returns wrong one
**Why it happens:** Backup filenames use timestamps but operations may complete in different order than started
**How to avoid:** Ensure backup is created synchronously before modification, use process.pid in temp file names
**Warning signs:** Undo restores wrong version, backup timestamps appear out of order

### Pitfall 3: Validation UI Blocking Escape
**What goes wrong:** User trapped in ValidationErrorScreen, cannot return to fix errors
**Why it happens:** Escape handler not registered or conflicts with other useInput hooks
**How to avoid:** Always register Escape handler, use `isActive` flag to prevent hook conflicts
**Warning signs:** Pressing Escape does nothing, screen appears frozen

### Pitfall 4: Performance Benchmark Reliability
**What goes wrong:** Benchmarks show inconsistent results, timing varies wildly between runs
**Why it happens:** JIT compilation warmup, GC pauses, background processes, CPU throttling
**How to avoid:** Run benchmarks multiple times (vitest bench does this), warm up JIT before measuring, use dedicated benchmark environment
**Warning signs:** Same benchmark shows 50ms vs 200ms, results vary by 2x+ between runs

### Pitfall 5: Ink Render Performance Measurement
**What goes wrong:** Measured render time includes initial setup, not actual render cycles
**Why it happens:** Ink's reconciliation process happens asynchronously, measurement ends too early
**How to avoid:** Use `ink-testing-library` renderAndWait, measure after initial render, use React DevTools profiler pattern
**Warning signs:** Measured time shows 0ms or unrealistic low values, measurements don't match perceived lag

## Code Examples

Verified patterns from existing project code:

### Backup Restore Pattern (from backup.ts)
```typescript
// Source: src/lib/file-system/backup.ts
// Atomic restore pattern - directly usable for undo

export async function restoreBackup(filepath: string, backupPath: string): Promise<void> {
  // Verify backup exists
  const backupExists = await exists(backupPath);
  if (!backupExists) {
    throw new Error(`Backup file not found: ${backupPath}`);
  }

  // Use atomic write pattern: copy to temp, then rename
  const tempPath = `${filepath}.tmp.${process.pid}`;

  try {
    await fs.copy(backupPath, tempPath);
    await fs.rename(tempPath, filepath);  // Atomic on POSIX
  } catch (error) {
    try {
      await fs.remove(tempPath);  // Cleanup on error
    } catch { /* Ignore cleanup errors */ }
    throw error;
  }
}

export async function getLatestBackup(filepath: string): Promise<string | null> {
  const backups = await listBackups(filepath);
  return backups.length > 0 ? backups[0] : null;  // Already sorted newest first
}
```

### ValidationError Formatting (from validation.ts)
```typescript
// Source: src/lib/types/validation.ts
// Error formatting with symbols - directly usable for ValidationErrorScreen

export class ValidationError extends Error {
  public readonly issues: z.core.$ZodIssue[];

  getMessages(): string[] {
    return this.issues.map(issue => {
      const path = issue.path?.join('.') || 'root';
      return `${path}: ${issue.message}`;
    });
  }
}

export function formatValidationErrors(issues: z.core.$ZodIssue[]): string {
  const lines: string[] = [];
  for (const issue of issues) {
    const path = issue.path?.join('.') || 'root';
    const symbol = getErrorSymbol(issue.code ?? '');
    lines.push(`${symbol} ${path}: ${issue.message}`);
  }
  return lines.join('\n');
}

function getErrorSymbol(code: string): string {
  switch (code) {
    case 'invalid_type':
      return '\u26A0'; // WARNING SIGN
    case 'unrecognized_keys':
      return '?';
    default:
      return '\u2716'; // HEAVY MULTIPLICATION X
  }
}
```

### Full-screen Screen Pattern (from ConfirmScreen.tsx)
```typescript
// Source: src/tui/screens/ConfirmScreen.tsx
// Pattern for full-screen modal dialogs

import React from 'react';
import { Box, Text, useInput } from 'ink';

export const ConfirmScreen: React.FC<ConfirmScreenProps> = ({
  message,
  actionDescription,
  onConfirm,
  onCancel,
}) => {
  useInput((input, key) => {
    if (input.toLowerCase() === 'y') {
      onConfirm();
      return;
    }
    if (input.toLowerCase() === 'n' || key.escape) {
      onCancel();
      return;
    }
    // Enter deliberately ignored - force explicit y/n
  });

  return (
    <Box flexDirection="column" padding={2} justifyContent="center" alignItems="center">
      <Text bold color="red">WARNING</Text>
      <Box marginTop={1}><Text bold>{message}</Text></Box>
      <Box marginTop={1} borderStyle="single" borderColor="red" padding={1}>
        <Text dimColor>{actionDescription}</Text>
      </Box>
      <Box marginTop={2}>
        <Text bold color="yellow">Type 'y' to confirm, 'n' to cancel (or Esc)</Text>
      </Box>
    </Box>
  );
};
```

### Deep Object Comparison (for diff)
```typescript
// Pattern from merge.ts - adapt for diff comparison
import { deepMergeConfig } from './merge.js';

// For diff, reverse the comparison
function getChangedFields(base: ClaudeSettings, override: Partial<ClaudeSettings>): string[] {
  const changes: string[] = [];
  
  for (const key in override) {
    const overrideValue = override[key];
    const baseValue = base[key];
    
    if (overrideValue === undefined) continue;  // Skip undefined
    
    if (JSON.stringify(baseValue) !== JSON.stringify(overrideValue)) {
      changes.push(key);
    }
  }
  
  return changes;
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Custom diff implementation | `diff` package (jsdiff) | 2026-04-15 (Phase 8) | Mature library handles edge cases, unified format |
| Manual performance timing | vitest bench mode | 2026-04-15 (Phase 8) | Statistical reliability, integrated reporting |
| Inline validation errors | Full-screen ValidationErrorScreen | 2026-04-15 (Phase 8) | Users see all errors, cannot accidentally proceed |
| Single CLI undo trigger | CLI + TUI dual trigger | 2026-04-15 (Phase 8) | Covers both usage modes, consistent UX |
| Minimal documentation | README + API Docs + Usage Guide | 2026-04-15 (Phase 8) | Complete documentation for different audiences |

**Deprecated/outdated:**
- Manual ANSI escape codes for coloring: Use chalk (already installed)
- Custom benchmark scripts: Use vitest bench (already installed)
- Inline error display for multi-error validation: Use full-screen pattern (ConfirmScreen precedent)

## Open Questions

1. **TypeDoc Configuration**
   - What we know: TypeDoc v0.28.19 available, generates HTML from TypeScript
   - What's unclear: Best configuration for CLI/TUI tool documentation, which files to include/exclude
   - Recommendation: Start with minimal config (include src/lib, exclude tests), expand based on user feedback

2. **Ink Performance Profiling Method**
   - What we know: Ink uses React reconciliation, render timing is asynchronous
   - What's unclear: Best approach for measuring actual render cycles, not setup time
   - Recommendation: Use ink-testing-library renderAndWait, measure after initial render completes, verify with manual stopwatch for critical paths

3. **Undo Command Output Detail**
   - What we know: D-06 specifies single undo, D-07 CLI + TUI triggers
   - What's unclear: Exact message format, whether to show all backups or just latest
   - Recommendation: Show latest backup timestamp, path, and "Time: X minutes ago" format (follow CONTEXT.md specific example)

## Environment Availability

> Phase 8 has external dependencies (diff library, TypeDoc) but all are npm packages.

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Runtime | Yes | v22.x | - |
| npm | Package management | Yes | - | - |
| vitest | Testing/Benchmark | Yes | 3.2.4 | - |
| chalk | Diff coloring | Yes | 5.6.2 | - |
| ink | TUI | Yes | 7.0.0 | - |
| diff | Diff generation | No | 9.0.0 (npm) | Install needed |
| deep-object-diff | Object comparison | No | 1.1.9 (npm) | Install needed |
| TypeDoc | API docs | No | 0.28.19 (npm) | Install needed |

**Missing dependencies with no fallback:**
- None - all are npm packages that can be installed during Phase 8 implementation

**Missing dependencies with fallback:**
- None - standard npm packages

## Validation Architecture

> nyquist_validation enabled in config.json - include this section.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest 3.2.4 |
| Config file | vitest.config.ts (globals: true, coverage: v8) |
| Quick run command | `vitest run src/**/*.test.ts` |
| Full suite command | `vitest run --coverage` |
| Benchmark command | `vitest bench` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| F11 | Config validation UI shows all errors | integration | `vitest run src/tui/screens/ValidationErrorScreen.test.tsx` | Wave 0 |
| F11 | Validation blocks continuation | unit | `vitest run src/lib/types/validation.test.ts` | Yes (existing) |
| F12 | Unified diff generation | unit | `vitest run src/cli/utils/diff.test.ts` | Wave 0 |
| F12 | Diff shows only changed fields | unit | `vitest run src/cli/utils/diff.test.ts::filterChangedFields` | Wave 0 |
| F12 | Diff displayed before apply | integration | `vitest run src/tui/screens/DiffScreen.test.tsx` | Wave 0 |
| U2 | Undo restores latest backup | unit | `vitest run src/lib/services/undo-service.test.ts` | Wave 0 |
| U2 | CLI undo command works | integration | `vitest run src/cli/commands/undo.test.ts` | Wave 0 |
| U2 | TUI 'U' key triggers undo | integration | `vitest run src/tui/screens/ProjectListScreen.test.tsx` | Partial (existing) |
| U5 | Confirmation prompts block destructive actions | unit | `vitest run src/tui/screens/ConfirmScreen.test.tsx` | Yes (existing) |
| N1 | Cold startup < 1s | benchmark | `vitest bench scripts/benchmark.ts::coldStartup` | Wave 0 |
| N2 | Switch operation < 100ms | benchmark | `vitest bench scripts/benchmark.ts::switchOperation` | Wave 0 |
| N3 | 100 project scan < 5s | benchmark | `vitest bench scripts/benchmark.ts::scan100Projects` | Wave 0 |
| N4 | TUI render < 50ms | benchmark | `vitest bench scripts/benchmark.ts::tuiRender100Items` | Wave 0 |
| M1 | Test coverage >= 80% | coverage | `vitest run --coverage` | Partial (795 tests) |

### Sampling Rate
- **Per task commit:** `vitest run src/**/*.test.ts` (quick run, < 2 min)
- **Per wave merge:** `vitest run --coverage` (full suite with coverage)
- **Phase gate:** Full suite green + coverage >= 80% + all benchmarks passing

### Wave 0 Gaps
- [ ] `src/cli/utils/diff.test.ts` — covers F12 unified diff generation
- [ ] `src/cli/utils/diff.ts` — diff utility implementation
- [ ] `src/cli/commands/undo.test.ts` — covers U2 CLI undo
- [ ] `src/cli/commands/undo.ts` — undo command implementation
- [ ] `src/lib/services/undo-service.test.ts` — covers U2 undo service
- [ ] `src/lib/services/undo-service.ts` — undo service wrapper
- [ ] `src/tui/screens/ValidationErrorScreen.test.tsx` — covers F11 validation UI
- [ ] `src/tui/screens/ValidationErrorScreen.tsx` — validation error screen
- [ ] `src/tui/screens/DiffScreen.test.tsx` — covers F12 diff display
- [ ] `src/tui/screens/DiffScreen.tsx` — diff screen implementation
- [ ] `src/tui/components/UnifiedDiff.test.tsx` — covers F12 diff component
- [ ] `src/tui/components/UnifiedDiff.tsx` — unified diff component
- [ ] `scripts/benchmark.ts` — covers N1-N4 performance tests
- [ ] TypeDoc config `typedoc.json` — API documentation setup
- [ ] `docs/api/` output directory — generated API docs

*(If no gaps: "None — existing test infrastructure covers all phase requirements")*
**Wave 0 gaps identified above - new files needed for Phase 8 features.**

### Benchmark Reliability Criteria

To ensure performance benchmarks are reliable:

1. **Statistical sampling:** vitest bench runs each test 10+ times by default, computes median/mean
2. **Warmup phase:** JIT compilation warmup included in bench framework
3. **Environment isolation:** Run benchmarks on dedicated machine or CI with no other processes
4. **Mock data consistency:** Use same mock dataset for all runs (100 mock projects)
5. **Acceptance thresholds:**
   - N1: cold startup median < 1000ms, 90th percentile < 1500ms
   - N2: switch operation median < 100ms, 90th percentile < 200ms
   - N3: scan 100 projects median < 5000ms, 90th percentile < 7500ms
   - N4: TUI render 100 items median < 50ms, 90th percentile < 100ms

## Sources

### Primary (HIGH confidence)
- npm registry: `diff` package v9.0.0 - verified 2026-04-15
- npm registry: `deep-object-diff` package v1.1.9 - verified 2026-04-15
- npm registry: `typedoc` package v0.28.19 - verified 2026-04-15
- Project code: src/lib/file-system/backup.ts - existing implementation
- Project code: src/lib/types/validation.ts - existing implementation
- Project code: src/tui/screens/ConfirmScreen.tsx - existing pattern
- Project code: src/lib/types/merge.ts - deep merge pattern

### Secondary (MEDIUM confidence)
- Vitest documentation: benchmark mode - based on project vitest.config.ts setup
- Ink documentation: testing patterns - based on ink-testing-library in dependencies
- TypeDoc documentation: configuration options - based on npm package info

### Tertiary (LOW confidence)
- Ink performance profiling methods - React DevTools approach assumed but not verified in Ink context
- Benchmark warmup strategies - standard JIT compilation patterns assumed

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries are mature, well-maintained npm packages with proven track records
- Architecture: HIGH - Patterns follow existing project conventions (ConfirmScreen, backup.ts, validation.ts)
- Pitfalls: MEDIUM - Benchmark reliability requires environment control, Ink profiling needs verification

**Research date:** 2026-04-15
**Valid until:** 90 days - Libraries are stable, versions unlikely to change significantly