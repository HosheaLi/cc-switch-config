---
phase: 15
slug: ink-removal
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-08
---

# Phase 15 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | vitest.config.ts |
| **Quick run command** | `npx vitest run --reporter=verbose` |
| **Full suite command** | `npx vitest run --coverage` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --reporter=verbose`
- **After every plan wave:** Run `npx vitest run --coverage`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 15-01-01 | 01 | 1 | TUI-06 | — | N/A | integration | `npx vitest run src/lib/services/__tests__/api-service.test.ts` | ⚠️ W0 | ⬜ pending |
| 15-01-02 | 01 | 1 | CFG-06 | — | N/A | unit | `npx vitest run src/lib/store/__tests__/api-config.test.ts` | ⚠️ W0 | ⬜ pending |
| 15-02-01 | 02 | 1 | TUI-06 | — | N/A | unit | `npx vitest run src/cli/prompts/__tests__/` | ❌ W0 | ⬜ pending |
| 15-03-01 | 03 | 2 | CFG-06 | — | N/A | integration | `npx vitest run src/cli/commands/__tests__/template.test.ts` | ❌ W0 | ⬜ pending |
| 15-04-01 | 04 | 2 | TUI-06 | — | N/A | unit | `npx tsc --noEmit` | ✅ | ⬜ pending |
| 15-05-01 | 05 | 3 | TUI-06/CFG-06 | — | N/A | integration | `npx vitest run` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] Fix broken theme imports in 4 wizard files (TS2307 errors from Phase 14)
- [ ] `src/cli/prompts/__tests__/` — test stubs for ApiConfig wizard migration
- [ ] `src/cli/commands/__tests__/template.test.ts` — update for config command redirect

*If none: "Existing infrastructure covers all phase requirements."*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Bundle size reduction confirmed | TUI-06 | Requires build output size comparison | Run `npx tsup` before and after, compare dist/ sizes |
| No React/Ink in package.json | TUI-06 | Simple grep verification | `grep -E 'ink|react' package.json` should return empty |
| Data migration from templates.json | CFG-06 | Requires fixture file creation | Create test templates.json, run migration, verify api-configs.json output |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
