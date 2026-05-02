# Phase 14: Terminal Aesthetic - Validation

**Created:** 2026-05-03
**Purpose:** Document Wave 0 test file paths per RESEARCH.md Validation Architecture section

<test_framework>
## Test Framework Configuration

| Property | Value |
|----------|-------|
| Framework | Vitest |
| Config file | `vitest.config.ts` |
| Quick run command | `vitest run src/cli/theme/*.test.ts` |
| Full suite command | `npm test` |

</test_framework>

<wave_zero_tests>
## Wave 0 Test Files (Nyquist Compliance)

Wave 0 (14-01-PLAN.md) creates test scaffolds for all theme module components. These test files ensure TDD coverage from Wave 1 onward.

### Test Files Created

| File Path | Purpose | Requirements Covered |
|-----------|---------|---------------------|
| `src/cli/theme/theme.test.ts` | Theme module integration tests | UI-01, UI-04, UI-05 |
| `src/cli/theme/colors.test.ts` | Color definitions tests | UI-01, UI-04 |
| `src/cli/theme/borders.test.ts` | Border characters tests | UI-03 |
| `src/cli/theme/detection.test.ts` | Terminal detection tests | UI-05, UI-06 |

### Test Scaffold Structure

Each test file created by Wave 0 contains:
- `import { describe, it, expect } from 'vitest'`
- `describe()` block matching module name
- At least 2 placeholder `it()` blocks
- Passes when run: `vitest run src/cli/theme/*.test.ts`

</wave_zero_tests>

<requirements_coverage>
## Phase Requirements → Test Coverage Map

| Req ID | Description | Test File | Test Type |
|--------|-------------|-----------|-----------|
| UI-01 | OpenCode warm color palette | `theme.test.ts`, `colors.test.ts` | unit |
| UI-02 | Monospace typography | — | manual (terminal config) |
| UI-03 | Flat depth system (borders) | `borders.test.ts` | unit |
| UI-04 | Apple HIG semantic colors | `colors.test.ts` | unit |
| UI-05 | NO_COLOR environment variable | `theme.test.ts`, `detection.test.ts` | unit |
| UI-06 | Windows terminal detection | `detection.test.ts` | unit |

</requirements_coverage>

<sampling_rates>
## Validation Sampling Rates

| Stage | Command | Scope |
|-------|---------|-------|
| Per task commit | `vitest run src/cli/theme/*.test.ts` | Theme module only |
| Per wave merge | `npm test` | Full project suite |
| Phase gate | Full suite green | Pre-verification requirement |

</sampling_rates>

<existing_tests>
## Existing Test Infrastructure

| File | Status | Notes |
|------|--------|-------|
| `vitest.config.ts` | EXISTS | No changes needed |
| `src/cli/output/table.test.ts` | EXISTS | May need updates for theme colors (Wave 2) |
| `src/cli/utils/diff-render.test.ts` | EXISTS | May need updates for theme colors (Wave 2) |

</existing_tests>

<verification_commands>
## Verification Commands

### Wave 0 Completion Verification
```bash
# Verify all test scaffolds exist
ls -la src/cli/theme/*.test.ts

# Verify tests pass
vitest run src/cli/theme/*.test.ts
```

### Phase Completion Verification
```bash
# Full test suite
npm test

# NO_COLOR specific tests
NO_COLOR=1 vitest run src/cli/theme/*.test.ts
```

</verification_commands>

---

*Validation architecture documented. Wave 0 creates test scaffolds.*