# Project Research Summary

**Project:** CCAPISwitch
**Domain:** CLI/TUI Configuration Management Tool
**Researched:** 2026-04-13
**Confidence:** HIGH

## Executive Summary

CCAPISwitch is a CLI/TUI configuration management tool for managing Claude Code API provider configurations across multiple projects. Expert implementations in this domain use ink (React-based TUI framework) for interactive interfaces, commander for CLI routing, and layered architecture separating presentation, services, and data persistence. The recommended approach combines atomic file operations with React component model for robust, testable code.

The research recommends starting with a foundation phase that implements critical safeguards against configuration corruption (atomic writes, backups, migration strategy) before building the interactive TUI layer. Key differentiators include project-centric view, custom provider templates (avoiding maintenance burden of pre-defined ones), and multi-level config hierarchy matching Claude Code's precedence chain.

Critical risks to mitigate: configuration file corruption from non-atomic writes, TOCTOU race conditions during concurrent edits, poor JSON error messages that frustrate users, and cross-platform path handling issues that break on Windows.

## Key Findings

### Recommended Stack

The research strongly recommends a TypeScript-first stack centered on ink (v7.0.0) for TUI, React (v19.2.5) for component model, commander (v14.0.3) for CLI parsing, and zod (v4.3.6) for schema validation. This combination provides excellent developer experience with full TypeScript type inference and mature, actively maintained libraries.

**Core technologies:**
- **ink 7.0.0**: React-based TUI framework — industry standard for modern CLI apps, familiar React patterns, Yoga flexbox layout
- **react 19.2.5**: UI component library — required peer dependency, concurrent features, component architecture
- **commander 14.0.3**: CLI argument parser — most popular (40M+ weekly downloads), simple API, auto-generated help
- **typescript 6.0.2**: Type safety — essential for configuration-heavy tools, compile-time error catching
- **tsup 8.5.1**: Build/bundle tool — zero-config, ESM + CJS dual output, handles shebang
- **zod 4.3.6**: Schema validation — TypeScript inference eliminates duplicate types, validates config files
- **conf 15.1.0**: Config persistence — XDG-compliant paths, atomic writes, migrations support

### Expected Features

Research identified clear feature tiers: table stakes (users expect these), competitive differentiators (set the product apart), and anti-features (commonly requested but problematic).

**Must have (table stakes):**
- Profile CRUD Operations — users expect create, list, switch, delete profiles
- Interactive TUI Selector — arrow-key navigation, fuzzy search, visual feedback
- Configuration Preview — show what will change before applying
- Quick Switch Command — one-command efficiency for common operation
- Current Status Display — know active configuration at a glance
- Custom Provider Templates — flexibility without maintenance burden
- Token Security Handling — keep tokens in settings.local.json, warn on git commits

**Should have (competitive):**
- Auto-Switch by Directory — hands-free context switching when cd-ing into projects
- Project Directory Scan — discover existing projects automatically
- API Connectivity Validation — verify API is reachable before committing config
- Diff Before Apply — side-by-side comparison, confirmation prompt
- Import/Export Configs — backup, share, migrate configurations

**Defer (v2+):**
- MCP Server Management — complex feature, defer until core is stable
- Pre-defined Provider Templates — maintenance overhead, add when demand is clear
- Bulk Operations — power user feature, add when single-project workflow is validated
- Desktop GUI (Tauri) — platform expansion, only if TUI shows traction

### Architecture Approach

The recommended layered architecture separates concerns into Presentation Layer (CLI interface + TUI components), Application Layer (services + state management + validators), and Data Layer (stores + file system operations). This enables testing at each layer and keeps UI thin.

**Major components:**
1. **CLI Interface (commander)** — parse commands, flags, arguments, route to TUI or execute directly
2. **TUI Components (ink/React)** — interactive UI with screens (ProjectList, ConfigEditor), reusable components (Select, Input, Table), and custom hooks (useProjects, useNavigation)
3. **Services Layer** — business logic for config operations, project indexing, template management, provider validation
4. **Config Store** — persist settings.json, templates.json, projects.json with atomic writes and backups
5. **File System Layer** — JSON read/write with comments support, file watching, backup/restore

### Critical Pitfalls

Research identified 6 critical pitfalls that must be addressed in Phase 1 to prevent user data loss and frustration.

1. **Config File Corruption from Non-Atomic Writes** — always use write-rename pattern: write to temp file, rename atomically. Test with kill -9 during write.
2. **TOCTOU Race Conditions** — never check-then-act; handle ENOENT errors gracefully, use exclusive flags. Test with parallel operations.
3. **No Config Backup Before Modifications** — create timestamped backups in `.backups/` directory before every modification. Users must be able to undo mistakes.
4. **Poor Error Messages for Invalid JSON** — provide line numbers and context for JSON syntax errors. Use json-source-map or similar library.
5. **Cross-Platform Path Handling** — use path.join() and env-paths for platform-specific locations. Test on Windows, macOS, Linux in CI.
6. **Config Schema Migration Breaking Changes** — include version field from day one, implement migration functions for schema evolution.

## Implications for Roadmap

Based on combined research, suggested phase structure:

### Phase 1: Foundation
**Rationale:** Critical pitfalls must be prevented before any config modification features. Data layer must be rock-solid.
**Delivers:** Safe file operations, config versioning, backup system, cross-platform paths
**Addresses:** Profile CRUD, JSON Config Support, Error Messages
**Avoids:** Config corruption, race conditions, lost configs, cross-platform breaks, migration nightmares
**Research flag:** Standard patterns available — use fs-extra atomic writes, env-paths, zod validation

