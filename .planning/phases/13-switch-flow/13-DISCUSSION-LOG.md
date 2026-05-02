# Phase 13: Switch Flow - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-02
**Phase:** 13-switch-flow
**Areas discussed:** Switch调用, Diff显示, 确认流程, 缺失参数

---

## Switch 命令调用

| Option | Description | Selected |
|--------|-------------|----------|
| project必填 + config可选 | 项目名必填，配置名可选（省略时交互选择） | ✓ |
| 两者必填 | 项目名和配置名都必须提供 | |
| 全交互式 | 省略项目名时从 TUI 列表选择 | |

**User's choice:** project必填 + config可选 (推荐)
**Notes:** 项目名必须明确，配置名可以省略后交互选择

---

## Diff 预览显示

| Option | Description | Selected |
|--------|-------------|----------|
| Unified diff | 复用 Phase 08 generateUnifiedDiff，标准格式 | ✓ |
| Side-by-side | 左右对比，更直观但占空间 | |
| 摘要 + 可选详情 | 先摘要（修改字段数），可选查看完整 diff | |

**User's choice:** Unified diff (推荐)
**Notes:** 标准格式，复用已有实现，清晰易懂

---

## 确认应用流程

| Option | Description | Selected |
|--------|-------------|----------|
| Y/N 确认 | 显示 diff 后 prompts.confirmAction | ✓ |
| 三选项菜单 | 预览 / 应用 / 取消三个选项 | |
| Auto-apply | 显示 diff 直接应用，Ctrl+C 取消 | |

**User's choice:** Y/N 确认 (推荐)
**Notes:** 默认选项为 'n'，安全优先

---

## 参数省略处理

| Option | Description | Selected |
|--------|-------------|----------|
| 交互选择 | selectProject → selectApiConfig 两步 | ✓ |
| 混合处理 | project 省略则报错，config 省略则交互 | |
| 报错退出 | 缺少任何参数都报错退出 | |

**User's choice:** 交互选择 (推荐)
**Notes:** project 必填（报错），config 可选（交互）

---

## Claude's Discretion

- diff 高亮具体 ANSI 颜色码
- config 省略时的选择提示文案
- switch 成功后的输出消息格式
- 项目名不存在的错误消息

---

## Deferred Ideas

- 批量切换多个项目 — v3 BATCH-01
- 配置历史记录（多次 undo） — v2 STATE-01