---
gsd_state_version: 1.0
milestone: v2.0
milestone_name: Terminal-Native
status: executing
last_updated: "2026-05-02T09:11:20.085Z"
last_activity: 2026-05-02
progress:
  total_phases: 7
  completed_phases: 1
  total_plans: 11
  completed_plans: 9
  percent: 82
---

# Project State

**Project:** CCAPISwitch
**Updated:** 2026-04-30

---

## Current Position

Phase: 11 (config-cli-commands) — EXECUTING
Plan: 1 of 3
**Milestone:** v2.0 Terminal-Native
**Phase:** 12 of 15 (first run wizard)
**Plan:** Not started
**Status:** Executing Phase 11
**Last activity:** 2026-05-02

Progress: [████████░░░░░░░░░░░░] 53% (8/15 phases complete)

---

## Accumulated Context

### v1.0 Completed (2026-04-15)

- 8 phases, 33 plans, 875 tests, 22,701 LOC
- All P1/P2 requirements validated
- Core features: Project management, Ink TUI, CLI, Templates, Validation, Diff, Undo
- Quality: Performance benchmarks passed, Documentation complete
- Key decisions: Ink + React (TUI), 明文存储 Token, Vitest bench mode, Duck typing for errors

### v2.0 Goals

**TUI 替换:** Ink → prompts (npm 风格列表选择, j/k + Enter/Esc)
**配置简化:** TemplateConfig → 三元组 (name/apiKey/baseUrl/modelName)
**首次引导:** 安装后引导流程 (API配置 → 扫描目录 → 扫描 → 主界面)
**精确替换:** 只修改 env/model，保留 permissions/hooks/mcpServers
**Terminal Aesthetic:** OpenCode 设计理念 (#201d1d/#fdfcfc, Apple HIG 语义色)
**安全增强:** API key 不暴露于 CLI args/logs/screenshots, password-type input

---

## Phase Progress

| Phase | Status | Plans |
|-------|--------|-------|
| 09. Prompts Integration | Not started | TBD |
| 10. Config Service | Not started | TBD |
| 11. Config CLI Commands | Not started | TBD |
| 12. First-Run Wizard | Not started | TBD |
| 13. Switch Flow | Not started | TBD |
| 14. Terminal Aesthetic | Not started | TBD |
| 15. Ink Removal | Not started | TBD |

---

## Decisions

### v1.0 Locked Decisions (Preserved)

- **D-01:** Services 作为类 + 构造函数注入
- **D-02:** Services 抛出 Error 错误处理
- **D-03:** 模板应用使用 Deep Merge (保留，用于精确字段替换)
- **D-04:** 项目检测：自动扫描 + 手动确认
- **D-05:** 扫描目录：用户配置根目录
- **R1:** 原子写入
- **R2:** 备份系统
- **M4:** 模块分离 (Services 不依赖 UI)

### v2.0 New Decisions (To be locked)

- **TUI Framework:** prompts (terkelg/prompts) — npm 风格列表选择
- **Config Structure:** 三元组 ApiConfig (name/apiKey/baseUrl/modelName)
- **Field Replacement:** 精确字段替换 (只修改 env/model，保留其他)
- **Design System:** OpenCode Terminal Aesthetic (#201d1d/#fdfcfc, Apple HIG)
- **Security:** API key password-type input, masked display, no CLI args exposure

---

## Deferred Items

| Category | Item | Status | Deferred At |
|----------|------|--------|-------------|
| Feature | MCP 服务器管理 | v3 | 2026-04-30 |
| Feature | API 连接验证 | v3 | 2026-04-30 |
| Feature | 预定义供应商模板 | v3 | 2026-04-30 |
| Feature | 批量操作 | v3 | 2026-04-30 |
| Feature | 桌面 GUI | v3 | 2026-04-30 |

---

## Recent Activity

| Date | Action | Result |
|------|--------|--------|
| 2026-04-30 | v2.0 roadmap created | 7 phases (09-15), 28 requirements mapped |
| 2026-04-15 | v1.0 completed | 875 tests, ready for release |

---

*State updated: 2026-04-30 after v2.0 roadmap created*
