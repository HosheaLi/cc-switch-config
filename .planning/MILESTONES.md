# Milestones

## v1.0 MVP (Shipped: 2026-04-15)

**Phases completed:** 8 phases, 45 plans, 90 tasks

**Key accomplishments:**

- TypeScript ESM project structure with tsup build, vitest testing, and source directory skeleton for future modules
- Cross-platform path resolution using env-paths for XDG-compliant directories and path.join for safe Claude Code settings paths
- Atomic JSON file operations using write-rename pattern, enhanced error messages with line numbers, and graceful ENOENT handling
- Timestamped backup system with atomic restore operations, enabling users to recover from mistakes or corrupted configurations
- Enhanced JSON error messages with exact line/column numbers, context display, and caret pointer for quick syntax error location
- Config schema versioning with version field and migration framework to support future schema changes without breaking existing user configurations
- Token security checks to prevent API tokens from leaking to git repositories, including git tracking detection and token masking for safe display
- Zod schemas with strict validation, type inference via z.infer<>, and comprehensive test coverage for Claude Code configuration
- ValidationError class, validateConfig function, and formatValidationErrors utility for comprehensive error collection and user-friendly formatting
- Deep merge config algorithm with array replacement strategy and three-layer priority system for Claude Code settings
- ApiProviderConfig and TemplateConfig schemas with AuthType enum, strict validation, and nested schema validation — 43 provider tests, 185 total tests passing
- Unified types module with barrel export, DEFAULT_CONFIG typed as ClaudeSettings, and integration verification ensuring all modules work together
- ConfigRepository abstraction layer providing validated config read/write with automatic backup integration
- TemplateStore class for managing API provider templates with CRUD operations, validation, backup, and persistence
- ProjectIndex class managing project metadata with UUID stable IDs, realpath normalization, and pathIndex fast lookup
- FileWatcher implementation using chokidar for monitoring global and project config files with debounced change detection
- One-liner:
- 1. [Rule 1 - Bug] ValidationError wrapped in ServiceError
- 1. [Rule 1 - Bug] Fixed shared DEFAULT_DATA bug in ProjectIndex
- TemplateService class implementing template CRUD (F7) and deep-merge template application to project configs (F1), with constructor injection and ServiceError handling.
- 1. [Rule 1 - Bug] Fixed async test assertions
- CLI Wave 0 test infrastructure and error handling module with cli-table3 dependency, enabling TDD workflow for subsequent command implementations
- CLI entry point with Commander setup, table output module, and list command providing quick project status display with colored formatting
- switch command with optional template argument and TUI fallback, plus TUI launch stubs for Phase 06 integration
- Current command displaying active project path and template name with extracted execution function for testability
- Template subcommand with nested list/create/delete commands, aliases, and confirmation prompts for template CRUD operations
- CLI integration complete - shebang entry, barrel exports, and M4 verification ensuring CLI layer is UI-independent
- TUI hook infrastructure with dual-mode navigation, screen stack management, and fuzzy search - vitest configured for .tsx Ink tests
- Threshold-triggered loading hook, status bar with colored messages, preview panel for config display, and barrel exports
- Interactive project list screen with fuzzy search, dual-mode navigation (arrows + j/k), and preview panel integration
- Configuration preview screen showing template details with provider config, masked env variables, and Enter/Esc navigation for F3/U4 requirements
- TUI app container with screen routing via useNavigation, Service injection via runTUI factory, and navigation between list/editor/confirm screens
- CLI connected to TUI via launchTUI, architectural boundaries verified with M4 tests, performance verified with N4 tests
- Auto-switch utility and CLI command for hands-free context switching via direnv-style shell hooks
- CLI scan command with table/JSON/TUI output modes and ScanScreen TUI component for multi-select project registration
- Config import/export with JSON schema validation, conflict detection, and interactive resolution UI
- One-liner:
- Created files:
- 1. [Rule 3 - Blocking] Test act() wrapping for React state updates
- ValidationErrorScreen for full-screen error display with no-confirm blocking, UndoService wrapper for backup system, and CLI undo command with timing output
- TUI 'U' key undo trigger with StatusBar feedback, and ConfigEditorScreen validation error flow blocking invalid applies
- Performance benchmarks for N1-N4 targets using vitest bench mode, complete documentation with README and USAGE.md, TypeDoc configuration for API docs

---
