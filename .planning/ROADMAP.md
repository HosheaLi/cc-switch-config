# Project Roadmap

**Project:** CCAPISwitch  
**Domain:** CLI/TUI Configuration Management Tool  
**Created:** 2026-04-13  
**Granularity:** Fine (8-12 phases)

---

## Overview

本路线图将项目分解为 8 个细粒度阶段，每个阶段聚焦特定能力域，确保增量交付和持续验证。阶段顺序基于依赖关系：Foundation → Data → Services → Interface → Features。

---

## Phase Structure

### Phase 1: Foundation & Safety

**Goal:** 建立项目基础设施，实现关键安全机制防止配置损坏。

**Duration Estimate:** 1-2 weeks

**Plans:** 7 plans in 7 waves

**Plans:**
- [x] 01-01-PLAN.md — Project Setup (package.json, tsconfig, build, test configs)
- [x] 01-02-PLAN.md — Cross-Platform Paths (env-paths, XDG directories)
- [x] 01-03-PLAN.md — Atomic File Operations (write-rename pattern)
- [x] 01-04-PLAN.md — Backup System (timestamped backups before modifications)
- [x] 01-05-PLAN.md — JSON Error Enhancement (line numbers, context)
- [x] 01-06-PLAN.md — Config Versioning & Migration (version field, migration framework)
- [x] 01-07-PLAN.md — Token Security (git tracking detection, token masking)

**Delivers:**
- 项目结构搭建（TypeScript, tsup, vitest）
- 安全文件操作模块（atomic writes, backup system）
- 跨平台路径处理（env-paths, path.join）
- JSON 解析增强错误消息（line numbers, context）
- 配置 schema 版本化（version field, migration framework）
- Token 安全检测（git tracking detection）

**Requirements Addressed:**
- R1: Atomic Writes (no corruption on crash)
- R2: Backup System (auto backup before modifications)
- R4: Cross-Platform (macOS/Linux/Windows)
- U1: Clear Errors (JSON errors with line numbers)
- M2: Type Safety (TypeScript project setup)
- M3: Schema Versioning (config version field)
- S1: Token Isolation (tokens never in git)
- S2: File Permissions (token file security checks)

**Dependencies:** None (foundation phase)

**Verification:**
- Crash test: kill -9 during write, verify config remains valid
- Backup test: verify .backups/ exists after every modification
- JSON error test: malformed config shows line number and context
- Platform test: CI runs on macOS, Linux, Windows
- Migration test: v0 config loads and migrates correctly
- Security audit: no tokens in git-tracked files

**Research Notes:** Standard patterns available — use fs-extra atomic writes, env-paths, zod validation. No research-phase needed.

---

### Phase 2: Types & Validation

**Goal:** 定义类型系统和验证框架，建立配置管理的单一数据源（Single Source of Truth）。

**Duration Estimate:** 1 week

**Plans:** 5 plans in 3 waves

**Plans:**
- [x] 02-01-PLAN.md — Core Config Schemas (ClaudeSettingsSchema, EnvConfig, McpServerConfig, PermissionRule, HookConfig)
- [x] 02-02-PLAN.md — Validation Utilities (ValidationError class, validateConfig, prettifyError integration)
- [x] 02-03-PLAN.md — Merge Algorithm (deepMergeConfig, ConfigLayer type, three-layer merge)
- [x] 02-04-PLAN.md — Provider Types (ApiProviderConfig, TemplateConfig, AuthType enum)
- [x] 02-05-PLAN.md — Barrel Export & Integration (index.ts, update DEFAULT_CONFIG)

**Delivers:**
- TypeScript 类型定义（从 Zod schema 推断）
- Zod schemas 验证框架
- 配置 merge 算法
- 默认配置和常量定义

**Requirements Addressed:**
- M2: Type Safety (full TypeScript coverage)
- F11: Config Validation (syntax + semantic check)
- M4: Module Separation (clear boundaries)

**Dependencies:**
- Phase 1 (需要文件操作模块进行验证测试)

**Verification:**
- Type coverage: no `any` types in core modules
- Schema inference: TypeScript types derived from Zod
- Validation test: invalid configs caught with helpful messages
- Merge test: config layers combine correctly

**Research Notes:** Standard patterns — Zod documentation provides excellent TypeScript integration.

---

### Phase 3: Data Layer

**Goal:** 实现数据持久化层，建立 Repository 模式。

**Duration Estimate:** 1-2 weeks

**Plans:** 5 plans in 2 waves

