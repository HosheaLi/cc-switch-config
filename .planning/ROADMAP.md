# Project Roadmap

**Project:** CCAPISwitch  
**Domain:** CLI/TUI Configuration Management Tool  
**Created:** 2026-04-13  
**Granularity:** Fine (8-12 phases)

---

## Overview

从 v1.0 Ink React TUI 到 v2.0 Terminal-Native 体验的重构之旅。用 prompts 替换 Ink，简化配置管理为三元组，实现首次引导流程，建立 OpenCode Terminal Aesthetic 设计系统。

---

## Milestones

- **v1.0 MVP** - Phases 1-8 (shipped 2026-04-15)
- **v2.0 Terminal-Native** - Phases 9-15 (in progress)

---

## Phases

<details>
<summary>v1.0 MVP (Phases 1-8) - SHIPPED 2026-04-15</summary>

### Phase 1: Foundation & Safety

**Goal:** 建立项目基础设施，实现关键安全机制防止配置损坏。

**Plans:** 7 plans

**Plans:**
- [x] 01-01-PLAN.md - Project Setup (package.json, tsconfig, build, test configs)
- [x] 01-02-PLAN.md - Cross-Platform Paths (env-paths, XDG directories)
- [x] 01-03-PLAN.md - Atomic File Operations (write-rename pattern)
- [x] 01-04-PLAN.md - Backup System (timestamped backups before modifications)
- [x] 01-05-PLAN.md - JSON Error Enhancement (line numbers, context)
- [x] 01-06-PLAN.md - Config Versioning & Migration (version field, migration framework)
- [x] 01-07-PLAN.md - Token Security (git tracking detection, token masking)

### Phase 2: Types & Validation

**Goal:** 定义类型系统和验证框架，建立配置管理的单一数据源。

**Plans:** 5 plans

**Plans:**
- [x] 02-01-PLAN.md - Core Config Schemas (ClaudeSettingsSchema, EnvConfig, etc.)
- [x] 02-02-PLAN.md - Validation Utilities (ValidationError class, validateConfig)
- [x] 02-03-PLAN.md - Merge Algorithm (deepMergeConfig, ConfigLayer type)
- [x] 02-04-PLAN.md - Provider Types (ApiProviderConfig, TemplateConfig, AuthType)
- [x] 02-05-PLAN.md - Barrel Export & Integration (index.ts, DEFAULT_CONFIG)

### Phase 3: Data Layer

**Goal:** 实现数据持久化层，建立 Repository 模式。

**Plans:** 5 plans

**Plans:**
- [x] 03-01-PLAN.md - ConfigRepository (read/write/exists functions)
- [x] 03-02-PLAN.md - TemplateStore (templates.json CRUD)
- [x] 03-03-PLAN.md - ProjectIndex (projects.json, ProjectEntry)
- [x] 03-04-PLAN.md - FileWatcher (chokidar, debounce)
- [x] 03-05-PLAN.md - AppState + Barrel Export

### Phase 4: Services Layer

**Goal:** 实现业务逻辑层，所有核心操作逻辑。

**Plans:** 6 plans

**Plans:**
- [x] 04-01-PLAN.md - ServiceError + Test Stubs
- [x] 04-02-PLAN.md - ConfigService (config CRUD, merge, apply)
- [x] 04-03-PLAN.md - ProjectService (scan, register, list)
- [x] 04-04-PLAN.md - TemplateService (template CRUD, apply)
- [x] 04-05-PLAN.md - ProviderService (connectivity test)
- [x] 04-06-PLAN.md - Barrel Export + M4 Verification

### Phase 5: CLI Interface

**Goal:** 实现 CLI 入口和命令路由，提供快速操作入口。

**Plans:** 6 plans

**Plans:**
- [x] 05-01-PLAN.md - CLI Test Infrastructure + Error Handling
- [x] 05-02-PLAN.md - CLI Entry Point + list Command
- [x] 05-03-PLAN.md - switch Command (optional argument + TUI fallback)
- [x] 05-04-PLAN.md - current Command
- [x] 05-05-PLAN.md - template Subcommand (nested CRUD)
- [x] 05-06-PLAN.md - Barrel Export + Integration

### Phase 6: Core TUI

**Goal:** 实现交互式 TUI，核心用户界面。

**Plans:** 7 plans

**Plans:**
- [x] 06-01-PLAN.md - Dependencies + Hooks (useKeyInput, useNavigation)
- [x] 06-02-PLAN.md - Reusable Components (StatusBar, LoadingIndicator)
- [x] 06-03-PLAN.md - ProjectListScreen (fuzzy search, navigation)
- [x] 06-04-PLAN.md - ConfigEditorScreen (template preview)
- [x] 06-05-PLAN.md - ConfirmScreen (y/n confirmation)
- [x] 06-06-PLAN.md - TUI App Container (screen routing)
- [x] 06-07-PLAN.md - CLI Integration + M4 Verification

### Phase 7: Project Management Features

**Goal:** 项目管理增强功能，提升便利性。

**Plans:** 4 plans

**Plans:**
- [x] 07-01-PLAN.md - Auto-Switch Shell Hook
- [x] 07-02-PLAN.md - Project Directory Scan
- [x] 07-03-PLAN.md - Import/Export Configs
- [x] 07-04-PLAN.md - Integration & Barrel Exports

### Phase 8: Quality & Polish

**Goal:** 质量提升和用户体验优化。

**Plans:** 5 plans

**Plans:**
- [x] 08-01-PLAN.md - Diff Utilities + UnifiedDiff Component
- [x] 08-02-PLAN.md - DiffScreen + ConfigEditorScreen Integration
- [x] 08-03-PLAN.md - ValidationErrorScreen + Undo Service
- [x] 08-04-PLAN.md - TUI Undo Integration
- [x] 08-05-PLAN.md - Performance Benchmarks + Documentation

</details>

### v2.0 Terminal-Native (In Progress)

**Milestone Goal:** Terminal-Native 体验重构 - npm 风格列表选择，简化配置管理，首次引导流程，OpenCode Terminal Aesthetic

#### Phase 9: Prompts Integration
**Goal**: Users interact with terminal-native prompts interface (replacing Ink React TUI)
**Depends on**: Phase 8
**Requirements**: TUI-01, TUI-02, TUI-03, TUI-04, TUI-05
**Success Criteria** (what must be TRUE):
  1. User can navigate project list with j/k keys and arrow keys
  2. User can confirm selection with Enter and cancel with Esc
  3. User experiences linear wizard flow without multi-screen navigation
  4. User can search large project lists with autocomplete (>20 items)
  5. User sees graceful exit on Ctrl+C with onCancel handling
**Plans**: TBD

#### Phase 10: Config Service
**Goal**: Users can manage API configurations securely with precise field replacement
**Depends on**: Phase 9
**Requirements**: CFG-01, CFG-02, CFG-04, SEC-01, SEC-03
**Success Criteria** (what must be TRUE):
  1. User can store multiple API configs as tuples (name + apiKey + baseUrl + modelName)
  2. User's permissions/hooks/mcpServers are preserved when applying config (precise field replacement)
  3. User sees API key masked in all display contexts (preview/diff/logs)
  4. User's API key is never exposed in CLI args, logs, or screenshots
  5. System maintains atomic write and backup from v1.0 (R1/R2)
**Plans**: 2 plans

Plans:
- [x] 10-01-PLAN.md - Create ApiConfig types and replaceEnvModel function
- [x] 10-02-PLAN.md - Create ApiConfigStore and ApiService for CRUD operations
- [x] 10-03-PLAN.md - Create API key security utilities (masking + CLI enforcement)
- [x] 10-04-PLAN.md - Integrate modules via barrel exports, add applyApiConfig method

#### Phase 11: Config CLI Commands
**Goal**: Users can manage API configurations via CLI with secure input
**Depends on**: Phase 10
**Requirements**: CFG-03, SEC-02, SEC-04
**Success Criteria** (what must be TRUE):
  1. User can add API configs via `cc-config config add` command
  2. User can list API configs via `cc-config config list` command
  3. User can remove API configs via `cc-config config remove` command
  4. User sees validation error messages for invalid inputs (prompts validate pattern)
  5. User sees password-type input for API key that auto-clears
**Plans**: 2 plans

Plans:
- [ ] 11-01-PLAN.md - Create config add/list/remove commands with password-type input, masked display, confirmation flow, and grouped validation errors
- [x] 11-02-PLAN.md - Integrate config commands into CLI + deprecate config-wizard

#### Phase 12: First-Run Wizard
**Goal**: New users experience guided onboarding flow
**Depends on**: Phase 11
**Requirements**: ONB-01, ONB-02, ONB-03, ONB-04, ONB-05
**Success Criteria** (what must be TRUE):
  1. User experiences first-run wizard (API config - scan directory - scan - main interface)
  2. System detects firstRunCompleted flag in AppState
  3. System scans directories with Promise.all parallel traversal (not serial)
  4. System skips node_modules/.git/dist/build/target/.venv/__pycache__
  5. User sees progress indicator during scan operations
**Plans**: TBD

