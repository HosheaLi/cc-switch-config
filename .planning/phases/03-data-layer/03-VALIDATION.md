---
phase: 03
slug: data-layer
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-13
---

# Phase 03 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 3.2.4 |
| **Config file** | vitest.config.ts |
| **Quick run command** | `npm test` |
| **Full suite command** | `npm run test:coverage` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test`
- **After every plan wave:** Run `npm run test:coverage`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 03-01-01 | 01 | 1 | DATA-01 | unit | `vitest run src/lib/store/config.test.ts` | ❌ W0 | ⬜ pending |
| 03-02-01 | 02 | 1 | DATA-02 | unit | `vitest run src/lib/store/template.test.ts` | ❌ W0 | ⬜ pending |
| 03-03-01 | 03 | 1 | DATA-03 | unit | `vitest run src/lib/store/project.test.ts` | ❌ W0 | ⬜ pending |
| 03-04-01 | 04 | 2 | DATA-04 | unit | `vitest run src/lib/store/watcher.test.ts` | ❌ W0 | ⬜ pending |
| 03-05-01 | 05 | 2 | DATA-05 | unit | `vitest run src/lib/store/state.test.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/lib/store/config.test.ts` — covers ConfigRepository read/write
- [ ] `src/lib/store/template.test.ts` — covers TemplateStore CRUD
- [ ] `src/lib/store/project.test.ts` — covers ProjectIndex lookup/register
- [ ] `src/lib/store/watcher.test.ts` — covers FileWatcher events
- [ ] `src/lib/store/state.test.ts` — covers AppState persistence
- [ ] `src/lib/store/index.ts` — barrel export
- [ ] Framework install: `npm install chokidar@5.0.0`

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| File watcher debounce timing | DATA-04 | Timing-sensitive, hard to automate reliably | Create test file, edit rapidly, verify single callback after stability threshold |
| TUI sync prompt on global change | DATA-04 | Requires TUI context running | Run TUI, modify global config externally, verify prompt appears |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending