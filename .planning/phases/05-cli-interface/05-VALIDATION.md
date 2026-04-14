---
phase: 05
slug: cli-interface
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-14
---

# Phase 05 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 3.2.4 |
| **Config file** | vitest.config.ts |
| **Quick run command** | `npm test` |
| **Full suite command** | `npm run test:coverage` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test`
- **After every plan wave:** Run `npm run test:coverage`
- **Before `/gsd:verify-work`:** Full suite must be green, ≥80% coverage for CLI module
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 05-01-01 | 01 | 1 | Wave 0 | unit | `vitest run src/cli/index.test.ts` | ❌ W0 | ⬜ pending |
| 05-01-02 | 01 | 1 | Wave 0 | unit | `vitest run src/cli/output/error.test.ts` | ❌ W0 | ⬜ pending |
| 05-02-01 | 02 | 2 | F4 | unit | `vitest run src/cli/commands/list.test.ts` | ❌ W0 | ⬜ pending |
| 05-02-02 | 02 | 2 | F4, --json | unit | `vitest run src/cli/commands/list.test.ts` | ❌ W0 | ⬜ pending |
| 05-03-01 | 03 | 2 | F5 | unit | `vitest run src/cli/commands/switch.test.ts` | ❌ W0 | ⬜ pending |
| 05-03-02 | 03 | 2 | F5, TUI fallback | unit | `vitest run src/cli/commands/switch.test.ts` | ❌ W0 | ⬜ pending |
| 05-04-01 | 04 | 3 | F6 | unit | `vitest run src/cli/commands/current.test.ts` | ❌ W0 | ⬜ pending |
| 05-05-01 | 05 | 3 | F7 | unit | `vitest run src/cli/commands/template.test.ts` | ❌ W0 | ⬜ pending |
| 05-05-02 | 05 | 3 | F7, CRUD | unit | `vitest run src/cli/commands/template.test.ts` | ❌ W0 | ⬜ pending |
| 05-06-01 | 06 | 3 | D-05 | unit | `vitest run src/cli/output/table.test.ts` | ❌ W0 | ⬜ pending |
| 05-06-02 | 06 | 3 | M4 | unit | `vitest run src/cli/index.test.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/cli/index.test.ts` — CLI entry point tests (help, TUI launch, parseAsync)
- [ ] `src/cli/commands/list.test.ts` — list command tests (table output, JSON option)
- [ ] `src/cli/commands/switch.test.ts` — switch command tests (argument parsing, TUI fallback)
- [ ] `src/cli/commands/current.test.ts` — current command tests (active config display)
- [ ] `src/cli/commands/template.test.ts` — template subcommand tests (list/create/delete)
- [ ] `src/cli/output/table.test.ts` — table formatting tests (cli-table3 integration)
- [ ] `src/cli/output/error.test.ts` — error handling tests (exit codes, ServiceError mapping)
- [ ] Test utilities: mock Commander program, mock Services instances

*Existing infrastructure (vitest.config.ts) covers framework requirements.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| NO_COLOR environment variable | D-03, chalk | Environment-dependent | Run `NO_COLOR=1 cc-config list`, verify no ANSI codes |
| TTY detection | D-03, stderr | CI vs terminal | Run `cc-config list | cat`, verify output stream |
| Shebang execution | D-08 | npm install test | `npm link`, then `cc-config --help` |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending