---
phase: 11
slug: config-cli-commands
status: ready
nyquist_compliant: true
wave_0_complete: true
created: 2026-04-30
---

# Phase 11 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 3.2.4 |
| **Config file** | vitest.config.ts |
| **Quick run command** | `npm test` (or `vitest run`) |
| **Full suite command** | `npm test:coverage` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test`
- **After every plan wave:** Run `npm test:coverage`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 11-01-01 | 01 | 1 | CFG-03 | T-11-03 | CLI command registers config subcommand | unit | `npm test -- src/cli/commands/config.test.ts` | ✅ W0 created | ⬜ pending |
| 11-01-02 | 01 | 1 | SEC-04 | T-11-04 | password input for API key (auto-clear) | unit | `npm test -- src/cli/commands/config.test.ts` | ✅ W0 created | ⬜ pending |
| 11-02-01 | 02 | 1 | CFG-03 | — | config list outputs table format | unit | `npm test -- src/cli/commands/config.test.ts` | ✅ W0 created | ⬜ pending |
| 11-02-02 | 02 | 1 | SEC-04 | T-11-06 | API key masked in list output | unit | `npm test -- src/cli/commands/config.test.ts` | ✅ W0 created | ⬜ pending |
| 11-03-01 | 03 | 1 | CFG-03 | T-11-08 | config remove executes with confirmation | integration | `npm test -- src/cli/commands/config.test.ts` | ✅ W0 created | ⬜ pending |
| 11-03-02 | 03 | 1 | SEC-02 | T-11-07 | Validation errors grouped by field | unit | `npm test -- src/cli/commands/config.test.ts` | ✅ W0 created | ⬜ pending |
| 11-04-01 | 04 | 2 | CFG-03 | T-11-10 | registerConfigCommand integrated | unit | `npm test` | ✅ existing tests | ⬜ pending |
| 11-04-02 | 04 | 2 | — | T-11-09 | config-wizard deprecated | manual | `grep "@deprecated"` | ✅ verify script | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [x] `src/cli/commands/config.test.ts` — covers CFG-03, SEC-02, SEC-04 (created in 11-01)
- [x] `src/cli/prompts/components/input-api-key.test.ts` — covers SEC-04 (existing from Phase 10)
- [x] Test mocks for ApiService/ApiConfigStore — pattern from template.test.ts
- [x] Test fixtures for ValidationError — pattern from validation.test.ts

*Existing infrastructure from Phase 10: input-api-key.ts, ApiService, ApiConfigStore available.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Password input terminal UX | SEC-04 | prompts password type requires terminal interaction | Run `cc-config config add` and verify API key field shows `****` not echo |
| Table output format visual check | CFG-03 | Alignment and colors require visual verification | Run `cc-config config list` with 2+ configs and verify table layout |
| Ctrl+C cancellation flow | SEC-02 | Terminal signal handling needs manual test | Run `cc-config config add`, press Ctrl+C at any prompt, verify graceful exit |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 30s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** ready for execution