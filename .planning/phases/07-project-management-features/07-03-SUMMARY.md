---
phase: 07-project-management-features
plan: 03
subsystem: api
tags: [export, import, json, schema, conflict-resolution, tui]

# Dependency graph
requires:
  - phase: 06-core-tui
    provides: TUI foundation (useNavigation, useInput, screen patterns)
provides:
  - ExportPayload schema for config backup/migration
  - ExportService for export/import operations
  - CLI export/import commands
  - ImportConflictScreen TUI for conflict resolution
affects: [08-quality-polish]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Zod schema for export payload validation"
    - "Conflict detection comparing env, model, mcpServers fields"
    - "Deep merge for import merge strategy"

key-files:
  created:
    - src/lib/types/export-schema.ts
    - src/lib/services/export-service.ts
    - src/cli/commands/export.ts
    - src/cli/commands/import.ts
    - src/tui/screens/ImportConflictScreen.tsx
  modified:
    - src/lib/types/index.ts
    - src/tui/hooks/useNavigation.ts

key-decisions:
  - "ExportPayload uses strict Zod schema with version 1.0 literal"
  - "Conflict detection compares fields where existing value differs from imported"
  - "Import strategies: merge (preserve existing + add new), overwrite (replace), skip (discard)"

patterns-established:
  - "Export schema: metadata + project ref + settings + template nullable"
  - "Conflict resolution: merge/overwrite/skip options via number keys 1/2/3"
  - "TUI screen pattern: header cyan bold, conflict list yellow border, options numbered"

requirements-completed: [F13]

# Metrics
duration: 12min
completed: 2026-04-14
---
# Phase 07 Plan 03: Import/Export Configs (F13) Summary

**Config import/export with JSON schema validation, conflict detection, and interactive resolution UI**

## Performance

- **Duration:** 12 min
- **Started:** 2026-04-14T15:19:33Z
- **Completed:** 2026-04-14T15:31:40Z
- **Tasks:** 5
- **Files modified:** 7

## Accomplishments

- ExportPayload Zod schema with metadata (version 1.0, exportedAt, toolVersion), project reference, settings, and nullable template
- ExportService class with exportProject, detectConflicts, and importProject methods with merge/overwrite/skip strategies
- CLI export command with --output and --stdout options, using active project fallback
- CLI import command with --strategy and --target options, interactive conflict detection, and TUI launch
- ImportConflictScreen TUI with yellow-bordered conflict list, numbered resolution options (1/2/3), and Esc cancellation

## Task Commits

Each task was committed atomically:

1. **Task 07-03-01: Create export schema** - `e38e394` (feat)
2. **Task 07-03-02: Create export service** - `9548d52` (feat)
3. **Task 07-03-03: Create export CLI command** - `14a9eb1` (feat)
4. **Task 07-03-04: Create import CLI command** - `2a510a9` (feat)
5. **Task 07-03-05: Create ImportConflictScreen TUI** - `cc0012b` (feat)

**Plan metadata:** Pending commit after SUMMARY creation

## Files Created/Modified

- `src/lib/types/export-schema.ts` - Zod schemas for ExportPayload, ExportMetadata, ProjectRef, ConflictField interface
- `src/lib/services/export-service.ts` - ExportService class, detectConflicts standalone function, ImportStrategy type
- `src/cli/commands/export.ts` - registerExportCommand with [project-id] argument, --output, --stdout options
- `src/cli/commands/import.ts` - registerImportCommand with <file> argument, --strategy, --target options
- `src/tui/screens/ImportConflictScreen.tsx` - Conflict resolution TUI screen
- `src/lib/types/index.ts` - Added barrel export for export-schema
- `src/tui/hooks/useNavigation.ts` - Added 'import-conflict' to Screen type

## Decisions Made

- **Export schema version**: Used literal '1.0' for future migration support (D-06)
- **Conflict detection strategy**: Compare fields where existing has value and differs from imported (avoids false positives for new fields)
- **Import strategies**: Three options - merge (safest, preserves existing), overwrite (full replace), skip (cancel)
- **TUI interaction**: Number keys 1/2/3 for immediate selection, arrow keys for highlight navigation, Enter for highlighted option, Esc for cancel

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - all tests passed on first run after implementation.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Import/Export feature complete with 79 tests passing
- ImportConflictScreen TUI ready for integration with App.tsx routing (Phase 07-04)
- Ready for Phase 07-04 (Integration & Barrel Exports) to wire commands and screen routing

---

*Phase: 07-project-management-features*
*Completed: 2026-04-14*

## Self-Check: PASSED

- All 5 created files exist on disk
- All 5 task commits verified in git log
- All 79 tests passing