#### Phase 13: Switch Flow
**Goal**: Users can switch project configs with diff preview before application
**Depends on**: Phase 12
**Requirements**: CFG-05, ONB-06
**Success Criteria** (what must be TRUE):
  1. User can switch project config via `cc-config switch [project] [config]`
  2. User sees diff preview before config application confirmation
  3. User can accept or reject changes based on diff preview
**Plans**: TBD

#### Phase 14: Terminal Aesthetic
**Goal**: Users see consistent terminal-native design system across all interfaces
**Depends on**: Phase 13
**Requirements**: UI-01, UI-02, UI-03, UI-04, UI-05, UI-06
**Success Criteria** (what must be TRUE):
  1. User sees OpenCode warm color palette (#201d1d/#fdfcfc/#9a9898)
  2. User sees monospace-only typography throughout all interfaces
  3. User sees flat depth system (no shadows, border-only elevation)
  4. User sees Apple HIG semantic colors (blue/red/green/orange for accent/danger/success/warning)
  5. System respects NO_COLOR environment variable
  6. System detects Windows CMD vs Terminal for ANSI color compatibility
**Plans**: TBD
**UI hint**: yes

#### Phase 15: Ink Removal
**Goal**: Clean codebase with Ink React TUI layer completely removed
**Depends on**: Phase 14
**Requirements**: TUI-06, CFG-06
**Success Criteria** (what must be TRUE):
  1. Ink React TUI layer completely removed from dependencies
  2. TemplateConfig/TemplateService/TemplateStore removed and replaced with simplified config service
  3. All Ink components replaced with prompts equivalents
  4. No React dependencies remain in TUI layer
  5. Bundle size reduced without React/Ink overhead
**Plans**: TBD

---

## Progress

**Execution Order:**
Phases execute in numeric order: 9 - 10 - 11 - 12 - 13 - 14 - 15

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Foundation & Safety | v1.0 | 7/7 | Complete | 2026-04-13 |
| 2. Types & Validation | v1.0 | 5/5 | Complete | 2026-04-13 |
| 3. Data Layer | v1.0 | 5/5 | Complete | 2026-04-13 |
| 4. Services Layer | v1.0 | 6/6 | Complete | 2026-04-14 |
| 5. CLI Interface | v1.0 | 6/6 | Complete | 2026-04-14 |
| 6. Core TUI | v1.0 | 7/7 | Complete | 2026-04-14 |
| 7. Project Management | v1.0 | 4/4 | Complete | 2026-04-14 |
| 8. Quality & Polish | v1.0 | 5/5 | Complete | 2026-04-15 |
| 9. Prompts Integration | v2.0 | 0/TBD | Not started | - |
| 10. Config Service | v2.0 | 4/4 | Complete    | 2026-04-30 |
| 11. Config CLI Commands | v2.0 | 1/2 | Complete    | 2026-04-30 |
| 12. First-Run Wizard | v2.0 | 0/TBD | Not started | - |
| 13. Switch Flow | v2.0 | 0/TBD | Not started | - |
| 14. Terminal Aesthetic | v2.0 | 0/TBD | Not started | - |
| 15. Ink Removal | v2.0 | 0/TBD | Not started | - |

---

## Deferred Features (v3+)

| Feature | Phase | Rationale |
|---------|-------|-----------|
| MCP Server Management | v3 | Complex, needs research on Claude Code MCP format |
| API Connectivity Validation | v3 | Provider-specific, needs validation endpoint research |
| Pre-defined Provider Templates | v3 | Maintenance burden, add when user demand validated |
| Bulk Operations | v3 | Power user feature, validate single-project workflow first |
| Desktop GUI (Tauri) | v3 | Platform expansion, only if TUI shows traction |

---

## Success Metrics

### Technical Metrics (v2.0)

| Metric | Target | Verification Method |
|--------|--------|---------------------|
| Test Coverage | >=80% core modules | vitest coverage report |
| Cold Start Time | <1 second | Benchmark test (N1) |
| Switch Operation | <100ms | Performance test (N2) |
| TUI Render | <50ms | Prompts performance (N4) |
| 100 Project Scan | <5 seconds | Scalability benchmark (N3) |
| Bundle Size | Reduced (no React/Ink) | Build size comparison |

### User Success Metrics (v2.0)

| Metric | Target | Verification Method |
|--------|--------|---------------------|
| First-Run Completion | Complete wizard in <2 min | User testing session |
| Config Management | Add/list/remove configs via CLI | User task completion |
| Error Recovery | User understands validation messages | User testing observation |

---

*Roadmap for: CCAPISwitch*  
*Created: 2026-04-13*  
*Last updated: 2026-04-30 (Phase 11 plans created)*