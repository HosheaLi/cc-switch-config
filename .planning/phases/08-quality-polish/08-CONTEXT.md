# Phase 8: Quality & Polish - Context

**Gathered:** 2026-04-15
**Status:** Ready for planning

<domain>
## Phase Boundary

质量提升和用户体验优化，完善核心功能。

此 phase 在 Project Management Features (Phase 07) 基础上构建：
- **Diff Before Apply (F12)** — 应用配置前显示 unified diff
- **Config Validation UI (F11)** — 全屏展示验证错误，阻止继续
- **Undo/Rollback (U2)** — 单次撤销机制，CLI + TUI 双触发
- **Performance Optimization (N1-N4)** — Benchmark + Profile 优化
- **Documentation** — README + API Docs + Usage Guide

**Scope anchor:** 提升现有功能的用户体验，不添加新核心功能。

</domain>

<decisions>
## Implementation Decisions

### Diff Before Apply (F12)

- **D-01:** Unified diff 格式
  - **Why:** 类似 git diff，删除行红色、新增行绿色，信息密度高，节省屏幕空间
  - **How:** 增强 PreviewPanel 为 UnifiedDiffPanel，使用 chalk 红绿色

- **D-02:** 仅显示变更字段
  - **Why:** 紧凑聚焦变化，不显示未变更字段，减少信息噪音
  - **How:** 对比 before/after 配置，只输出有差异的字段路径和值

- **D-03:** 强制显示
  - **Why:** 每次模板应用前自动展示 diff，确保用户确认变更，防止误操作
  - **How:** ConfigEditorScreen 应用前强制展示 DiffScreen，用户确认后继续

### Config Validation UI (F11)

- **D-04:** 全屏 ErrorScreen
  - **Why:** 类似 ConfirmScreen 模式，聚焦错误列表，适合多错误场景
  - **How:** 新建 ValidationErrorScreen，展示 ValidationError.getMessages() 列表

- **D-05:** 阻止继续
  - **Why:** 显示错误后禁止继续应用，必须先修复配置或取消，严格安全
  - **How:** ValidationErrorScreen 无确认选项，仅提供取消返回编辑

### Undo/Rollback (U2)

- **D-06:** 单次撤销
  - **Why:** undo 命令恢复最近一次修改，简单直观，符合大多数场景
  - **How:** CLI `undo` 命令调用 getLatestBackup() + restoreBackup()

- **D-07:** CLI + TUI 双触发
  - **Why:** CLI undo 命令 + TUI 快捷键 U，灵活触发，覆盖两种使用场景
  - **How:** CLI 新增 undo 命令，TUI ProjectListScreen 添加 U 快捷键处理

### Performance + Docs

- **D-08:** 全面性能优化
  - **Why:** Benchmark + TUI Profile + Services Profile，全面验证 N1/N2/N3/N4
  - **How:** 编写 benchmark 测试脚本，使用 Ink performance hooks，Services 层性能计时

- **D-09:** 完整文档
  - **Why:** README + API Docs + Usage Guide，覆盖安装、API、使用指南
  - **How:** README.md 快速开始，docs/ 目录 API 文档，USAGE.md 用户指南

### Claude's Discretion

- Unified diff 具体颜色方案（chalk 红绿的具体 shade）
- ErrorScreen 错误列表的排序方式（按路径还是按严重性）
- Undo 命令的详细输出消息
- Benchmark 测试的具体工具（vitest bench vs custom）
- API Docs 的生成工具（TypeDoc vs 手写）

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Prior Phase Decisions
- `.planning/phases/07-project-management-features/07-CONTEXT.md` — ImportConflictScreen 参考
- `.planning/phases/06-core-tui/06-CONTEXT.md` — PreviewPanel、ConfirmScreen 模式
- `.planning/phases/02-types-validation/02-CONTEXT.md` — ValidationError 类
- `.planning/phases/01-foundation-safety/01-07-SUMMARY.md` — Backup System 实现

### Requirements
- `.planning/REQUIREMENTS.md` §F11 — Config Validation
- `.planning/REQUIREMENTS.md` §F12 — Diff Before Apply
- `.planning/REQUIREMENTS.md` §U2 — Undo Support
- `.planning/REQUIREMENTS.md` §U5 — Confirmation Prompts (ConfirmScreen 已实现)
- `.planning/REQUIREMENTS.md` §N1 — Fast Startup (<1s)
- `.planning/REQUIREMENTS.md` §N2 — Quick Operations (<100ms)
- `.planning/REQUIREMENTS.md` §N3 — Scalable Scanning (<5s for 100)
- `.planning/REQUIREMENTS.md` §N4 — Responsive TUI (<50ms)
- `.planning/REQUIREMENTS.md` §M1 — Test Coverage (≥80%)

### Existing Code (Backup)
- `src/lib/file-system/backup.ts` — createBackup, restoreBackup, listBackups, getLatestBackup
- `src/lib/file-system/backup.test.ts` — Backup tests

### Existing Code (Validation)
- `src/lib/types/validation.ts` — ValidationError, validateConfig, formatValidationErrors
- `src/lib/types/validation.test.ts` — Validation tests

### Existing Code (TUI Screens)
- `src/tui/screens/ConfirmScreen.tsx` — 全屏确认参考
- `src/tui/screens/ImportConflictScreen.tsx` — 冲突处理参考
- `src/tui/screens/ConfigEditorScreen.tsx` — 配置编辑主界面
- `src/tui/screens/ProjectListScreen.tsx` — 项目列表主界面

### Existing Code (Services)
- `src/lib/services/config-service.ts` — ConfigService
- `src/lib/services/template-service.ts` — TemplateService
- `src/lib/services/project-service.ts` — ProjectService

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/lib/file-system/backup.ts`: createBackup, restoreBackup, getLatestBackup — Undo 直接调用
- `src/lib/types/validation.ts`: ValidationError, validateConfig — Validation UI 直接使用
- `src/tui/screens/ConfirmScreen.tsx`: 全屏确认模式 — ErrorScreen 参考
- `src/tui/screens/ImportConflictScreen.tsx`: 冲突展示模式 — DiffScreen 参考
- `src/tui/screens/ConfigEditorScreen.tsx`: 配置编辑入口 — Diff/Validation 整合点

### Established Patterns
- 全屏 Screen 模式 (ConfirmScreen, ImportConflictScreen)
- useInput + useKeyInput hooks (Phase 06)
- Services 构造函数注入 (Phase 04)
- CLI 命令结构 (Phase 05)
- TDD workflow — vitest

### Integration Points
- `src/tui/screens/DiffScreen.tsx`: 新 unified diff 展示界面
- `src/tui/screens/ValidationErrorScreen.tsx`: 新验证错误全屏界面
- `src/cli/commands/undo.ts`: 新 CLI undo 命令
- `src/tui/components/UnifiedDiff.tsx`: 新 diff 渲染组件
- `src/cli/utils/diff.ts`: 新 diff 生成工具函数
- `scripts/benchmark.ts`: 新性能测试脚本
- `docs/`: 新文档目录
- `README.md`: 更新主文档
- `USAGE.md`: 新用户指南

</code_context>

<specifics>
## Specific Ideas

### Unified Diff Display
```
--- settings.json (before)
+++ settings.json (after)

- env.MODEL: "claude-3-opus"
+ env.MODEL: "claude-4-sonnet"

- apiProvider[0].baseUrl: "https://api.anthropic.com"
+ apiProvider[0].baseUrl: "https://api.openrouter.ai"
```

### Validation Error Screen
```
⚠ Validation Errors

The following issues must be fixed before applying:

✖ env.MODEL: Expected string, received undefined
? env.MAX_OUTPUT_TOKENS: Unrecognized key
⚠ apiProvider[0].baseUrl: Invalid URL format

Press Escape to return and fix errors.
```

### Undo Command Output
```
$ cc-config undo

Restored settings.json from backup:
  Backup: settings.json.2026-04-15T10-30-00-123Z
  Time: 2 minutes ago

Previous configuration has been restored.
```

### TUI Undo Trigger
- ProjectListScreen 按 U → 调用 undoService.undo() → 显示恢复结果
- 按 U 后 StatusBar 显示 "Restored from backup (2 min ago)"

### Benchmark Script
```bash
npm run bench

# Cold Start: 0.8s ✓ (target: <1s)
# Switch Operation: 45ms ✓ (target: <100ms)
# 100 Project Scan: 3.2s ✓ (target: <5s)
# TUI Render 100 items: 35ms ✓ (target: <50ms)
```

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 08-quality-polish*
*Context gathered: 2026-04-15*