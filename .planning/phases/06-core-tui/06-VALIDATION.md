---
phase: 06
slug: core-tui
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-14
---

# Phase 06 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 3.2.4 (existing) + ink-testing-library 4.0.0 |
| **Config file** | vitest.config.ts (existing) |
| **Quick run command** | `vitest run src/tui/` |
| **Full suite command** | `vitest run` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `vitest run src/tui/`
- **After every plan wave:** Run `vitest run` (full suite)
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 06-01-01 | 01 | 1 | Wave 0 | unit | `vitest run src/tui/hooks/` | ❌ W0 | ⬜ pending |
| 06-01-02 | 01 | 1 | D-05 | unit | `vitest run src/tui/hooks/useKeyInput.test.ts` | ❌ W0 | ⬜ pending |
| 06-01-03 | 01 | 1 | D-02 | unit | `vitest run src/tui/hooks/useNavigation.test.ts` | ❌ W0 | ⬜ pending |
| 06-02-01 | 02 | 1 | F14 | unit | `vitest run src/tui/hooks/useFuzzySearch.test.ts` | ❌ W0 | ⬜ pending |
| 06-03-01 | 03 | 1 | D-12 | integration | `vitest run src/tui/components/` | ❌ W0 | ⬜ pending |
| 06-04-01 | 04 | 2 | F2/U3/U4 | integration | `vitest run src/tui/screens/ProjectListScreen.test.tsx` | ❌ W0 | ⬜ pending |
| 06-05-01 | 05 | 2 | F3 | integration | `vitest run src/tui/screens/ConfigEditorScreen.test.tsx` | ❌ W0 | ⬜ pending |
| 06-06-01 | 06 | 2 | U5 | integration | `vitest run src/tui/screens/ConfirmScreen.test.tsx` | ❌ W0 | ⬜ pending |
| 06-07-01 | 07 | 3 | N4 | performance | `vitest run src/tui/performance.test.ts` | ❌ W0 | ⬜ pending |
| 06-08-01 | 08 | 3 | M4 | integration | `vitest run src/cli/m4-verification.test.ts` | ✅ existing | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `npm install --save-dev ink-testing-library@4.0.0` — Ink test utilities
- [ ] `npm install fuse.js@7.3.0 ink-select-input@6.2.0 ink-text-input@6.0.0 ink-spinner@5.0.0` — TUI dependencies
- [ ] `src/tui/hooks/useKeyInput.test.ts` — covers D-05 j/k mapping
- [ ] `src/tui/hooks/useNavigation.test.ts` — covers D-02 navigation stack
- [ ] `src/tui/hooks/useFuzzySearch.test.ts` — covers F14 fuzzy search
- [ ] `src/tui/screens/ProjectListScreen.test.tsx` — covers F2, U3, U4
- [ ] `src/tui/screens/ConfirmScreen.test.tsx` — covers U5
- [ ] `src/tui/screens/ConfigEditorScreen.test.tsx` — covers F3
- [ ] `src/tui/performance.test.ts` — covers N4 render time

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Terminal rendering appearance | N4 visual | Color/spacing varies by terminal | Run TUI manually, check colors readable |
| Keyboard responsiveness feel | U3 UX | Subjective timing perception | Navigate with j/k and arrows, feel responsive |

---

## M4 Verification Extension

Per constitution.md M4: Services must NOT import ink/react.

Phase 06 TUI layer verification:
```bash
# Verify Services don't import TUI
grep -r "from.*tui" src/lib/services/ && echo "FAIL: Services import TUI" || echo "PASS"

# Verify CLI doesn't import TUI components (except tui-launch)
grep -r "from.*tui/screens" src/cli/ && echo "FAIL: CLI imports TUI screens" || echo "PASS"
grep -r "from.*tui/components" src/cli/ && echo "FAIL: CLI imports TUI components" || echo "PASS"
```

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending

---

*Phase: 06-core-tui*
*Validation strategy created: 2026-04-14*