**Plans:**
- [x] 03-01-PLAN.md — ConfigRepository (readConfig/writeConfig/configExists functions)
- [x] 03-02-PLAN.md — TemplateStore (templates.json CRUD, TemplateStore class)
- [x] 03-03-PLAN.md — ProjectIndex (projects.json, ProjectEntry, pathIndex)
- [x] 03-04-PLAN.md — FileWatcher (chokidar, debounce, global/project watch)
- [x] 03-05-PLAN.md — AppState + Barrel Export (conf package, index.ts)

**Delivers:**
- ConfigRepository 实现（read/write/exists/backup）
- Template Store 实现（templates.json CRUD）
- Project Index 实现（projects.json 管理）
- File Watcher 实现（监听配置变化）
- 状态管理框架（store setup）

**Requirements Addressed:**
- DATA-01: ConfigRepository 封装
- DATA-02: TemplateStore 实现
- DATA-03: ProjectIndex 实现
- DATA-04: FileWatcher 实现
- DATA-05: AppState 实现
- R3: Error Recovery (graceful handling of file I/O errors)
- M4: Module Separation (data layer independent)

**Dependencies:**
- Phase 1 (atomic writes, backups)
- Phase 2 (types, schemas)

**Verification:**
- Repository test: CRUD operations with atomic writes
- Index test: project index persists correctly
- Watcher test: file changes trigger updates
- Error test: ENOENT and other errors handled gracefully

**Research Notes:** Standard patterns — chokidar for file watching, conf for global storage.

---

### Phase 4: Services Layer

**Goal:** 实现业务逻辑层，所有核心操作逻辑。

**Duration Estimate:** 2-3 weeks

**Plans:** 6 plans in 3 waves

**Plans:**
- [ ] 04-01-PLAN.md — Wave 0 Foundation (ServiceError + Test Stubs)
- [ ] 04-02-PLAN.md — ConfigService (config CRUD, merge, apply)
- [ ] 04-03-PLAN.md — ProjectService (scan, register, list, AppState extension)
- [ ] 04-04-PLAN.md — TemplateService (template CRUD, apply to project)
- [ ] 04-05-PLAN.md — ProviderService (connectivity test via HEAD)
- [ ] 04-06-PLAN.md — Barrel Export + M4 Verification

**Delivers:**
- ConfigService（config read/write/merge/validate）
- ProjectService（project indexing, detection, CRUD）
- TemplateService（template CRUD, apply to project）
- ProviderService（provider defaults, connectivity test）
- ServiceError class（error handling pattern）
- services/index.ts（barrel export）

**Requirements Addressed:**
- F1: Profile CRUD Operations (create/list/switch/delete) — Plans 02, 04
- F7: Custom Provider Templates (template management) — Plan 04
- F4: List All Projects (project status display) — Plan 03
- M4: Module Separation (services independent of UI) — Plans 01, 06
- D-06: Provider Connectivity Test — Plan 05

**Dependencies:**
- Phase 2 (types, schemas)
- Phase 3 (data layer repositories)

**Verification:**
- Service test: all services have >=80% test coverage
- Integration test: services combine to complete workflows
- Mock test: services work with mocked repositories
- M4 verification: no UI imports in services

**Research Notes:** Standard patterns — service layer encapsulation, dependency injection.

---

### Phase 5: CLI Interface

**Goal:** 实现 CLI 入口和命令路由。

**Duration Estimate:** 1 week

**Plans:** TBD

**Delivers:**
- CLI entry point（shebang, commander setup）
- 基础命令实现
- 帮助文档生成（--help, command reference）
- 错误处理和用户反馈

**Requirements Addressed:**
- F5: Quick Switch Command (one-command efficiency)
- F6: Current Status Display (show active config)
- U4: Help Documentation (command reference)

**Dependencies:**
- Phase 4 (services for command execution)

**Verification:**
- Command test: all commands execute correctly
- Help test: --help shows accurate documentation
- Error test: errors shown clearly with actionable messages

**Research Notes:** Standard patterns — Commander.js documentation, auto-generated help.

---

### Phase 6: Core TUI

**Goal:** 实现交互式 TUI，核心用户界面。

**Duration Estimate:** 2-3 weeks

**Plans:** TBD

**Delivers:**
- TUI App container（ink/React setup）
- Project List screen（项目列表展示）
- Config Editor screen（配置编辑表单）
- Selection components（Select, Input, Table）
- Navigation hooks（useNavigation, useKeyInput）
- Loading indicators（Spinner, progress）

**Requirements Addressed:**
- F2: Interactive TUI Selector (arrow-key navigation, fuzzy search)
- F3: Configuration Preview (show what will change)
- N4: Responsive TUI (<50ms render time)
- U3: Keyboard Navigation (arrows + j/k)
- U4: Escape to Cancel (always allow cancel)

