---
phase: 08
slug: quality-polish
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-15
---

# Phase 08 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 3.2.4 |
| **Config file** | vitest.config.ts (globals: true, coverage: v8) |
| **Quick run command** | `vitest run src/**/*.test.ts` |
| **Full suite command** | `vitest run --coverage` |
| **Benchmark command** | `vitest bench` |
| **Estimated runtime** | ~90 seconds (full suite), ~30 seconds (quick) |

---

## Sampling Rate

- **After every task commit:** Run `vitest run src/**/*.test.ts`
- **After every plan wave:** Run `vitest run --coverage`
- **Before `/gsd:verify-work`:** Full suite must be green + coverage >= 80%
- **Max feedback latency:** 120 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 08-01-01 | 01 | 1 | F12 | unit | `vitest run src/cli/utils/diff.test.ts` | ❌ W0 | ⬜ pending |
| 08-01-02 | 01 | 1 | F12 | unit | `vitest run src/cli/utils/diff.test.ts::filterChangedFields` | ❌ W0 | ⬜ pending |
| 08-02-01 | 02 | 1 | F12 | integration | `vitest run src/tui/screens/DiffScreen.test.tsx` | ❌ W0 | ⬜ pending |
| 08-02-02 | 02 | 1 | F12 | integration | `vitest run src/tui/components/UnifiedDiff.test.tsx` | ❌ W0 | ⬜ pending |
| 08-03-01 | 03 | 2 | F11 | integration | `vitest run src/tui/screens/ValidationErrorScreen.test.tsx` | ❌ W0 | ⬜ pending |
| 08-03-02 | 03 | 2 | F11 | unit | `vitest run src/lib/types/validation.test.ts` | ✅ existing | ⬜ pending |
| 08-04-01 | 04 | 2 | U2 | unit | `vitest run src/lib/services/undo-service.test.ts` | ❌ W0 | ⬜ pending |
| 08-04-02 | 04 | 2 | U2 | integration | `vitest run src/cli/commands/undo.test.ts` | ❌ W0 | ⬜ pending |
| 08-04-03 | 04 | 2 | U2 | integration | `vitest run src/tui/screens/ProjectListScreen.test.tsx` | ✅ existing | ⬜ pending |
| 08-05-01 | 05 | 3 | N1-N4 | benchmark | `vitest bench scripts/benchmark.ts` | ❌ W0 | ⬜ pending |
| 08-06-01 | 06 | 3 | D-09 | manual | README.md + USAGE.md review | ❌ manual | ⬜ pending |
| 08-06-02 | 06 | 3 | D-09 | manual | TypeDoc generation `npm run docs` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/cli/utils/diff.ts` — diff utility implementation (F12)
- [ ] `src/cli/utils/diff.test.ts` — diff utility tests (F12)
- [ ] `src/tui/screens/DiffScreen.tsx` — diff screen implementation (F12)
- [ ] `src/tui/screens/DiffScreen.test.tsx` — diff screen tests (F12)
- [ ] `src/tui/components/UnifiedDiff.tsx` — unified diff component (F12)
- [ ] `src/tui/components/UnifiedDiff.test.tsx` — unified diff tests (F12)
- [ ] `src/tui/screens/ValidationErrorScreen.tsx` — validation error screen (F11)
- [ ] `src/tui/screens/ValidationErrorScreen.test.tsx` — validation error tests (F11)
- [ ] `src/lib/services/undo-service.ts` — undo service wrapper (U2)
- [ ] `src/lib/services/undo-service.test.ts` — undo service tests (U2)
- [ ] `src/cli/commands/undo.ts` — CLI undo command (U2)
- [ ] `src/cli/commands/undo.test.ts` — undo command tests (U2)
- [ ] `scripts/benchmark.ts` — performance benchmark script (N1-N4)
- [ ] `typedoc.json` — TypeDoc configuration (D-09)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| README clarity | D-09 | Documentation quality is subjective | Review README.md for clear quick start, usage examples |
| USAGE guide completeness | D-09 | Coverage of all features | Verify USAGE.md covers all CLI commands and TUI flows |
| API docs accuracy | D-09 | TypeDoc generation output | Run `npm run docs`, verify docs/api/ contains correct signatures |

---

## Benchmark Acceptance Criteria

| Metric | Target | 90th percentile | Test Command |
|--------|--------|-----------------|--------------|
| N1: Cold startup | <1000ms | <1500ms | `vitest bench scripts/benchmark.ts::coldStartup` |
| N2: Switch operation | <100ms | <200ms | `vitest bench scripts/benchmark.ts::switchOperation` |
| N3: 100 project scan | <5000ms | <7500ms | `vitest bench scripts/benchmark.ts::scan100Projects` |
| N4: TUI render 100 items | <50ms | <100ms | `vitest bench scripts/benchmark.ts::tuiRender100Items` |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 120s
- [ ] Coverage >= 80% for core modules
- [ ] All benchmarks pass acceptance criteria
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending

---

*Phase: 08-quality-polish*
*Validation strategy created: 2026-04-15*