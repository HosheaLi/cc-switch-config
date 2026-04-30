# Phase 09: Prompts Integration - Context

**Gathered:** 2026-04-30
**Status:** Ready for planning

<domain>
## Phase Boundary

实现 terminal-native prompts 界面替换 Ink React TUI。用户通过 prompts 列表选择器交互，支持 j/k 和箭头键导航，Enter 确认，Esc 取消，线性 wizard 流程，大列表 autocomplete 搜索，Ctrl+C 优雅退出。

**Scope anchor:** TUI-01~05 (导航、确认、wizard、搜索、退出)
**Out of scope:** Ink 移除(Phase 15)、Config Service(Phase 10)、首次引导(Phase 12)

</domain>

<decisions>
## Implementation Decisions

### Prompts Library
- **D-01:** 使用 prompts (terkelg/prompts) 替换 Ink React TUI
  - npm 风格选择器，成熟稳定
  - 内置 select/confirm/password 等类型
  - 支持 autocomplete 模式

### Navigation Mode
- **D-02:** 同时支持 j/k 键和箭头键导航
  - j/k = vim 风格，终端用户熟悉
  - 箭头键 = GUI 用户友好
  - prompts 内置支持两种模式

### Wizard Flow
- **D-03:** 首次引导流程顺序按 ROADMAP.md
  1. API 配置 (prompts 输入)
  2. 扫描目录选择
  3. 执行扫描 (progress indicator)
  4. 选择项目 (select)
  5. 选择配置 (select)
  6. 确认应用

### Search Mode
- **D-04:** 大列表(>20项目)使用 prompts autocomplete 模式
  - 内置支持，实现简单
  - prefix 匹配，过滤非连续
  - fuzzy 搜索延后(v3 FUZZ-01)

### Exit Handling
- **D-05:** Ctrl+C 触发 onCancel 回调
  - prompts 内置 onCancel 支持
  - 优雅退出提示
  - 不中断 wizard 状态

### Claude's Discretion
- prompts 样式定制 (颜色、符号)
- 进度指示器具体实现
- 错误提示样式

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Prompts Integration
- `.planning/ROADMAP.md` §Phase 9 — Goal, Success Criteria, Requirements mapping
- `.planning/REQUIREMENTS.md` §TUI-01~05 — 具体需求定义

### Existing Ink TUI (to replace)
- `src/tui/` — Ink React TUI 实现 (待移除)
- `src/screens/` — 7 screens (待替换为 prompts 等效)

### Prompts Library
- `https://github.com/terkelg/prompts` — 官方文档 (select/confirm/password/autocomplete)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/services/` — Services 层完整，可直接调用
- `src/repositories/` — 数据层完整，无需修改
- `src/cli/` — CLI entry point，需集成 prompts

### Established Patterns
- Clean Architecture: CLI → Services → Repositories (M4 enforced)
- Barrel exports for all layers
- Service injection via constructor DI

### Integration Points
- `src/cli/index.ts` — CLI 入口，需替换 TUI 调用为 prompts
- `src/services/ProjectService.ts` — scan/list 方法，prompts 调用
- `src/services/ConfigService.ts` — apply/validate 方法，prompts 调用

</code_context>

<specifics>
## Specific Ideas

- npm init 风格交互体验
- j/k 导航 = vim 用户习惯
- 线性 wizard = 无多屏导航 (ROADMAP 明确)

</specifics>

<deferred>
## Deferred Ideas

- Ink 移除 — Phase 15
- TemplateService/TemplateStore 移除 — Phase 15
- 首次引导 firstRunCompleted flag — Phase 12
- Fuzzy 搜索集成 — v3 FUZZ-01

</deferred>

---
*Phase: 09-prompts-integration*
*Context gathered: 2026-04-30*