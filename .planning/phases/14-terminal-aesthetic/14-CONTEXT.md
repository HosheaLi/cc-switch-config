# Phase 14: Terminal Aesthetic - Context

**Gathered:** 2026-05-03
**Status:** Ready for planning

<domain>
## Phase Boundary

建立 OpenCode Terminal Aesthetic 设计系统 — 温暖色调、Monospace 排版、扁平深度、Apple HIG 语义色、NO_COLOR 支持、Windows 兼容性。不涉及 Ink 移除（Phase 15）。

</domain>

<decisions>
## Implementation Decisions

### Color System
- **D-01:** 使用 picocolors (零依赖 ANSI 转义库，最快最小)
- **D-02:** OpenCode warm palette: #201d1d (dark bg), #fdfcfc (light fg), #9a9898 (muted)
- **D-03:** Apple HIG semantic colors: blue (accent), red (danger), green (success), orange (warning)

### Typography
- **D-04:** 系统默认 monospace (依赖终端设置，跨平台一致性最好)
- **D-05:** 全 Monospace 排版，无混合字体

### Depth System
- **D-06:** Flat depth (no shadows, border-only elevation)
- **D-07:** 单线边框，无渐变/浮雕效果

### NO_COLOR Support
- **D-08:** 全局禁用所有颜色 (符合 NO_COLOR 规范，彻底去色)
- **D-09:** 检测 process.env.NO_COLOR，完全移除 ANSI 转义序列

### Windows Compatibility
- **D-10:** TERM_PROGRAM 检测 (简单可靠，覆盖大多数场景)
- **D-11:** Windows CMD 降级为无 ANSI 色，保持可读性

### Claude's Discretion
- 色彩映射的具体 ANSI 码
- 边框字符选择 (ASCII vs Unicode box-drawing)
- 错误状态的色彩强调级别

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Design System
- `.planning/REQUIREMENTS.md` §Design System — UI-01/02/03/04/05/06 requirements
- OpenCode aesthetic reference (warm color palette #201d1d/#fdfcfc/#9a9898)

### Standards
- NO_COLOR spec — https://no-color.org/ (环境变量标准)
- Apple HIG — https://developer.apple.com/design/human-interface-guidelines/color (语义色定义)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/cli/output/table.ts` — 现有表格输出，可扩展色彩系统
- `src/cli/utils/diff-render.ts` — ANSI diff 输出，已有色彩使用
- `src/cli/output/error.ts` — 错误输出，可集成语义色

### Established Patterns
- prompts 库已内置色彩系统，需与 picocolors 协调
- diff-render 使用 ANSI 转义，picocolors 可替换

### Integration Points
- CLI output layer (table/error/diff-render)
- prompts 组件色彩配置
- Windows 兼容性检测入口 (CLI 启动时)

</code_context>

<specifics>
## Specific Ideas

- OpenCode warm aesthetic: 温暖色调而非冷色调 (#201d1d/#fdfcfc vs 纯黑/白)
- Flat depth: 无阴影/渐变，保持终端原生感
- NO_COLOR 完全禁用: 不保留任何色彩，包括 prompts 内置色

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---
*Phase: 14-terminal-aesthetic*
*Context gathered: 2026-05-03*