### Phase 2: Core TUI
**Rationale:** Build interactive interface on solid foundation. TUI layer depends on services from Phase 1.
**Delivers:** Interactive project list, config editor, quick switch, status display
**Uses:** ink/React for TUI, commander for CLI routing, @inkjs/ui components
**Implements:** Interactive TUI Selector, Configuration Preview, Quick Switch Command, Current Status Display
**Addresses:** Table stakes features users expect
**Research flag:** Standard patterns available — follow ink examples, ink-testing-library for component tests

### Phase 3: Project Management
**Rationale:** Project indexing requires stable config operations. Auto-switch depends on knowing project locations.
**Delivers:** Project directory scan, project indexing, auto-switch by directory, import/export configs
**Implements:** Project Directory Scan, Auto-Switch by Directory, Import/Export Configs
**Addresses:** Competitive differentiators
**Research flag:** Standard patterns available — use chokidar for file watching, debounce for performance

### Phase 4: Quality & Validation
**Rationale:** Validation features enhance core functionality. API connectivity requires HTTP client implementation.
**Delivers:** Config validation, API connectivity testing, diff before apply, fuzzy search
**Implements:** Config Validation, API Connectivity Validation, Diff Before Apply, Fuzzy Search
**Addresses:** Quality-of-life features, error prevention
**Research flag:** May need research-phase — API testing patterns vary by provider, need to research common validation endpoints

### Phase 5: Advanced Features
**Rationale:** Power user features only make sense after core workflow is validated. MCP management is complex.
**Delivers:** MCP server management, bulk operations, pre-defined provider templates
**Implements:** MCP Server Management, Bulk Operations, Pre-defined Provider Templates
**Addresses:** Future enhancements
**Research flag:** Needs research-phase — MCP server management is complex, need to research Claude Code's MCP config format

### Phase Ordering Rationale

- **Foundation first:** All pitfalls identified in research relate to file operations and data integrity. These must be rock-solid before building UI features.
- **TUI second:** User interface depends on services layer. Can't build interactive features without business logic.
- **Project management third:** Auto-switch requires project indexing, which requires stable config operations from Phase 1.
- **Validation fourth:** Quality features enhance core but don't define it. Better to have working core with manual validation than broken core with automated validation.
- **Advanced last:** Power user features only valuable if core works well. Defer until product-market fit established.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 4 (API Validation):** API testing patterns vary by provider, need to research common validation endpoints, rate limiting, error handling
- **Phase 5 (MCP Management):** MCP server management is complex, need to research Claude Code's MCP config format, command validation, security considerations

Phases with standard patterns (skip research-phase):
- **Phase 1 (Foundation):** Well-documented patterns for atomic writes, backups, migrations, cross-platform paths
- **Phase 2 (Core TUI):** Ink provides excellent documentation and examples, ink-testing-library for tests
- **Phase 3 (Project Management):** Standard patterns for file watching, indexing, import/export

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Verified with npm registry, official documentation, active maintenance confirmed |
| Features | MEDIUM | Based on competitor analysis and common CLI patterns, but user validation needed for prioritization |
| Architecture | HIGH | Direct analysis of reference implementation (cc-switch), well-documented patterns |
| Pitfalls | HIGH | Cross-referenced multiple sources, standard file system and JSON handling patterns |

**Overall confidence:** HIGH

### Gaps to Address

- **User validation for feature prioritization:** MEDIUM confidence in features — need to validate which differentiators users actually want
- **API provider testing patterns:** LOW confidence — research identified need for connectivity validation but didn't specify exact patterns for each provider
- **MCP server configuration format:** LOW confidence — research identified feature but didn't document Claude Code's MCP config schema

**How to handle during planning:**
- User validation: Build MVP with table stakes, collect feedback before adding differentiators
- API testing: Research during Phase 4 planning, may need provider-specific implementations
- MCP config: Research during Phase 5 planning, analyze Claude Code's actual MCP configuration format

## Sources

### Primary (HIGH confidence)
- npm registry (2026-04-13) — Version verification for all packages
- Ink GitHub — https://github.com/vadimdemedes/ink — React for CLI framework documentation
- cc-switch Repository — https://github.com/farion1231/cc-switch — Reference implementation for Claude Code config management
- Claude Code Settings Documentation — https://docs.anthropic.com/en/docs/claude-code/settings-json — Configuration format reference
- Node.js File System Documentation — https://nodejs.org/api/fs.html — Atomic operations, fs/promises API

### Secondary (MEDIUM confidence)
- Commander.js docs — https://github.com/tj/commander.js — CLI framework patterns
- tsup documentation — https://tsup.egoist.dev — Build configuration patterns
- Zod documentation — https://zod.dev — Schema validation patterns
- JSON Schema for Configuration Management — https://json-schema.org/learn/config-file — Schema validation patterns
- CLI Tool Configuration Best Practices — https://dev.to/dtuits/manage-cli-tool-configuration-best-practices-and-examples-5f8p — XDG standard, priority ordering

### Tertiary (LOW confidence)
- File System Race Conditions in Node.js — Medium article — Atomic writes patterns
- Stack Overflow: File Race Conditions — Queue pattern, locking libraries
- Reddit: JSON Config Best Practices — Community discussion on config patterns

---
*Research completed: 2026-04-13*
*Ready for roadmap: yes*