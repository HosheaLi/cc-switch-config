---
gsd_state_version: 1.0
milestone: v2.0
milestone_name: 重构
current_phase: 00
current_plan: Not started
status: defining_requirements
last_updated: "2026-04-30T00:00:00.000Z"
progress:
  total_phases: 0
  completed_phases: 0
  total_plans: 0
  completed_plans: 0
  percent: 0
---

# Project State

**Project:** CCAPISwitch
**Updated:** 2026-04-30

---

## Current Position

**Milestone:** v2.0 重构
**Phase:** Not started (defining requirements)
**Plan:** —
**Status:** Defining requirements
**Last activity:** 2026-04-30 — Milestone v2.0 started

---

## Accumulated Context

### v1.0 Completed (2026-04-15)

- 8 phases, 45 plans, 875 tests, 22,701 LOC
- All P1/P2 requirements validated
- Core features: Project management, Ink TUI, CLI, Templates, Validation, Diff, Undo
- Quality: Performance benchmarks passed, Documentation complete
- Key decisions: Ink + React (TUI), 明文存储 Token, Vitest bench mode

### v2.0 Goals

**TUI 替换:** Ink → prompts (npm 风格列表选择)
**配置简化:** TemplateConfig → 三元组 (name/apiKey/baseUrl/modelName)
**首次引导:** 安装后引导流程 (API配置 → 扫描)
**精确替换:** 只修改 env/model，保留其他字段
**Terminal Aesthetic:** OpenCode 设计理念 (温暖色调, Apple HIG 语义色)

---

## Phase Progress

(None — roadmap not yet created)

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

### v2.0 New Decisions (To be locked)

- **TUI Framework:** prompts (terkelg/prompts) — npm 风格列表选择
- **Config Structure:** 三元组 ApiConfig (name/apiKey/baseUrl/modelName)
- **Design System:** OpenCode Terminal Aesthetic (#201d1d/#fdfcfc, Apple HIG)

---

## Recent Activity

| Date | Action | Result |
|------|--------|--------|
| 2026-04-30 | Milestone v2.0 started | PROJECT.md updated with Active requirements |
| 2026-04-15 | v1.0 completed | 875 tests, ready for release |

---
*State updated: 2026-04-30 after v2.0 milestone started*