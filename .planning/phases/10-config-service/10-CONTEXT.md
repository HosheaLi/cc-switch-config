# Phase 10: Config Service - Context

**Gathered:** 2026-04-30
**Status:** Ready for planning

<domain>
## Phase Boundary

实现 API 配置管理服务重构：三元组 ApiConfig 替换 v1.0 TemplateConfig，精确字段替换（只改 env/model 保留其他），全局配置库存储，ApiKey 安全处理（mask + 禁止 CLI args）。

**Scope anchor:** CFG-01/02/04, SEC-01/03 (三元组、精确替换、安全处理)
**Out of scope:** CLI 命令实现(Phase 11)、首次引导(Phase 12)、Ink移除(Phase 15)

</domain>

<decisions>
## Implementation Decisions

### ApiConfig 数据结构
- **D-01:** ApiConfig 包含 name/apiKey/baseUrl/mode/modelName/env 字段
- **D-02:** mode 字段支持 'unified' 和 'granular' 两种配置模式
- **D-03:** unified 模式使用 modelName 字段（单一模型名）
- **D-04:** granular 模式使用完整 env 对象（ClaudeSettings.env 格式）
- **D-05:** name 在全局配置库中唯一（跨项目共享）
- **D-06:** 默认配置模式为 unified（简化首次配置）

### 存储位置
- **D-07:** 全局配置库存储于 ~/.claude/api-configs.json（XDG 标准位置）
- **D-08:** Phase 10 立即重构 TemplateStore → ApiConfigStore（不延后 Phase 15）

### ApiKey 安全处理
- **D-09:** 禁止 apiKey 通过 CLI args 传递（避免 shell history 泄漏）
- **D-10:** 复用 maskToken 函数用于 apiKey masking（显示最后4字符）
- **D-11:** Password-type input 延后 Phase 11 实现（config add 命令时）

### 精确字段替换
- **D-12:** 新建 replaceEnvModel 函数实现精确字段替换（不修改 deepMergeConfig）
- **D-13:** 完全替换 env/model 字段（不保留旧值，简单明确）
- **D-14:** unified 模式生成标准 env 对象（6个模型变量 + apiKey + baseUrl）

### Claude's Discretion
- ApiConfigStore 具体实现细节
- replaceEnvModel 函数内部逻辑
- 数据迁移策略（v1.0 templates → v2.0 api-configs）
- maskToken 扩展到 apiKey 的边界情况处理

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements
- `.planning/ROADMAP.md` §Phase 10 — Goal, Success Criteria (5 criteria)
- `.planning/REQUIREMENTS.md` §CFG-01/02/04, §SEC-01/03 — 具体需求定义

### Existing v1.0 Code (to refactor)
- `src/lib/store/template.ts` — TemplateStore 实现（待重构为 ApiConfigStore）
- `src/lib/services/config-service.ts` — ConfigService（待添加 replaceEnvModel）
- `src/lib/types/provider.ts` — TemplateConfig 类型（待重构为 ApiConfig）
- `src/lib/security/token-check.ts` — maskToken 函数（复用）
- `src/lib/types/merge.ts` — deepMergeConfig（保留，不修改）

### Integration Points
- `src/lib/types/config.ts` — ClaudeSettings 类型定义
- `src/lib/services/template-service.ts` — TemplateService（待重构为 ApiService）

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- ConfigRepository: readConfig/writeConfig/configExists（原子写入 + 备份，R1/R2 已实现）
- maskToken: 显示最后4字符，可直接复用
- ClaudeSettings: env/model/mcpServers/permissions/hooks 结构完整
- Clean Architecture: Services/Store/Types 分层清晰

### Established Patterns
- Services 作为类 + 构造函数注入 (D-01 v1.0)
- Store 使用 Zod schema 验证
- Barrel exports for all layers
- 原子写入 + 备份机制

### Integration Points
- TemplateStore → ApiConfigStore 重构点
- ConfigService.mergeTemplateWithConfig → replaceEnvModel 替换点
- TemplateConfig → ApiConfig 类型重构点

</code_context>

<specifics>
## Specific Ideas

- 真实配置示例：
  ```json
  {
    "env": {
      "ANTHROPIC_MODEL": "glm-5.1",
      "ANTHROPIC_DEFAULT_SONNET_MODEL": "glm-5.1",
      "ANTHROPIC_DEFAULT_HAIKU_MODEL": "glm-5.1",
      "ANTHROPIC_DEFAULT_OPUS_MODEL": "glm-5.1",
      "ANTHROPIC_REASONING_MODEL": "glm-5.1",
      "ANTHROPIC_AUTH_TOKEN": "...",
      "ANTHROPIC_BASE_URL": "https://ark.cn-beijing.volces.com/api/coding"
    }
  }
  ```
- unified 模式简化配置为 4 字段：name/apiKey/baseUrl/modelName
- granular 模式支持高级用户完整控制 env 对象

</specifics>

<deferred>
## Deferred Ideas

- Password-type input — Phase 11 (config add CLI 命令)
- CLI config 命令 — Phase 11
- 首次引导流程 — Phase 12
- Ink React TUI 移除 — Phase 15（TemplateService/TemplateStore 已在 Phase 10 重构）

</deferred>

---
*Phase: 10-config-service*
*Context gathered: 2026-04-30*