---
security_review: true
phase: 10-config-service
plan: 01
subsystem: types
tags: [zod, schema, validation, field-replacement, config]

# Dependency graph
requires:
  - phase: 08-quality
    provides: ClaudeSettings schema, deepMergeConfig pattern (preserved, not modified)
provides:
  - ApiConfig type definitions with unified/granular mode validation
  - replaceEnvModel function for precise env/model field replacement
  - buildUnifiedEnv helper for standard env generation
affects: [11-config-cli, 12-first-run, 13-switch-flow]

# Tech tracking
tech-stack:
  added: []
  patterns: [zod refine validation, spread operator replacement, strict schema mode]

key-files:
  created:
    - src/lib/types/api-config.ts
    - src/lib/types/api-config.test.ts
    - src/lib/types/replacement.ts
    - src/lib/types/replacement.test.ts
  modified: []

key-decisions:
  - "D-01: ApiConfig uses name/apiKey/baseUrl/mode/modelName/env fields"
  - "D-02: mode field supports unified and granular modes"
  - "D-12: New replaceEnvModel function (not modifying deepMergeConfig)"
  - "D-13: Complete replacement of env/model (not merge)"

patterns-established:
  - "Zod .refine() for conditional validation (mode-specific required fields)"
  - "Spread operator for precise field replacement preserving other fields"
  - "MaskedApiConfig type for display contexts (CFG-04)"

requirements-completed: [CFG-01, CFG-02]

# Metrics
duration: 5min
completed: 2026-04-30
---

# Phase 10 Plan 01: Config Type Definitions Summary

**ApiConfig schema with unified/granular mode validation and replaceEnvModel function for precise field replacement preserving permissions/hooks/mcpServers**

## Performance

- **Duration:** 4 min 30 sec
- **Started:** 2026-04-30T11:17:31Z
- **Completed:** 2026-04-30T11:21:56Z
- **Tasks:** 2
- **Files modified:** 4 (all new)

## Accomplishments

- ApiConfig type with Zod schema validation (name/apiKey/baseUrl/mode fields)
- Conditional validation via .refine() for unified/granular mode requirements
- MaskedApiConfig type for secure display contexts
- replaceEnvModel function implementing CFG-02 precise field replacement
- buildUnifiedEnv helper generating 7 standard env vars for unified mode

## Task Commits

Each task was committed atomically:

1. **Task 1: ApiConfig type definitions** - `9854877` (feat)
2. **Task 2: replaceEnvModel function** - `fbbd7f1` (feat)

## Files Created/Modified

- `src/lib/types/api-config.ts` - ApiConfigSchema, ApiConfigModeSchema, MaskedApiConfig type
- `src/lib/types/api-config.test.ts` - 26 tests for schema validation
- `src/lib/types/replacement.ts` - replaceEnvModel function, buildUnifiedEnv helper
- `src/lib/types/replacement.test.ts` - 16 tests for field replacement

## Decisions Made

- Used Zod .refine() for conditional mode validation (unified requires modelName, granular requires env)
- Spread operator for precise replacement (...existing, env: newEnv) - simpler than deep merge
- 7 env vars generated for unified mode (5 model vars + apiKey + baseUrl)
- All tests follow existing provider.test.ts pattern

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed test comment mismatch in buildUnifiedEnv test**
- **Found during:** Task 2 GREEN phase
- **Issue:** Test comment said "6 keys" but implementation generates 7 keys
- **Fix:** Corrected test expectation from 6 to 7
- **Files modified:** src/lib/types/replacement.test.ts
- **Verification:** All 16 tests pass
- **Committed in:** fbbd7f1 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Minor test comment fix. No scope creep.

## Issues Encountered

None - plan executed smoothly following TDD pattern.

## Security Analysis

### STRIDE Threat Model Coverage

| Threat Category | Mitigation | Implementation |
|-----------------|------------|----------------|
| **Tampering (T-10-06)** | Zod .strict() rejects unknown fields | ApiConfigSchema.strict() prevents injection via extra fields |
| **Information Disclosure (T-10-03)** | MaskedApiConfig type | apiKey masked in display contexts (...last4 format) |
| **Information Disclosure** | URL validation | Zod .url() validates baseUrl, prevents malicious URLs |

### Security Controls Implemented

1. **Schema Strict Mode**: ApiConfigSchema uses `.strict()` to reject unknown fields, preventing injection attacks via extra configuration properties.

2. **MaskedApiConfig Type**: Separate type for display contexts where apiKey should not be exposed (preview, diff, logs, screenshots).

3. **URL Validation**: baseUrl field validated with Zod `.url()` to prevent injection of malicious endpoints.

### Threat Flags

No new threat surfaces introduced beyond those in the plan's threat_model.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- ApiConfig types ready for Phase 11 (CLI commands)
- replaceEnvModel ready for Phase 13 (switch flow)
- MaskedApiConfig ready for display contexts in Phase 14

---
*Phase: 10-config-service*
*Completed: 2026-04-30*

## Self-Check: PASSED

- [x] src/lib/types/api-config.ts EXISTS
- [x] src/lib/types/api-config.test.ts EXISTS
- [x] src/lib/types/replacement.ts EXISTS
- [x] src/lib/types/replacement.test.ts EXISTS
- [x] 10-01-SUMMARY.md EXISTS
- [x] Commit 9854877 EXISTS
- [x] Commit fbbd7f1 EXISTS