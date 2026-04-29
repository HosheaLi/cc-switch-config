---
status: ready
phase: 07-project-management-features
source:
  - 07-01-SUMMARY.md
  - 07-02-SUMMARY.md
  - 07-03-SUMMARY.md
  - 07-04-SUMMARY.md
started: 2026-04-15T10:30:00Z
updated: 2026-04-28T00:00:00Z
---

## Current Test

number: 1
name: Auto-Switch Detection
expected: |
  When cd to a registered project directory, cc-config auto-check outputs the switch message (e.g., "Switched to: project-name [template]"). When cd to an unregistered .claude directory, outputs "Register with: cc-config register" prompt. When cd to non-project directory, no output (silent mode).
awaiting: user response

## Tests

### 1. Auto-Switch Detection
expected: cd to registered project → shows switch message. cd to unregistered .claude dir → shows register prompt. cd elsewhere → silent (no output).
result: [pending]

### 2. CLI Scan Command
expected: Running `cc-config scan --root ~ --depth 2` shows discovered projects in table format with columns: Path, Name, Template, Status. With `--json` flag, outputs valid JSON array. With `--tui` flag, launches interactive ScanScreen.
result: [pending]

### 3. ScanScreen Multi-Select
expected: ScanScreen displays unregistered projects with checkboxes. Space toggles selection. Arrow keys navigate list. Enter confirms selections. Selected projects registered after confirmation.
result: [pending]

### 4. Scan Key Trigger
expected: In ProjectListScreen, pressing 'S' (when search query is empty) navigates to ScanScreen.
result: [pending]

### 5. CLI Export Command
expected: Running `cc-config export --output backup.json` creates valid JSON file with ExportPayload schema (version: "1.0", metadata, project, settings, template nullable). With `--stdout`, outputs JSON to terminal.
result: [pending]

### 6. CLI Import Command (No Conflict)
expected: Running `cc-config import backup.json --strategy merge` imports settings. If no conflicts, imports silently. With `--strategy overwrite`, replaces existing settings.
result: [pending]

### 7. CLI Import Command (Conflict)
expected: When import has conflicts (different env/model/mcpServers), launches ImportConflictScreen TUI showing conflict fields.
result: [pending]

### 8. ImportConflictScreen Resolution
expected: ImportConflictScreen shows yellow-bordered conflict list. Number keys 1/2/3 select merge/overwrite/skip. Enter confirms highlighted option. Esc cancels import.
result: [pending]

### 9. CLI Commands Registered
expected: `cc-config --help` shows auto-check, scan, export, import commands listed under available commands.
result: [pending]

### 10. TUI Screen Routing
expected: In TUI App, 'scan' screen renders ScanScreen. 'import-conflict' screen renders ImportConflictScreen.
result: [pending]

## Summary

total: 10
passed: 0
issues: 0
pending: 10
skipped: 0
blocked: 0

## Gaps

[none yet]