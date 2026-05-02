---
phase: 13
plan: 01
subsystem: switch-flow
wave: 0
tags:
  - tdd
  - test-scaffold
  - wave-0
dependency_graph:
  requires: []
  provides:
    - test-scaffold-switch-command
    - test-scaffold-diff-render
    - test-scaffold-select-api-config
  affects:
    - 13-02-PLAN.md (Wave 1 implementation)
    - 13-03-PLAN.md (Wave 2 implementation)
tech_stack:
  added:
    - vitest todo markers
  patterns:
    - TDD Wave 0 scaffold pattern
key_files:
  created:
    - src/cli/commands/switch.test.ts (174 lines)
    - src/cli/utils/diff-render.test.ts (136 lines)
    - src/cli/prompts/components/select-api-config.test.ts (150 lines)
  modified: []
decisions: []
metrics:
  duration: 5min
  test_count: 121 todo tests
  completed_date: "2026-05-02"
---

# Phase 13 Plan 01: Wave 0 Test Scaffolds Summary

## One-liner

Created three test scaffold files for Phase 13 switch flow with 121 placeholder tests using vitest todo() markers, ready for TDD RED state in Wave 1-2.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create switch.test.ts scaffold | 66515a3 | src/cli/commands/switch.test.ts |
| 2 | Create diff-render.test.ts scaffold | c0999ca | src/cli/utils/diff-render.test.ts |
| 3 | Create select-api-config.test.ts scaffold | 6b46b0f | src/cli/prompts/components/select-api-config.test.ts |

## Test Coverage Structure

### switch.test.ts (42 tests)

- argument parsing (5 tests) - D-01, D-02
- project lookup (5 tests) - D-02
- config selection (5 tests) - D-03
- diff preview (9 tests) - D-04, D-05, D-06
- confirmation (5 tests) - D-07, D-08
- cancellation (4 tests) - D-09
- success path (5 tests) - Wave 2
- error handling (4 tests) - Wave 2

### diff-render.test.ts (41 tests)

- header format (4 tests) - D-05
- removed lines (5 tests) - D-06
- added lines (5 tests) - D-06
- modified lines (6 tests) - D-06
- empty diff (3 tests)
- value truncation (4 tests)
- output format (4 tests)
- edge cases (7 tests) - Wave 2
- security (3 tests) - Wave 2

### select-api-config.test.ts (38 tests)

- empty configs (4 tests)
- single config (4 tests)
- multiple configs (5 tests) - TUI-04
- cancellation (4 tests) - TUI-05
- description format (4 tests)
- choice structure (4 tests) - Wave 2
- autocomplete behavior (4 tests) - Wave 2
- edge cases (5 tests) - Wave 2
- return value (4 tests) - Wave 2

## Deviations from Plan

None - plan executed exactly as written.

## Verification Results

```
Test Files  3 skipped (3)
     Tests  121 todo (121)
  Duration  206ms
```

All todo tests pass by default - scaffolds ready for TDD implementation.

## Threat Model Notes

Wave 0 scaffolds have no executable code - threats documented for Wave 1-2 implementation:
- T-13-01: maskApiKey in diff rendering (Wave 1)
- T-13-02: defaultChoice=false in confirmAction (existing)

## Next Steps

Wave 1 (13-02-PLAN.md): Implement core tests for RED state
- renderDiff function implementation
- selectApiConfig component implementation
- Switch command argument parsing

Wave 2 (13-03-PLAN.md): Complete implementation for GREEN state
- Full switch command flow
- Error handling
- Integration tests

## Self-Check: PASSED

- [x] src/cli/commands/switch.test.ts exists with describe('switch command')
- [x] src/cli/utils/diff-render.test.ts exists with describe('renderDiff')
- [x] src/cli/prompts/components/select-api-config.test.ts exists with describe('selectApiConfig')
- [x] All test scaffolds follow vitest pattern (describe/it/expect)
- [x] All placeholder tests use todo() markers for TDD RED state
- [x] All commits exist in git log