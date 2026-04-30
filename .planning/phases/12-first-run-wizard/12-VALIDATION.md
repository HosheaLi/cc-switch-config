---
phase: 12
slug: first-run-wizard
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-30
---

# Phase 12 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 3.2.4 |
| **Config file** | vitest.config.ts |
| **Quick run command** | `npm test` or `vitest run` |
| **Full suite command** | `npm run test:coverage` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `vitest run src/lib/services/project-service.test.ts -t "scanProjects"`
- **After every plan wave:** Run `vitest run src/lib/services/project-service.test.ts`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 12-01-01 | 01 | 1 | ONB-02 | T-12-01 | AppState schema evolution with defaults | unit | `vitest run src/lib/store/state.test.ts` | ✅ Update needed | ⬜ pending |
| 12-02-01 | 02 | 1 | ONB-04 | — | DEFAULT_SKIP_DIRS constant creation | unit | `vitest run src/lib/constants/skip-dirs.test.ts` | ❌ W0 | ⬜ pending |
| 12-03-01 | 03 | 1 | ONB-03 | T-12-02 | walkDirectory Promise.all with independent catch | unit | `vitest run src/lib/services/project-service.test.ts` | ✅ Update needed | ⬜ pending |
| 12-04-01 | 04 | 1 | ONB-01/02 | T-12-03 | CLI first-run detection triple condition | integration | `vitest run src/cli/index.test.ts` | ✅ Update needed | ⬜ pending |
| 12-05-01 | 05 | 2 | ONB-05 | — | Spinner visual verification | manual | Manual verification during first-run wizard | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/cli/index.test.ts` — Add first-run detection integration test
- [ ] `src/lib/store/state.test.ts` — Add firstRunCompleted/skipDirectories field tests
- [ ] `src/lib/constants/skip-dirs.test.ts` — New file for DEFAULT_SKIP_DIRS constant tests
- [ ] `src/lib/services/project-service.test.ts` — Update parallel scan tests (Promise.all + independent catch)
- [ ] Manual test checklist: Spinner visual verification during first-run wizard

*Existing infrastructure covers walkDirectory behavior, needs update for parallel scanning.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Spinner animation display | ONB-05 | Visual output requires human verification | 1. Run `cc-config` with no args on clean state 2. Observe spinner during scan 3. Verify frames rotate correctly 4. Check success message shows project count |

*All other phase behaviors have automated verification.*

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending