# Phase 09: Prompts Integration - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions captured in 09-CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-30
**Phase:** 09-prompts-integration
**Mode:** discuss
**Areas discussed:** Prompts库选择, 导航模式, Wizard流程, 搜索模式

---

## Prompts Library

| Option | Description | Selected |
|--------|-------------|----------|
| prompts (terkelg) | npm风格选择器，j/k导航，内置autocomplete，成熟稳定 | ✓ |
| enquirer | 更轻量，模块化，但需自己组合select+autocomplete | |
| Other | 用户自定义实现 | |

**User's choice:** prompts (Recommended)
**Notes:** npm init 风格，成熟稳定，内置所需功能

---

## Navigation Mode

| Option | Description | Selected |
|--------|-------------|----------|
| Both (j/k + arrows) | npm init 风格，最常见终端操作习惯 | ✓ |
| j/k only | 纯 vim 风格，更简洁但需用户熟悉 | |
| Arrow keys only | 纯 GUI 风格，但终端用户习惯j/k | |

**User's choice:** Both (Recommended)
**Notes:** prompts 内置支持两种模式，覆盖所有用户

---

## Wizard Flow

| Option | Description | Selected |
|--------|-------------|----------|
| 按ROADMAP | API配置→扫描目录→执行扫描→选择项目→选择配置→确认 | ✓ |
| Other | 用户自定义流程 | |

**User's choice:** 按ROADMAP (Recommended)
**Notes:** 线性 wizard，无多屏导航

---

## Search Mode

| Option | Description | Selected |
|--------|-------------|----------|
| Autocomplete | prompts内置，实现简单，prefix匹配 | ✓ |
| Fuzzy search | fuzzy更灵活，但需额外库集成 | |

**User's choice:** Autocomplete (Recommended)
**Notes:** 大列表用 autocomplete，fuzzy 延后 v3

---

## Claude's Discretion

- prompts 样式定制 (颜色、符号)
- 进度指示器具体实现
- 错误提示样式

---

## Deferred Ideas

- Ink 移除 — Phase 15
- TemplateService/TemplateStore 移除 — Phase 15
- 首次引导 firstRunCompleted flag — Phase 12
- Fuzzy 搜索集成 — v3 FUZZ-01