# Phase 13: Switch Flow - Context

**Gathered:** 2026-05-02
**Status:** Ready for planning

<domain>
## Phase Boundary

实现项目配置切换流程：用户通过 `cc-config switch <project> [config]` 切换项目配置，看到 unified diff 预览后 Y/N 确认应用或拒绝。

**Scope anchor:** CFG-05, ONB-06 (切换命令、diff预览、确认流程)
**Out of scope:** Terminal Aesthetic (Phase 14), Ink移除 (Phase 15)

</domain>

<decisions>
## Implementation Decisions

### Switch 命令调用
- **D-01:** 命令格式 `cc-config switch <project> [config]` — project 必填，config 可选
- **D-02:** project 参数省略时报错退出并提示用法
- **D-03:** config 参数省略时启动交互选择（调用 selectApiConfig）

### Diff 预览显示
- **D-04:** 复用 Phase 08 generateUnifiedDiff 函数生成标准格式
- **D-05:** 显示格式：`--- a/.claude/settings.json` / `+++ b/.claude/settings.json`
- **D-06:** 高亮变化字段：env.MODEL_NAME, env.ANTHROPIC_API_KEY（红色删除/绿色新增）

### 确认应用流程
- **D-07:** 使用 prompts.confirmAction 组件进行 Y/N 确认
- **D-08:** 默认选项为 'n'（安全优先，避免误操作）
- **D-09:** Ctrl+C 触发 onCancel，显示 "操作已取消，未修改配置"

### Claude's Discretion
- diff 高亮具体 ANSI 颜色码
- config 省略时的选择提示文案
- switch 成功后的输出消息格式
- 项目名不存在的错误消息

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements
- `.planning/ROADMAP.md` §Phase 13 — Goal, Success Criteria (3 criteria)
- `.planning/REQUIREMENTS.md` §CFG-05, §ONB-06 — Switch 命令和 diff 预览需求定义

### Prior Phase 成果 (依赖)
- `src/lib/utils/diff.ts` — generateUnifiedDiff 函数 (Phase 08)
- `src/cli/prompts/components/select-project.ts` — selectProject 交互组件 (Phase 9)
- `src/cli/prompts/components/select-template.ts` — selectApiConfig 选择组件 (需适配 ApiConfigStore)
- `src/cli/prompts/components/confirm-action.ts` — confirmAction 确认组件 (Phase 9)
- `src/lib/store/api-config.ts` — ApiConfigStore CRUD (Phase 10)
- `src/lib/services/config-service.ts` — applyApiConfig 方法 (Phase 10)
- `src/lib/store/project.ts` — ProjectIndex 项目查找

### 参考代码结构
- `src/cli/index.ts` — CLI 入口（需添加 switch 命令）
- `src/cli/commands/switch.ts` — 新建 switch 命令处理

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- generateUnifiedDiff(): 已验证的 diff 生成函数，标准 unified format
- selectProject(): 项目列表选择组件
- confirmAction(): Y/N 确认组件，支持默认选项
- ApiConfigStore.list(): 获取所有 API 配置
- ConfigService.applyApiConfig(): 精确字段替换（保留 permissions/hooks/mcpServers）

### Established Patterns
- Prompts 交互流程: 线性流程，清晰的步骤提示
- 命令参数解析: Commander.js positional args
- 错误处理: ValidationError + 友好消息
- Clean Architecture (M4): CLI → Services → Store

### Integration Points
- src/cli/index.ts: 注册 switch 命令
- src/cli/commands/switch.ts: 新建，实现 switch 逻辑
- src/cli/prompts/components/select-template.ts: 需适配为 selectApiConfig

</code_context>

<specifics>
## Specific Ideas

- "我希望看到清晰的 diff，然后选择是否应用"
- "默认不应用，安全优先"
- "项目名必须明确指定，不能瞎猜"

</specifics>

<deferred>
## Deferred Ideas

- 批量切换多个项目 — v3 BATCH-01
- 配置历史记录（多次 undo） — v2 STATE-01
- Switch 前自动备份提示 — 已有 backup system (R2)

</deferred>

---
*Phase: 13-switch-flow*
*Context gathered: 2026-05-02*