**Dependencies:**
- Phase 4 (services for data)
- Phase 5 (CLI routing to TUI)

**Verification:**
- Component test: ink-testing-library for UI tests
- Navigation test: both arrow keys and j/k work
- Render test: list renders < 50ms for 100 items
- Escape test: all dialogs allow cancel

**Research Notes:** Standard patterns — Ink examples, ink-testing-library, @inkjs/ui components.

---

### Phase 7: Project Management Features

**Goal:** 项目管理增强功能，提升便利性。

**Duration Estimate:** 1-2 weeks

**Plans:** TBD

**Delivers:**
- Project directory scan（自动发现项目）
- Auto-switch by directory（cd 自动切换配置）
- Import/Export configs（配置备份迁移）
- Fuzzy search（模糊搜索过滤）

**Requirements Addressed:**
- F9: Auto-Switch by Directory (hands-free context switching)
- F10: Project Directory Scan (discover existing projects)
- F13: Import/Export Configs (backup, migrate, share)
- F14: Fuzzy Search (quick navigation)

**Dependencies:**
- Phase 3 (project index)
- Phase 4 (project service)
- Phase 6 (TUI screens)

**Verification:**
- Auto-switch test: cd triggers correct config
- Scan test: 100 projects scan < 5 seconds
- Import/Export test: round-trip preserves all data
- Search test: filtering < 50ms for 100+ items

**Research Notes:** Standard patterns — chokidar for directory watching, fuse.js for fuzzy search.

---

### Phase 8: Quality & Polish

**Goal:** 质量提升和用户体验优化。

**Duration Estimate:** 1-2 weeks

**Plans:** TBD

**Delivers:**
- Diff Before Apply（side-by-side comparison）
- Config validation UI（validation errors display）
- Undo/Rollback mechanism（撤销修改）
- Confirmation prompts（危险操作确认）
- Performance optimization（benchmark, optimize）
- Documentation complete（README, API docs）

**Requirements Addressed:**
- F11: Config Validation (validation with helpful errors)
- F12: Diff Before Apply (side-by-side comparison)
- U2: Undo Support (ability to undo modifications)
- U5: Confirmation Prompts (destructive actions require confirmation)
- N3: Scalable Scanning (<5s for 100 projects)
- M1: Test Coverage (>=80% for core modules)

**Dependencies:**
- Phase 2 (validation)
- Phase 6 (TUI for diff display)
- Phase 7 (project features)

**Verification:**
- Diff test: diff shown before every modification
- Undo test: undo works for all modification types
- Confirmation test: destructive actions require explicit approval
- Coverage test: >=80% coverage for services, lib, store
- Performance test: benchmarks meet targets

**Research Notes:** May need API validation research — patterns vary by provider.

---

## Phase Summary

| Phase | Goal | Duration | Dependencies | Plans |
|-------|------|----------|--------------|-------|
| 1 | Foundation & Safety | 1-2 weeks | None | 7 |
| 2 | Types & Validation | 1 week | Phase 1 | 5 |
| 3 | Data Layer | 1-2 weeks | Phase 1, 2 | 5 |
| 4 | Services Layer | 2-3 weeks | Phase 2, 3 | 6 |
| 5 | CLI Interface | 1 week | Phase 4 | TBD |
| 6 | Core TUI | 2-3 weeks | Phase 4, 5 | TBD |
| 7 | Project Management | 1-2 weeks | Phase 3, 4, 6 | TBD |
| 8 | Quality & Polish | 1-2 weeks | Phase 2, 6, 7 | TBD |

**Total Estimate:** 10-16 weeks

---

## Critical Path

```
Phase 1 (Foundation)
    ↓
Phase 2 (Types)
    ↓
Phase 3 (Data)
    ↓
Phase 4 (Services)
    ↓
Phase 5 (CLI) ←─┐
    ↓           │
Phase 6 (TUI)   │ (parallel possible after Phase 4)
    ↓           │
Phase 7 (Features)
    ↓
Phase 8 (Quality)
```

**Parallel Opportunities:**
- Phase 5 (CLI) and Phase 6 (TUI) can start in parallel after Phase 4 completes
- Both depend on Services, but not on each other

---

## Milestone Checkpoints

### Milestone 1: Foundation Complete (End of Phase 3)

**Criteria:**
- [ ] Atomic writes verified with crash testing
- [ ] Backup system creates timestamped backups
- [ ] Cross-platform paths tested in CI
- [ ] JSON errors show line numbers
- [ ] Config migration works
- [ ] Token security enforced
- [ ] Data layer repositories functional

