---
phase: 11
slug: config-cli-commands
status: draft
nyquist_compliant: false
wave_0_complete: false
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
| 11-01-01 | 01 | 1 | CFG-03 | T-11-01 | CLI command registers config subcommand | unit | `vitest run src/cli/commands/config.test.ts -t "register"` | ❌ W0 | ⬜ pending |
| 11-01-02 | 01 | 1 | CFG-03 | — | config add executes with prompts | integration | `vitest run src/cli/commands/config.test.ts -t "add"` | ❌ W0 | ⬜ pending |
| 11-02-01 | 02 | 1 | CFG-03 | — | config list outputs table format | unit | `vitest run src/cli/commands/config.test.ts -t "list"` | ❌ W0 | ⬜ pending |
| 11-02-02 | 02 | 1 | SEC-04 | T-11-06 | API key masked in list output | unit | `vitest run src/cli/commands/config.test.ts -t "list mask"` | ❌ W0 | ⬜ pending |
| 11-03-01 | 03 | 1 | CFG-03 | — | config remove executes with confirmation | integration | `vitest run src/cli/commands/config.test.ts -t "remove"` | ❌ W0 | ⬜ pending |
| 11-03-02 | 03 | 1 | SEC-02 | — | Validation errors grouped by field | unit | `vitest run src/cli/commands/config.test.ts -t "validation"` | ❌ W0 | ⬜ pending |
| 11-04-01 | 04 | 2 | SEC-04 | T-11-05 | Password input for API key (auto-clear) | unit | `vitest run src/cli/prompts/components/input-api-key.test.ts -t "password"` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/cli/commands/config.test.ts` — covers CFG-03, SEC-02, SEC-04
- [ ] `src/cli/prompts/components/input-api-key.test.ts` — covers SEC-04 (password input)
- [ ] Test mocks for ApiService/ApiConfigStore — needed for command tests
- [ ] Test fixtures for ValidationError — needed for error display tests

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

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending