# CC Config Manager

## What This Is

一个 CLI/TUI 工具，用于管理 Claude Code 的项目级 API provider 配置。提供安全可靠的多项目配置管理、交互式 TUI 界面、供应商模板系统，支持配置预览、验证和撤销。

## Core Value

**一站式配置管理**：让 Claude Code 的多项目、多 API、多模型配置变得简单、可靠、可视化。

## Requirements

### Validated (v1.0)

- ✓ 项目目录管理 (F1, F10) — v1.0
- ✓ 项目列表展示 (F4) — v1.0
- ✓ 交互式 TUI 选择器 (F2) — v1.0 (Ink实现，v2.0替换为prompts)
- ✓ 配置预览和 Diff (F3, F12) — v1.0
- ✓ 快速切换命令 (F5) — v1.0
- ✓ 当前状态显示 (F6) — v1.0
- ✓ 供应商模板 CRUD (F7) — v1.0 (复杂TemplateConfig，v2.0简化为三元组)
- ✓ Token 安全检测 (F8, S1-S3) — v1.0
- ✓ 自动目录切换 (F9) — v1.0
- ✓ 配置验证 (F11) — v1.0
- ✓ 导入导出配置 (F13) — v1.0
- ✓ 模糊搜索 (F14) — v1.0
- ✓ Undo 撤销支持 (U2) — v1.0
- ✓ 键盘导航 (U3) — v1.0
- ✓ 确认提示 (U5) — v1.0
- ✓ 性能目标 (N1-N4) — v1.0
- ✓ 原子写入 (R1) — v1.0
- ✓ 备份系统 (R2) — v1.0
- ✓ 跨平台支持 (R4) — v1.0
- ✓ 测试覆盖率 80%+ (M1) — v1.0

### Validated (v2.0)

- ✓ **CLI-01**: Config 命令 (add/list/remove API配置) — Phase 11

### Active (v2.0)

