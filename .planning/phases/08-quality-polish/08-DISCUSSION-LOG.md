# Phase 8: Quality & Polish - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-15
**Phase:** 08-quality-polish
**Areas discussed:** Diff Display Format, Validation UI, Undo Mechanism, Performance + Docs

---

## Diff Display Format (F12)

| Option | Description | Selected |
|--------|-------------|----------|
| Side-by-side | 左侧旧值、右侧新值，直观对比。适合少量字段修改，但占用屏幕空间大 | |
| Unified diff | 类似 git diff，删除行红色、新增行绿色。适合多字段修改，信息密度高，节省空间 | ✓ |
| Inline inline | 单行内显示 old → new，简洁紧凑。适合少量单字段修改，字段多时混乱 | |

**User's choice:** Unified diff
**Notes:** 类似 git diff 格式，删除行红色、新增行绿色

---

## Diff Detail Level

| Option | Description | Selected |
|--------|-------------|----------|
| 仅显示变更字段 | 显示字段路径和旧新值，不显示未变更字段。紧凑且聚焦变化 | ✓ |
| 显示全部字段 | 显示所有字段，不变字段用灰色标记。完整但可能信息过多 | |

**User's choice:** 仅显示变更字段
**Notes:** 紧凑聚焦变化

---

## Diff Trigger Timing

| Option | Description | Selected |
|--------|-------------|----------|
| 强制显示 | 每次模板应用前自动显示 diff，用户确认后应用。无跳过选项 | ✓ |
| 可选显示 | 显示 diff 但允许用户跳过直接应用。适合熟练用户 | |
| 默认跳过 | 默认直接应用，按 D 键查看 diff。快但可能失误 | |

**User's choice:** 强制显示
**Notes:** 每次模板应用前自动展示，用户必须确认

---

## Validation UI Location (F11)

| Option | Description | Selected |
|--------|-------------|----------|
| 全屏 ErrorScreen | 类似 ConfirmScreen 全屏展示，聚焦错误列表。适合多错误场景 | ✓ |
| 状态栏显示 | StatusBar 持续显示，用户可继续操作。适合单错误场景，可能被忽视 | |
| Inline 字段旁显示 | 直接在 ConfigEditorScreen 字段旁显示错误。适合表单场景，布局复杂 | |

**User's choice:** 全屏 ErrorScreen
**Notes:** 类似 ConfirmScreen 模式

---

## Validation Error Behavior

| Option | Description | Selected |
|--------|-------------|----------|
| 阻止继续 | 显示错误后禁止继续，必须先修复配置或取消。严格安全 | ✓ |
| 允许忽略 | 显示错误但允许用户忽略继续应用。可能损坏配置 | |

**User's choice:** 阻止继续
**Notes:** 显示错误后禁止应用，必须先修复或取消

---

## Undo Mechanism (U2)

| Option | Description | Selected |
|--------|-------------|----------|
| 单次撤销 | 提供 undo 命令恢复最近一次修改。简单直观，符合大多数场景 | ✓ |
| 历史选择 | 列出备份历史让用户选择恢复哪个版本。灵活但复杂 | |
| 仅 Diff + Undo 命令 | 每次应用显示 diff + undo 命令。无历史浏览，简单快 | |

**User's choice:** 单次撤销
**Notes:** undo 命令恢复最近一次修改

---

## Undo Trigger Method

| Option | Description | Selected |
|--------|-------------|----------|
| CLI + TUI 快捷键 | CLI 提供 undo 命令，TUI 提供快捷键 U。灵活触发 | ✓ |
| 仅 CLI 命令 | 仅 CLI undo 命令。简单，但不方便 TUI 用户 | |
| 仅 TUI 快捷键 | 仅 TUI 快捷键。不方便 CLI 用户 | |

**User's choice:** CLI + TUI 快捷键
**Notes:** CLI undo 命令 + TUI 快捷键 U

---

## Performance Optimization Methods

| Option | Description | Selected |
|--------|-------------|----------|
| Benchmark 测试 | 为 N1/N2/N3/N4 编写 benchmark 测试。可量化验证 | ✓ |
| TUI Profile | 检查 TUI 渲染性能瓶颈。可优化 Ink 使用 | ✓ |
| Services Profile | 检查 Services 层性能瓶颈。可优化数据流 | ✓ |

**User's choice:** 全部选择
**Notes:** 全面性能优化：Benchmark + TUI Profile + Services Profile

---

## Documentation Scope

| Option | Description | Selected |
|--------|-------------|----------|
| README | 安装、快速开始、命令参考、配置说明。基础必要 | ✓ |
| API Docs | Services、Types、Store API 文档。维护参考 | ✓ |
| Usage Guide | 用户指南、最佳实践。用户教育 | ✓ |

**User's choice:** 全部选择
**Notes:** 完整文档：README + API Docs + Usage Guide

---

## Claude's Discretion

- Unified diff 具体颜色方案（chalk 红绿的具体 shade）
- ErrorScreen 错误列表的排序方式（按路径还是按严重性）
- Undo 命令的详细输出消息
- Benchmark 测试的具体工具（vitest bench vs custom）
- API Docs 的生成工具（TypeDoc vs 手写）

## Deferred Ideas

None — discussion stayed within phase scope.