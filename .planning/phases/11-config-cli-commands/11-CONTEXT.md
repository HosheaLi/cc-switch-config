# Phase 11: Config CLI Commands - Context

**Gathered:** 2026-04-30
**Status:** Ready for planning

<domain>
## Phase Boundary

实现 CLI 命令管理 API 配置：`cc-config config add/list/remove`。用户通过安全输入添加配置，表格查看配置列表，确认后删除配置。所有命令使用 ApiService/ApiConfigStore，不依赖 TemplateService。

**Scope anchor:** CFG-03, SEC-02, SEC-04 (CLI 命令、验证消息、password input)
**Out of scope:** 首次引导流程(Phase 12)、switch 命令(Phase 13)、Ink移除(Phase 15)

</domain>

<decisions>
## Implementation Decisions

### CLI 命令结构
- **D-01:** 新建 `src/cli/commands/config.ts` 注册 Commander 子命令
- **D-02:** config-wizard.ts 标记废弃，Phase 15 移除（不立即删除）
- **D-03:** config 命令注册到 `src/cli/index.ts` 顶层程序
- **D-04:** 子命令风格与 template.ts 保持一致 (command + alias)

### config list 输出格式
- **D-05:** 表格式输出：每行显示 name + modelName + apiKey 状态 (masked)
- **D-06:** 无 JSON 输出选项（保持简单，v3 可扩展）
- **D-07:** 空列表时显示友好提示 + 创建命令引导

### config remove 确认流程
- **D-08:** 默认需要用户确认，`--force` 跳过确认
- **D-09:** 与 template delete 风格一致 (U5 确认提示)
- **D-10:** 确认消息显示配置名和删除风险提示

### ValidationError 展示
- **D-11:** 分组展示：按字段类型分组 (配置名/API Key/URL/模型)
- **D-12:** 颜色区分：chalk.red 用于错误，chalk.gray 用于提示
- **D-13:** 输出到 stderr，保持 stdout 干净

### config add 交互流程
- **D-14:** 复用 inputFullApiConfig() 组件 (password input 已实现)
- **D-15:** 交互顺序：name → apiKey (password) → baseUrl → modelName
- **D-16:** 默认值：baseUrl=api.anthropic.com, modelName=claude-sonnet-4-6

### Claude's Discretion
- config.ts 内部函数命名和结构
- 颜色具体值（chalk 风格）
- 错误分组标题文案

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements
- `.planning/ROADMAP.md` §Phase 11 — Goal, Success Criteria (5 criteria), Requirements mapping
- `.planning/REQUIREMENTS.md` §CFG-03, §SEC-02, §SEC-04 — 具体需求定义

### Phase 10 成果 (依赖)
- `src/lib/types/api-config.ts` — ApiConfig 类型定义 (D-01~06)
- `src/lib/store/api-config.ts` — ApiConfigStore 实现 (D-07)
- `src/lib/services/api-service.ts` — ApiService CRUD 服务
- `src/lib/security/api-key.ts` — maskApiKey, validateNoCliApiKey (D-09~10)
- `src/cli/prompts/components/input-api-key.ts` — password input 组件 (SEC-04)

### 参考代码结构
- `src/cli/commands/template.ts` — 类似 CLI 命令结构 (registerTemplateCommand pattern)
- `src/cli/index.ts` — CLI 入口，需添加 registerConfigCommand
- `src/cli/output/error.ts` — handleCLIError, ExitCodes

### Prompts 相关
- `src/cli/prompts/utils/handle-cancel.ts` — promptWithCancel 包装
- `src/cli/prompts/utils/theme.ts` — 颜色样式工具

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- ApiService: createConfig/getConfig/updateConfig/deleteConfig/listConfigs/getAllConfigs — CRUD 完成
- ApiConfigStore: 全局配置存储，原子写入+备份 (R1/R2)
- inputFullApiConfig(): 完整 API 配置交互流程，password input SEC-04 已实现
- maskApiKey(): 显示最后4字符，用于 list 输出
- handleCLIError(): 错误处理，exit code 映射

### Established Patterns
- Commander.js: command().command() 嵌套子命令模式 (template.ts)
- CLI 命令注册: registerXxxCommand 函数 + program 参数注入
- 错误处理: ServiceError with code + handleCLIError (D-02 v1.0)
- 确认流程: --force 选项跳过确认 (U5 pattern)

### Integration Points
- src/cli/index.ts: 需添加 registerConfigCommand(program) 调用
- src/cli/prompts/wizards/config-wizard.ts: 标记 @deprecated
- src/lib/services/index.ts: ApiService barrel export

</code_context>

<specifics>
## Specific Ideas

- 命令别名：config 可简写为 cfg（与 template/tpl 对称）
- list 输出示例：
  ```
  可用配置
  ────────────────────────────────────
    anthropic        claude-sonnet-4-6    ...4xyz
    openrouter       glm-5                ...t123
  ────────────────────────────────────
  共 2 个配置
  ```
- 错误分组示例：
  ```
  ✖ 配置名错误
    名称不能为空
    名称已存在

  ✖ API Key 错误
    长度不足 (需 >10 字符)
  ```

</specifics>

<deferred>
## Deferred Ideas

- JSON 输出格式 — v3 (FUZZ-01 时期可能需要)
- config edit 命令 — v3 (复杂交互)
- 批量删除 — v3 (批量操作延后)
- 配置导出/导入 — Phase 07 已有，Phase 11 不涉及

</deferred>

---
*Phase: 11-config-cli-commands*
*Context gathered: 2026-04-30*