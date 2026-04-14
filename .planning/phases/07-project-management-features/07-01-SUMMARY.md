---
phase: 07-project-management-features
plan: 01
subsystem: cli
tags: [shell-hook, direnv, auto-switch, bash, zsh, chpwd]

# Dependency graph
requires:
  - phase: 04-services-layer
    provides: ProjectIndex.getByPath(), AppState.getActiveProject/setActiveProject()
  - phase: 05-cli-interface
    provides: Commander.js registration pattern, handleCLIError
provides:
  - Auto-switch utility for directory-based project detection
  - auto-check CLI command for shell hook integration
  - Shell hook documentation (bash/zsh)
affects: [07-02, 07-04, 08]

# Tech tracking
tech-stack:
  added: []
  patterns: [shell-hook, silent-output, unregistered-prompt]

key-files:
  created:
    - src/cli/utils/auto-switch.ts
    - src/cli/utils/auto-switch.test.ts
    - src/cli/commands/auto-check.ts
    - src/cli/commands/auto-check.test.ts
  modified:
    - src/cli/index.ts

key-decisions:
  - "D-01: Shell hook like direnv using PROMPT_COMMAND/chpwd_functions"
  - "D-02: Silent output, only message on actual switch"
  - "D-03: Prompt to register new project when .claude detected"

patterns-established:
  - "AutoSwitchResult interface for switch decision and metadata"
  - "detectAutoSwitch -> applyAutoSwitch -> formatSwitchMessage pipeline"
  - "Shell hook documentation as comment block in command file"

requirements-completed: [F9]

# Metrics
duration: 4min
completed: 2026-04-14
---

# Phase 07 Plan 01: Auto-Switch Shell Hook Summary

**Auto-switch utility and CLI command for hands-free context switching via direnv-style shell hooks**

## Performance

- **Duration:** 4 min
- **Started:** 2026-04-14T14:56:15Z
- **Completed:** 2026-04-14T14:59:46Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- AutoSwitchResult interface with switched, projectId, projectName, templateName, unregisteredDir fields
- detectAutoSwitch() function for project directory detection (D-01)
- applyAutoSwitch() function for state update without file writes
- formatSwitchMessage() function with silent mode (D-02) and unregistered prompt (D-03)
- auto-check CLI command with --silent (default true) and --root options
- Shell hook documentation for bash PROMPT_COMMAND and zsh chpwd_functions integration
- 22 tests covering all scenarios

## Task Commits

Each task was committed atomically:

1. **Task 1: Create auto-switch utility** - `336348a` (feat)
2. **Task 2: Create auto-check CLI command** - `e0718fb` (feat)

## Files Created/Modified
- `src/cli/utils/auto-switch.ts` - Auto-switch detection logic (AutoSwitchResult, detectAutoSwitch, applyAutoSwitch, formatSwitchMessage)
- `src/cli/utils/auto-switch.test.ts` - 11 test cases for auto-switch utility
- `src/cli/commands/auto-check.ts` - CLI command with shell hook documentation (bash/zsh)
- `src/cli/commands/auto-check.test.ts` - 11 test cases for auto-check command
- `src/cli/index.ts` - Added registerAutoCheckCommand registration

## Decisions Made
- D-01: Shell hook like direnv using PROMPT_COMMAND (bash) and chpwd_functions (zsh)
- D-02: Silent output mode (--silent default true), only message on actual switch
- D-03: Prompt "Register with: cc-config register" for unregistered .claude directories
- AutoSwitchResult tracks both switch status and unregistered detection separately

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None - straightforward implementation following existing patterns.

## User Setup Required

None - no external service configuration required.

## Shell Hook Setup

Users can enable auto-switch by adding to their shell configuration:

### Bash (~/.bashrc)
```bash
_cc_config_chpwd_hook() {
  local output
  output=$(cc-config auto-check --silent 2>&1)
  if [[ -n "$output" ]]; then
    echo "$output"
  fi
}
PROMPT_COMMAND="_cc_config_chpwd_hook${PROMPT_COMMAND:+; $PROMPT_COMMAND}"
```

### Zsh (~/.zshrc)
```zsh
_cc_config_chpwd_hook() {
  local output
  output=$(cc-config auto-check --silent 2>&1)
  if [[ -n "$output" ]]; then
    echo "$output"
  fi
}
chpwd_functions=(${chpwd_functions[@]} _cc_config_chpwd_hook)
```

## Next Phase Readiness
- Auto-switch foundation complete, ready for 07-02 (Project Directory Scan)
- Shell hook integration tested and documented
- All 22 tests passing

## Self-Check: PASSED
- src/cli/utils/auto-switch.ts: FOUND
- src/cli/commands/auto-check.ts: FOUND
- .planning/phases/07-project-management-features/07-01-SUMMARY.md: FOUND
- Commit 336348a: FOUND (feat: auto-switch utility)
- Commit e0718fb: FOUND (feat: auto-check CLI command)
- Commit 1b65549: FOUND (docs: complete plan)

---
*Phase: 07-project-management-features*
*Completed: 2026-04-14*