**Deliverable:** Safe, reliable file operations foundation

### Milestone 2: Core MVP Complete (End of Phase 6)

**Criteria:**
- [ ] CLI commands work (list, switch, current)
- [ ] TUI responsive and navigable
- [ ] Config preview shows changes
- [ ] Services have >=80% test coverage
- [ ] First user can complete basic workflow

**Deliverable:** Functional CLI/TUI tool with core features

### Milestone 3: Production Ready (End of Phase 8)

**Criteria:**
- [ ] All P1 requirements met
- [ ] All platform tests pass
- [ ] Performance benchmarks meet targets
- [ ] Documentation complete
- [ ] Ready for first external user

**Deliverable:** Production-ready tool ready for release

---

## Deferred Features (v2+)

| Feature | Phase | Rationale |
|---------|-------|-----------|
| MCP Server Management | v2 | Complex, needs research on Claude Code MCP format |
| API Connectivity Validation | v2 | Provider-specific, needs validation endpoint research |
| Pre-defined Provider Templates | v2 | Maintenance burden, add when user demand validated |
| Bulk Operations | v2 | Power user feature, validate single-project workflow first |
| Desktop GUI (Tauri) | v2/v3 | Platform expansion, only if TUI shows traction |

---

## Research Flags

Phases needing additional research during planning:

| Phase | Research Topic | Confidence | Action |
|-------|----------------|------------|--------|
| Phase 8 | API validation patterns by provider | LOW | May need provider-specific implementations |

Phases with standard patterns (no research needed):

| Phase | Pattern Source |
|-------|----------------|
| Phase 1 | fs-extra atomic writes, env-paths, zod |
| Phase 2 | Zod documentation, TypeScript best practices |
| Phase 3 | chokidar file watching, conf storage |
| Phase 4 | Service layer patterns, dependency injection |
| Phase 5 | Commander.js documentation |
| Phase 6 | Ink examples, ink-testing-library |
| Phase 7 | chokidar directory watching, fuse.js fuzzy search |

---

## Risk Management

### Phase-Level Risks

| Phase | Risk | Mitigation |
|-------|------|------------|
| 1 | Config corruption missed | Extensive crash testing (kill -9, power loss simulation) |
| 3 | File watcher race conditions | Debounce changes, handle ENOENT gracefully |
| 6 | TUI performance lag | Virtual scrolling for large lists, benchmark early |
| 7 | Auto-switch detection fails | Multiple detection strategies, graceful fallback |
| 8 | API validation complex | Research phase if patterns unclear |

### Mitigation Strategies

- **Each phase ends with verification**: Do not proceed until verification criteria met
- **Continuous integration**: CI tests all phases on all platforms
- **Rollback capability**: Backups allow reverting to any previous state
- **User validation**: Test with real user after Milestone 2

---

## Execution Order

**Recommended execution sequence:**

1. **Phase 1 → Phase 2 → Phase 3 → Phase 4** (Sequential, foundation chain)
2. **Phase 5 + Phase 6** (Parallel after Phase 4, both depend on Services)
3. **Phase 7 → Phase 8** (Sequential, feature enhancement)

**Parallel execution notes:**
- Phase 5 (CLI) can use services directly, no TUI dependency
- Phase 6 (TUI) can use services, may call CLI commands for non-interactive fallback
- Merge Phase 5 and 6 work at Phase 7 start

---

## Success Metrics

### Technical Metrics

| Metric | Target | Verification Method |
|--------|--------|---------------------|
| Test Coverage | >=80% core modules | vitest coverage report |
| Cold Start Time | <1 second | Benchmark test |
| Switch Operation | <100ms | Performance test |
| TUI Render | <50ms | Ink performance profiling |
| 100 Project Scan | <5 seconds | Scalability benchmark |

### User Success Metrics

| Metric | Target | Verification Method |
|--------|--------|---------------------|
| First User Success | Complete basic workflow | User testing session |
| Error Recovery | User fixes error from message | User testing observation |
| Workflow Completion | CRUD + switch + preview | User task completion |

---

## Evolution

This roadmap evolves at:
- **Phase completions**: Update verification criteria, adjust estimates
- **Milestone completions**: Review deferred features, adjust priorities
- **User feedback**: Re-prioritize Phase 7-8 features based on validation

---

*Roadmap for: CCAPISwitch*  
*Created: 2026-04-13*  
*Based on: Research Summary (HIGH confidence)*  
*Phase 1 plans added: 2026-04-13*  
*Phase 2 plans added: 2026-04-13*  
*Phase 3 plans added: 2026-04-13*  
*Phase 4 plans added: 2026-04-13*