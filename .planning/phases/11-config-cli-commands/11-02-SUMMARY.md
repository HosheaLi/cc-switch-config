---
phase: 11-config-cli-commands
plan: 02
subsystem: CLI
tags: [config-command, deprecation, integration]
requires: [11-01]
provides: [config-command-registration, wizard-deprecation]
affects: [src/cli/index.ts, src/cli/prompts/wizards/config-wizard.ts]
security_review: true
tech-stack:
  added: []
  patterns: [registerXxxCommand, @deprecated JSDoc]
key-files:
  created: []
  modified:
    - src/cli/index.ts
    - src/cli/prompts/wizards/config-wizard.ts
decisions: [D-02, D-03]
metrics:
  duration: 137s
  completed_date: 2026-04-30
---

# Phase 11 Plan 02: Config Command Integration Summary

**One-liner:** Config command registered to CLI program, config-wizard.ts marked deprecated for Phase 15 removal.

## Tasks Completed

| Task | Name | Commit | Files Modified |
|------|------|--------|----------------|
| 1 | Register config command in CLI program | 2b2e849 | src/cli/index.ts |
| 2 | Mark config-wizard.ts as deprecated | aecbdb3 | src/cli/prompts/wizards/config-wizard.ts |

## Key Decisions

- **D-02:** config-wizard.ts marked deprecated with @deprecated JSDoc, file remains functional for backward compatibility, Phase 15 removes
- **D-03:** registerConfigCommand imported from commands/config.js and registered to program at Phase 11 section

## Implementation Details

### Task 1: Register Config Command

Added import and registration call to src/cli/index.ts:

```typescript
import { registerConfigCommand } from './commands/config.js';

// Phase 11 commands
registerConfigCommand(program);
```

Config command accessible via:
- `cc-config config add/list/remove`
- `cc-config cfg add/list/remove` (alias)

### Task 2: Deprecate config-wizard.ts

Added @deprecated JSDoc annotation with migration guidance:

```typescript
/**
 * @deprecated
 *
 * 此 wizard 已废弃，将在 Phase 15 移除。
 * 请使用 CLI 命令替代：
 * - `cc-config config add` 创建配置
 * - `cc-config config list` 查看配置
 * - `cc-config config remove` 删除配置
 *
 * 迁移说明：
 * - 新 CLI 命令使用 ApiService (Phase 10)
 * - 配置存储为 ApiConfig (unified/granular 模式)
 * - API Key 输入使用 password 类型 (SEC-04)
 */
```

## Verification

- `npm test` passed: 1014 tests
- `grep "registerConfigCommand" src/cli/index.ts` found
- `grep "@deprecated" src/cli/prompts/wizards/config-wizard.ts` found

## Deviations from Plan

None - plan executed exactly as written.

## Threat Flags

None - no new security-relevant surface introduced beyond D-02/D-03 scope.

## Security Analysis

This plan's changes (CLI command registration, deprecation JSDoc) do not introduce new security-sensitive code paths. All API key handling, password input, and validation logic were implemented in Phase 11-01 and already covered by STRIDE threat model in 11-RESEARCH.md.

**Key mitigations from Phase 11-01:**
- T-11-06: API key CLI args blocked by validateNoCliApiKey
- T-11-07: API key sanitized in ValidationError display
- SEC-04: Password-type input via prompts library

**Deprecation security consideration (T-11-09):**
- @deprecated JSDoc documents migration path, no functional change
- Old wizard flow still available until Phase 15 removal
- No security impact from documentation-only change

## Self-Check

- Task 1 commit 2b2e849 verified in git log
- Task 2 commit aecbdb3 verified in git log
- src/cli/index.ts modified as expected
- src/cli/prompts/wizards/config-wizard.ts modified as expected
- All 1014 tests passed