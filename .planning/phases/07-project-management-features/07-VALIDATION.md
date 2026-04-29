---
phase: 07-project-management-features
slug: project-management-features
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-14
---

# Phase 7 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 3.2.4 |
| **Config file** | vitest.config.ts |
| **Quick run command** | `npm test -- src/**/*.test.ts --run` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test -- src/**/*.test.ts --run`
- **After every plan wave:** Run `npm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 07-01-01 | 01 | 1 | F9 | unit | `npm test -- src/cli/commands/auto-check.test.ts --run` | ❌ W0 | ⬜ pending |
| 07-01-02 | 01 | 1 | F9 | unit | `npm test -- src/cli/utils/auto-switch.test.ts --run` | ❌ W0 | ⬜ pending |
| 07-02-01 | 02 | 2 | F10 | unit | `npm test -- src/cli/commands/scan.test.ts --run` | ❌ W0 | ⬜ pending |
| 07-02-02 | 02 | 2 | F10 | unit | `npm test -- src/tui/screens/ScanScreen.test.tsx --run` | ❌ W0 | ⬜ pending |
| 07-03-01 | 03 | 3 | F13 | unit | `npm test -- src/lib/types/export-schema.test.ts --run` | ❌ W0 | ⬜ pending |
| 07-03-02 | 03 | 3 | F13 | unit | `npm test -- src/lib/services/export-service.test.ts --run` | ❌ W0 | ⬜ pending |
| 07-03-03 | 03 | 3 | F13 | unit | `npm test -- src/cli/commands/export.test.ts --run` | ❌ W0 | ⬜ pending |
| 07-03-04 | 03 | 3 | F13 | unit | `npm test -- src/cli/commands/import.test.ts --run` | ❌ W0 | ⬜ pending |
| 07-03-05 | 03 | 3 | F13 | unit | `npm test -- src/tui/screens/ImportConflictScreen.test.tsx --run` | ❌ W0 | ⬜ pending |
| 07-04-01 | 04 | 4 | F9/F10/F13 | integration | `npm test --run` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/cli/commands/auto-check.test.ts` — F9 auto-switch tests
- [ ] `src/cli/utils/auto-switch.test.ts` — shell hook tests
- [ ] `src/cli/commands/scan.test.ts` — F10 CLI scan tests
- [ ] `src/tui/screens/ScanScreen.test.tsx` — F10 multi-select tests
- [ ] `src/lib/types/export-schema.test.ts` — F13 schema validation tests
- [ ] `src/lib/services/export-service.test.ts` — F13 export/import tests
- [ ] `src/cli/commands/export.test.ts` — F13 export CLI tests
- [ ] `src/cli/commands/import.test.ts` — F13 import CLI tests
- [ ] `src/tui/screens/ImportConflictScreen.test.tsx` — F13 conflict UI tests
- [ ] Update tests in existing modules: `src/cli/index.test.ts`, `src/tui/App.test.tsx`

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Shell hook installation | F9 | Requires shell environment setup | Add hook to bashrc/zshrc, cd between registered projects, verify switch message |
| Auto-switch prompt timing | F9 | Requires persisted state | Enter unregistered .claude dir twice, verify prompt only on first entry |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending