# Phase 4: Services Layer - Context

**Gathered:** 2026-04-13
**Status:** Ready for planning

<domain>
## Phase Boundary

实现业务逻辑层，封装所有核心操作逻辑。

此 phase 在 Data Layer (Phase 03) 基础上构建 Services 层：
- **ConfigService**: 配置读写、三层合并、验证、应用
- **ProjectService**: 项目索引、目录扫描、CRUD、状态查询
- **TemplateService**: 模板 CRUD、应用到项目配置
- **ProviderService**: Provider 默认值、连通性测试

**Scope anchor:** Services 封装业务逻辑，CLI/TUI 调用 Services 而不直接操作 Repositories。Services 依赖 Repositories 但不依赖 UI。

</domain>

<decisions>
## Implementation Decisions

### 服务架构
- **D-01:** Services 作为类实现 + 构造函数注入 Repository 依赖
  - **Why:** 便于测试 mock Repositories，解耦清晰，符合依赖注入原则
  - **How:** 每个 Service 类接收 Repository 实例作为构造函数参数

### 错误处理
- **D-02:** Services 抛出 Error，调用方 try/catch 处理
  - **Why:** 简单直接，Node.js 标准模式，与 Phase 01 的 JSONParseError 保持一致
  - **How:** Service 失败时抛出 Error（可自定义 ServiceError 类型），调用方捕获

### 模板应用
- **D-03:** 模板与现有配置 deep merge，保留非覆盖字段
  - **Why:** 用户可保留自定义配置（如特定的 MCP servers），模板只覆盖定义的字段
  - **How:** 使用 Phase 02 的 `deepMergeConfig`，模板字段覆盖，未定义字段保留

### 项目检测
- **D-04:** 自动扫描用户配置的根目录 + 手动确认注册
  - **Why:** 减少手动操作，同时避免意外注册不想管理的项目
  - **How:** 扫描用户配置的根目录列表，发现含 `.claude/` 的目录，弹出确认列表

### 扫描目录来源
- **D-05:** 用户配置根目录列表（存储于 AppState 或单独配置）
  - **Why:** 灵活可控，用户明确指定扫描范围
  - **How:** AppState 新增 `scanDirectories: string[]` 字段，用户可添加/移除

### Provider 连通性测试
- **D-06:** 基础连通性测试 — HEAD / 或 health endpoint
  - **Why:** 快速验证 endpoint 可达，无需有效 token
  - **How:** 发送 HEAD 请求到 baseUrl，检查响应状态码

### Barrel Export
- **D-07:** 统一从 `src/lib/services/index.ts` 导出所有 Services
  - **Why:** 与 store 模块一致，简化导入路径
  - **How:** 创建 index.ts 导出所有 Service 类和类型

### Claude's Discretion
- Service 类方法命名风格（camelCase）
- 具体方法签名细节（返回类型、参数命名）
- Scan 目录默认值（空数组 vs ~/.claude/projects）
- Provider 测试超时时间
- 扫描并发数和性能优化策略

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Prior Phase Decisions
- `.planning/phases/02-types-validation/02-CONTEXT.md` — 类型系统、验证、merge 算法
- `.planning/phases/03-data-layer/03-CONTEXT.md` — Repository 模式、数据存储

### Requirements
- `.planning/REQUIREMENTS.md` §F1 — Profile CRUD Operations
- `.planning/REQUIREMENTS.md` §F4 — List All Projects
- `.planning/REQUIREMENTS.md` §F7 — Custom Provider Templates
- `.planning/REQUIREMENTS.md` §M4 — Module Separation

### Existing Code (Data Layer)
- `src/lib/store/config.ts` — ConfigRepository (readConfig/writeConfig/configExists)
- `src/lib/store/template.ts` — TemplateStore (getAll/get/set/delete/list)
- `src/lib/store/project.ts` — ProjectIndex (register/getByPath/getById/update/remove)
- `src/lib/store/state.ts` — AppState (conf package)

### Existing Code (Types)
- `src/lib/types/config.ts` — ClaudeSettingsSchema, ClaudeSettings type
- `src/lib/types/merge.ts` — deepMergeConfig, mergeConfigLayers
- `src/lib/types/validation.ts` — validateConfig, ValidationError
- `src/lib/types/provider.ts` — ApiProviderConfigSchema, TemplateConfigSchema

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/lib/store/config.ts`: ConfigRepository — ConfigService 依赖此进行配置读写
- `src/lib/store/template.ts`: TemplateStore — TemplateService 依赖此进行模板 CRUD
- `src/lib/store/project.ts`: ProjectIndex — ProjectService 依赖此进行项目索引
- `src/lib/store/state.ts`: AppState — 存储 scanDirectories 用户配置
- `src/lib/types/merge.ts`: deepMergeConfig — 模板应用时调用此函数
- `src/lib/types/validation.ts`: validateConfig — 配置验证复用

### Established Patterns
- 类 + 构造函数注入 (Phase 04 D-01)
- 抛出 Error 错误处理 (Phase 04 D-02)
- Barrel export (Phase 02/03 D-08)
- ESM .js extension imports (Phase 02)
- TDD workflow — 每个 Service 应有对应测试

### Integration Points
- `src/lib/services/`: 新目录存放所有 Service 实现
- `src/lib/services/config-service.ts`: ConfigService
- `src/lib/services/project-service.ts`: ProjectService
- `src/lib/services/template-service.ts`: TemplateService
- `src/lib/services/provider-service.ts`: ProviderService
- `src/lib/services/index.ts`: Barrel export

</code_context>

<specifics>
## Specific Ideas

- ConfigService 提供 `applyConfig(projectPath, template)` 方法，调用 TemplateStore + deepMerge + ConfigRepository
- ProjectService 提供 `scanProjects(rootDir)` 方法，递归查找含 `.claude/` 的目录
- ProviderService 提供 `testConnectivity(baseUrl)` 方法，HEAD 请求验证可达性
- AppState 扩展 `scanDirectories` 字段存储用户配置的扫描根目录
- Services 构造函数接收 Repository 实例，便于 CLI 测试时注入 mock

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 04-services-layer*
*Context gathered: 2026-04-13*
