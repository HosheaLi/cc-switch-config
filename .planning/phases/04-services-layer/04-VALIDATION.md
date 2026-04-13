---
phase: 04
slug: services-layer
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-13
---

# Phase 04 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 3.2.4 |
| **Config file** | vitest.config.ts |
| **Quick run command** | `npm test` |
| **Full suite command** | `npm run test:coverage` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test`
- **After every plan wave:** Run `npm run test:coverage`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 04-01-01 | 01 | 1 | ServiceError | unit | `vitest run src/lib/services/types.test.ts` | ❌ W0 | ⬜ pending |
| 04-02-01 | 02 | 1 | F1 | unit | `vitest run src/lib/services/config-service.test.ts` | ❌ W0 | ⬜ pending |
| 04-03-01 | 03 | 2 | F4 | unit | `vitest run src/lib/services/project-service.test.ts` | ❌ W0 | ⬜ pending |
| 04-04-01 | 04 | 2 | F7 | unit | `vitest run src/lib/services/template-service.test.ts` | ❌ W0 | ⬜ pending |
| 04-05-01 | 05 | 3 | D-06 | unit | `vitest run src/lib/services/provider-service.test.ts` | ❌ W0 | ⬜ pending |
| 04-06-01 | 06 | 3 | D-07 | integration | Verify exports in index.ts | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/lib/services/types.ts` — ServiceError class definition
- [ ] `src/lib/services/types.test.ts` — ServiceError unit tests
- [ ] `src/lib/services/config-service.test.ts` — stubs for F1
- [ ] `src/lib/services/project-service.test.ts` — stubs for F4
- [ ] `src/lib/services/template-service.test.ts` — stubs for F7
- [ ] `src/lib/services/provider-service.test.ts` — stubs for connectivity
- [ ] Existing infrastructure covers all phase requirements (vitest.config.ts present)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Services no UI imports | M4 | Import graph verification | Run: `grep -r "from.*tui\|from.*ink" src/lib/services/` — expect empty |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending