---
type: ui-spec
phase: 15
purpose: ink-removal
created: 2026-05-08
---

# UI Specification - Phase 15 (Ink Removal)

## Context

Phase 15 is a **removal phase** - not a UI addition phase. This spec documents what to REMOVE and what to REPLACE it with.

## Current State (v1.0 - TO BE REMOVED)

### Ink Components (Remove All)
- `ProjectListScreen.tsx` - Ink React component
- `ConfigEditorScreen.tsx` - Ink React component
- `ConfirmScreen.tsx` - Ink React component
- `StatusBar.tsx` - Ink React component
- `LoadingIndicator.tsx` - Ink React component
- `TuiApp.tsx` - Ink container with routing

### Ink Dependencies (Remove)
- `ink` npm package
- `ink-select` npm package
- `ink-text-input` npm package
- React dependencies (indirect via Ink)

### Ink Patterns (Remove)
- React hooks in TUI layer
- JSX/TSX files in TUI
- Component-based UI architecture
- Ink's `<Box>`, `<Text>`, `<Select>` elements

## Replacement State (v2.0 - Already Complete)

### Prompts Components (Keep)
- `select-project.ts` - prompts list selection
- `config-wizard.ts` - prompts config flow
- `scan-wizard.ts` - prompts scan flow
- `switch-wizard.ts` - prompts switch flow
- `handle-cancel.ts` - prompts onCancel
- `autocomplete.ts` - prompts autocomplete

### Prompts Patterns (Keep)
- Linear wizard flow
- j/k + arrow navigation
- Enter confirm / Esc cancel
- Autocomplete for large lists
- onCancel graceful exit

### Design System (Keep)
- picocolors@1.1.1 (ANSI color)
- OpenCode aesthetic (#201d1d/#fdfcfc)
- Apple HIG semantic colors
- NO_COLOR support

## Removal Checklist

### Files to Delete
```
src/tui/screens/
  - ProjectListScreen.tsx
  - ConfigEditorScreen.tsx
  - ConfirmScreen.tsx

src/tui/components/
  - StatusBar.tsx
  - LoadingIndicator.tsx

src/tui/
  - TuiApp.tsx
  - Any remaining Ink imports
```

### Dependencies to Remove from package.json
```json
{
  "dependencies": {
    "ink": "REMOVE",
    "ink-select": "REMOVE (if present)",
    "ink-text-input": "REMOVE (if present)"
  }
}
```

### Imports to Clean
- Remove `import { Box, Text, useApp, useInput } from 'ink'`
- Remove `import React from 'react'`
- Remove JSX/TSX file extensions in TUI

### Tests to Update
- Update TUI tests to use prompts mocking
- Remove Ink-specific test patterns
- Keep integration tests for flow validation

## Verification Criteria

### Removal Success
- [ ] No Ink imports in codebase
- [ ] No React dependencies in package.json
- [ ] No TSX files in src/tui/
- [ ] grep -r "ink" returns 0 results
- [ ] grep -r "react" returns 0 results (in TUI layer)

### Replacement Success
- [ ] All flows use prompts
- [ ] j/k navigation works
- [ ] Enter/Esc handling works
- [ ] Autocomplete works for large lists
- [ ] onCancel graceful exit works

### Performance Success
- [ ] Bundle size reduced (no React overhead)
- [ ] Startup time improved (no Ink initialization)
- [ ] Memory usage reduced

### Quality Success
- [ ] Test coverage ≥80%
- [ ] E2E flows pass
- [ ] No regressions in v1.0 features
- [ ] Documentation updated

## Migration Strategy

### Step 1: Verify Prompts Complete
- Confirm Phase 10-14 prompts replacements are complete
- Run E2E tests to validate flows

### Step 2: Remove Ink Code
- Delete Ink component files
- Remove Ink imports
- Clean up any Ink-specific logic

### Step 3: Remove Dependencies
- Update package.json
- Run npm prune
- Verify no orphaned packages

### Step 4: Verify & Test
- Run test suite
- Run E2E flow tests
- Check bundle size
- Update documentation

## Risk: What to Watch

### Don't Remove
- Prompts components (Phase 10-14)
- CLI commands (Phase 11)
- Config service (Phase 10)
- Design system (Phase 14)
- Atomic write / backup system

### Don't Break
- User flow: scan → select → switch
- CLI commands: cc config add/list/remove
- Security: API key masking
- Cross-platform support

### Fallback
- Keep git branches per phase for rollback
- Keep backup settings.json before changes
- CLI commands must remain functional