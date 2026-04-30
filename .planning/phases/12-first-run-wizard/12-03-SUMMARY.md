---
plan: 12-03
phase: 12-first-run-wizard
status: complete
completed: 2026-04-30T23:07:00Z
requirements: [ONB-01, ONB-02]
---

# Plan 12-03: CLI 首次运行检测

## Objective
Implement first-run detection at CLI entry point with triple condition check, and set firstRunCompleted flag after wizard completion.

## What Was Built
- **Triple condition check** — Detects genuinely new users: firstRunCompleted=false + no configs + no projects
- **First-run wizard trigger** — Launches launchPromptsTUI when all conditions are empty
- **Flag setting** — Sets firstRunCompleted=true after wizard completes
- **Fallback to normal TUI** — Existing users see normal TUI (launchTUI)
- **CLI command bypass** — Command args (args.length > 0) bypass detection entirely

## Key Files

| File | Purpose |
|------|---------|
| src/cli/index.ts | First-run detection logic at entry point |
| src/cli/index.test.ts | Tests for detection logic and imports |

## Deviations
None. All acceptance criteria met.

## Tests
- 7 tests passed in index.test.ts
- Tests verify: triple condition check, flag setting, fallback, import paths

## Self-Check: PASSED

### Acceptance Criteria Verification
- [x] src/cli/index.ts imports AppState
- [x] src/cli/index.ts imports ApiConfigStore
- [x] src/cli/index.ts imports ProjectIndex
- [x] src/cli/index.ts imports launchPromptsTUI
- [x] src/cli/index.ts contains triple condition check `!firstRunCompleted && !hasConfigs && !hasProjects`
- [x] src/cli/index.ts contains `appState.set('firstRunCompleted', true)`
- [x] src/cli/index.ts contains fallback `await launchTUI()`
- [x] `vitest run src/cli/index.test.ts` exits 0

### Wizard Flow Completeness (Task 02)
- [x] main-wizard.ts contains inputFullApiConfig (L82)
- [x] main-wizard.ts contains selectDirectory (L109)
- [x] main-wizard.ts contains scanProjects (L114)
- [x] main-wizard.ts contains selectFromScanResults (L124)
- [x] main-wizard.ts contains selectTemplate (L150)
- [x] main-wizard.ts contains confirmAction (L160)
- [x] main-wizard.ts contains applyTemplate (L166)
- [x] main-wizard.ts contains createSpinner (L22)

## Notes
Per D-01, D-02, D-04 from RESEARCH.md:
- D-01: Trigger at no-args invocation (args.length === 0)
- D-02: Triple condition check prevents false positives
- D-04: Set flag after wizard completion