- [ ] **TUI-01**: 使用 prompts 实现 npm 风格列表选择 (j/k + Enter)
- [ ] **TUI-02**: 移除 Ink React TUI 层及相关依赖
- [ ] **CFG-01**: 简化配置为三元组 (name + apiKey + baseUrl + modelName)
- [ ] **CFG-02**: 精确字段替换 (只修改 env/model，保留 permissions/hooks/mcpServers)
- [ ] **ONB-01**: 首次引导流程 (填写API配置 → 选择扫描目录 → 执行扫描)
- [ ] **ONB-02**: AppState 扩展 firstRunCompleted 字段
- [ ] **SCAN-01**: 扫描并行化优化 (Promise.all 替代串行 await)
- [ ] **SCAN-02**: 扩展跳过目录列表 (node_modules, .git, dist, build, target, .venv)
- [ ] **UI-01**: OpenCode Terminal Aesthetic (温暖色调 #201d1d/#fdfcfc, Apple HIG 语义色)
- [ ] **UI-02**: 全 Monospace 排版，无阴影深度系统

### Out of Scope (v2.0)

- MCP 服务器管理 — 复杂度高，保持 v1.0 决策 → v3
- API 连接验证 — Provider 验证 API 不一致 → v3
- 预定义供应商模板 — 维护负担，易过时 → v3
- 批量操作 — 需先验证单项目工作流 → v3
- 桌面 GUI — TUI 优先，prompts 满足需求 → v3
- 多层配置优先级 — 高级功能 → v3
- API Token 加密 — Claude Code 本身用明文，保持一致
- 云端同步 — 本地工具，不依赖云端
- 多用户协作 — 个人工具
- 配置历史/Undo 多次 — v2.0 只保留单次 undo

## Current Milestone: v2.0 重构

**Goal:** Terminal-Native 体验重构 - 替换 Ink 为 prompts，简化配置管理，实现首次引导流程

**Target features:**
- TUI-01/02: prompts 列表选择，移除 Ink React 层
- CFG-01/02: 三元组配置，精确字段替换
- ONB-01/02: 首次引导流程，firstRunCompleted 字段
- SCAN-01/02: 扫描并行化，扩展跳过目录
- UI-01/02: OpenCode Terminal Aesthetic
- CLI-01: config 命令管理 API 配置

**Key context:**
- v1.0 TUI 体验差（用户反馈"逻辑混乱样式难看"）
- 扫描串行遍历效率低
- 配置与项目关联薄弱
- 用户期望流程：安装 → 填API配置 → 扫描 → 选择项目 → 选择API配置 → 确认修改

## Context

### Current State (v1.0)

| Metric | Value |
|--------|-------|
| LOC | 22,701 TypeScript |
| Tests | 875 passing |
| Phases | 8 complete |
| Plans | 45 executed |
| Commits | 207 |
| Duration | 3 days (Apr 13-15) |

**Tech Stack:** Node.js 25.6 + TypeScript + ink (React TUI) + Commander.js + Zod + vitest + tsup

**Architecture:**
- Clean Architecture: CLI → Services → Repositories (M4 enforced)
- Barrel exports for all layers
- Service injection via constructor DI

### Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| 先 TUI 后桌面 | 快速迭代验证功能，降低开发风险 | ✓ Good — TUI 满足需求 |
| ink + React | React 组件式开发熟悉度高，生态成熟 | ✓ Good — 7 screens, 10+ components |
| 自定义模板先行 | 灵活性优先，预定义后续添加 | ✓ Good — 用户完全自定义 |
| 明文存储 Token | Claude Code 本身用明文，保持一致 | ✓ Good — 用户理解风险 |
| npm + Git 分发 | npm 便于安装，Git 便于查看源码 | ✓ Good — package.json ready |
| Vitest bench mode | 统一测试框架，benchmark 一体化 | ✓ Good — N1-N4 verified |
| Duck typing for errors | Vitest 模块隔离导致 instanceof 失败 | ✓ Good — 跨模块兼容 |
| Mandatory diff display | 用户必须预览变更，不能跳过 | ✓ Good — D-03 enforced |

### 问题背景

Claude Code 支持项目级配置（`.claude/settings.json`），但当前只能通过手动编辑 JSON 文件来配置。用户有多个项目使用不同的 API 服务和模型，管理分散且容易出错。

### 参考项目

- **cc-switch** (https://github.com/farion1231/cc-switch)：成熟的桌面配置管理工具，支持多供应商、多项目管理。基于 Tauri 2 + React。

## Constraints

- **技术栈**: Node.js 18+ + TypeScript + ink (React TUI) + Commander.js + Zod
- **平台**: macOS, Windows, Linux (tested in CI)
- **分发**: npm 包 + Git 仓库
- **安全**: API Token 存于 settings.local.json（不提交 git），检测 git tracking
- **无外部服务**: 本地工具，不依赖云端服务
- **测试**: ≥80% coverage for core modules (875 tests)

---
*Last updated: 2026-04-30 after v2.0 milestone started*

## Evolution

**v1.0 MVP - Completed 2026-04-15:**
- 8 phases, 45 plans, 875 tests, 22,701 LOC
- All P1/P2 requirements validated
- Core features: Project management, TUI, CLI, Templates, Validation, Diff, Undo
- Quality: Performance benchmarks passed, Documentation complete
- Ready for release: npm publish ready, git tag v1.0

**Phase 08 (Quality & Polish) - Completed 2026-04-15:**
- Diff utilities (generateUnifiedDiff, UnifiedDiff component) for F12
- DiffScreen mandatory before every template application (D-03)
- ValidationErrorScreen with blocking behavior (D-05: no 'y' confirm)
- UndoService + CLI undo command + TUI 'U' key (U2)
- Performance benchmarks: N1 34ms, N4 37ms (both under targets)
- Documentation: README.md, USAGE.md, TypeDoc configuration

**Phase 07 (Project Management) - Completed 2026-04-14:**
- Auto-switch shell hook (F9): direnv-style PROMPT_COMMAND/chpwd_functions
- Directory scan (F10): CLI scan command + ScanScreen TUI multi-select
- Import/Export (F13): JSON schema, ImportConflictScreen TUI

**Phase 06 (Core TUI) - Completed 2026-04-14:**
- Complete TUI interface with Ink: 7 screens, 10+ components, 4 hooks
- ProjectListScreen with fuzzy search (F14) and dual navigation (U3)
- ConfigEditorScreen with template preview (F3) and diff (F12)
- ConfirmScreen with y/n confirmation (U5)
- M4 verified: Services do NOT import ink/react
- N4 verified: TUI renders <50ms
- 644 tests passing

This document evolves at phase transitions and milestone boundaries.