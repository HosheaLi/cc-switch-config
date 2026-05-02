---
phase: 13
slug: switch-flow
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-02
---

# Phase 13 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | vitest.config.ts |
| **Quick run command** | `npm test -- --run` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test -- --run src/cli/commands/switch.test.ts src/cli/utils/diff-render.test.ts src/cli/prompts/components/select-api-config.test.ts`
- **After every plan wave:** Run `npm test`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 20 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 13-01-01 | 01 | 1 | CFG-05 | — | Project lookup validates input, no path traversal | unit | `npm test -- --run src/cli/commands/switch.test.ts` | ❌ W0 | ⬜ pending |
| 13-01-02 | 01 | 1 | CFG-05 | T-13-01 | API key masked in diff output | unit | `npm test -- --run src/cli/utils/diff-render.test.ts` | ❌ W0 | ⬜ pending |
| 13-02-01 | 02 | 1 | ONB-06 | — | Config selection returns valid ApiConfig | unit | `npm test -- --run src/cli/prompts/components/select-api-config.test.ts` | ❌ W0 | ⬜ pending |
| 13-03-01 | 03 | 1 | CFG-05 | T-13-02 | Confirm default='n', no auto-apply | unit | `npm test -- --run src/cli/commands/switch.test.ts` | ❌ W0 | ⬜ pending |
| 13-04-01 | 04 | 1 | CFG-05, ONB-06 | — | End-to-end switch flow with mocked stores | integration | `npm test -- --run src/cli/commands/switch.test.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/cli/commands/switch.test.ts` — comprehensive tests for refactored switch command
- [ ] `src/cli/utils/diff-render.test.ts` — tests for new diff rendering utility
- [ ] `src/cli/prompts/components/select-api-config.test.ts` — tests for new selectApiConfig component

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Diff ANSI color rendering in terminal | ONB-06 | Color perception varies by terminal | Run `cc-config switch <project>` and visually verify red/green diff colors |
| Ctrl+C cancel behavior | CFG-05 | Process signal handling | Run switch, press Ctrl+C at confirm prompt, verify graceful exit message |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 20s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending