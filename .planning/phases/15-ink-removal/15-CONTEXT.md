# Phase 15: Ink Removal - Context

**Gathered:** 2026-05-08
**Status:** Ready for planning

<domain>
## Phase Boundary

完全移除 Ink React TUI 层及其依赖，执行 Template* → ApiConfig 全面迁移，清理残留 chalk 引用。代码库不再包含 React/Ink 依赖，bundle 体积减小，所有交互通过 prompts 层完成。

**In scope:**
- 删除 src/tui/ 全部 32 个文件
- 删除 ink/react 相关 9 个 npm 包
- TemplateConfig/TemplateService/TemplateStore → ApiConfig/ApiService/ApiConfigStore 迁移
- tui-launch.ts 重构重命名
- prompts 层 chalk → picocolors 主题模块迁移
- 迁移路径补充集成测试

**Out of scope:**
- 新功能添加（fuzzy search 改进、新命令等）
- UI/UX 行为变更（交互流程保持不变）
- v3 延后功能（MCP 管理、API 连接验证等）

</domain>

<decisions>
## Implementation Decisions

### Template* → ApiConfig 迁移
- **D-01:** 严格按 CFG-06 执行——删除 TemplateConfig/TemplateService/TemplateStore，全部迁移到 ApiConfig/ApiService/ApiConfigStore
- **D-02:** template 命令改为操作 ApiConfig（cc-config template add/list/remove → cc-config config add/list/remove 已有，template 命令可废弃或重定向）
- **D-03:** export/import 功能适配 ApiConfig 数据结构
- **D-04:** 3 个 wizard（config-wizard, main-wizard, switch-wizard）从 TemplateService 迁移到 ApiService
- **D-05:** ConfigService.applyTemplate() 改为 applyApiConfig()（已有此方法，移除 applyTemplate）
- **D-06:** 数据迁移方案：templates.json → api-configs.json，提供一次性迁移脚本或在首次运行时自动迁移

### tui-launch.ts 重构
- **D-07:** 删除 launchInkTUI() 函数和 `import { runTUI }` 语句
- **D-08:** 文件重命名为 cli-launch.ts（不再有 TUI 概念）
- **D-09:** 保留 launchTUI()（委托给 launchPromptsTUI）、selectTemplateInTUI()（迁移后改名为 selectConfigInCLI）、launchScanTUI() 作为纯 CLI 辅助函数
- **D-10:** 更新所有导入 tui-launch 的文件（cli/index.ts, commands/scan.ts, utils/index.ts）

### 依赖清理
- **D-11:** 删除 9 个 npm 包：ink, ink-confirm-input, ink-select-input, ink-spinner, ink-text-input, react, @testing-library/react, @types/react, ink-testing-library
- **D-12:** 保留 fuse.js（prompts/autocomplete 可能使用）
- **D-13:** prompts 层 chalk 引用迁移到 picocolors 主题模块（src/cli/prompts/utils/theme.ts → 使用 src/lib/theme/ 模块）
- **D-14:** tui-launch.ts（重命名后 cli-launch.ts）中 chalk 引用一并迁移到 picocolors 主题模块

### 测试策略
- **D-15:** 删除 src/tui/ 全部 32 个测试文件（约 2000+ 行），不回溯式补充
- **D-16:** 聚焦 Template* → ApiConfig 迁移的关键路径补充集成测试
- **D-17:** 确保现有 lib 层和 prompts 层测试在迁移后继续通过

### Claude's Discretion
- 迁移脚本的具体实现（自动迁移 vs 手动迁移 vs 首次运行检测）
- template 命令废弃策略（直接删除 vs 重定向到 config 命令 vs 保留为 alias）
- cli-launch.ts 中函数的具体命名
- 迁移测试的具体用例设计

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements
- `.planning/REQUIREMENTS.md` §CFG-06 — TemplateConfig/TemplateService/TemplateStore removed and replaced
- `.planning/REQUIREMENTS.md` §TUI-06 — Ink React TUI layer completely removed
- `.planning/ROADMAP.md` §Phase 15 — Goal, Success Criteria, Requirements mapping

### Existing ApiConfig implementation
- `src/lib/types/api-config.ts` — ApiConfig schema, ApiConfigMode, MaskedApiConfig
- `src/lib/store/api-config.ts` — ApiConfigStore CRUD
- `src/lib/services/api-service.ts` — ApiService business logic
- `src/lib/services/config-service.ts` — applyApiConfig method (already exists)

### Existing Template implementation (to be removed/migrated)
- `src/lib/types/provider.ts` — TemplateConfigSchema, TemplateStoreSchema, TemplateStore type
- `src/lib/store/template.ts` — TemplateStore class
- `src/lib/services/template-service.ts` — TemplateService class
- `src/lib/services/export-service.ts` — uses TemplateStore

### Prompts layer (keep, adapt for ApiConfig)
- `src/cli/prompts/` — 18 files, wizards need TemplateService → ApiService migration
- `src/cli/prompts/utils/theme.ts` — chalk references to migrate to picocolors

### Bridge file
- `src/cli/utils/tui-launch.ts` — sole import of src/tui/, needs refactor+rename

### Theme module (target for chalk migration)
- `src/lib/theme/` — picocolors-based theme module (Phase 14 deliverable)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/lib/types/api-config.ts` + `src/lib/store/api-config.ts` + `src/lib/services/api-service.ts`: 完整的 ApiConfig CRUD 链路，可直接替代 Template*
- `src/lib/services/config-service.ts:applyApiConfig()`: 已有精确字段替换方法，可直接使用
- `src/lib/theme/`: picocolors 主题模块，prompts 层 chalk 引用的迁移目标
- `src/cli/prompts/`: 完整的 prompts 交互层，无需替换仅需适配

### Established Patterns
- Clean Architecture: CLI → Services → Repositories (M4 enforced)
- Zod schema validation with strict mode
- Constructor DI for services
- Barrel exports for all layers
- TDD with vitest

### Integration Points
- `src/cli/index.ts` — imports launchTUI + launchPromptsTUI (line 10-11)
- `src/cli/commands/template.ts` — TemplateService + TemplateStore (primary migration target)
- `src/cli/commands/export.ts` — TemplateStore (export needs ApiConfig adapter)
- `src/cli/commands/import.ts` — TemplateStore (import needs ApiConfig adapter)
- `src/cli/commands/scan.ts` — launchScanTUI from tui-launch.ts
- `src/cli/prompts/wizards/` — 3 wizards use TemplateService (main, config, switch)
- `src/lib/services/export-service.ts` — TemplateStore dependency

</code_context>

<specifics>
## Specific Ideas

- ROADMAP 成功标准要求 "No React dependencies remain" 和 "Bundle size reduced"——迁移完成后应验证 package.json 和构建产物
- 删除 src/tui/ 是原子操作（32 个文件全部删除），但 Template* 迁移需逐步替换避免破坏
- 数据迁移（templates.json → api-configs.json）需要向后兼容方案

</specifics>

<deferred>
## Deferred Ideas

- Fuzzy search 改进 (FUZZ-01) — v3
- template 命令的最终去留决策——Claude discretion，但重定向到 config 是合理默认

</deferred>

---
*Phase: 15-ink-removal*
*Context gathered: 2026-05-08*
