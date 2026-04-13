# Phase 2: Types & Validation - Context

**Gathered:** 2026-04-13
**Status:** Ready for planning

<domain>
## Phase Boundary

定义类型系统和验证框架，建立配置管理的单一数据源（Single Source of Truth）。

此 phase 不添加新功能，而是为后续 phases 建立类型基础设施：
- TypeScript 类型定义（从 Zod schema 推断）
- Zod schemas 验证框架
- 配置 merge 算法
- 默认配置和常量定义

**Scope anchor:** 所有 Claude Code 配置相关类型在此 phase 定义一次，后续 phases 直接复用。

</domain>

<decisions>
## Implementation Decisions

### 类型策略
- **D-01:** Zod schema 作为单一数据源 — TypeScript 类型从 Zod schema 推断（`z.infer<>`）
  - **Why:** 减少重复定义，类型自动保持同步，Zod 官方推荐模式
  - **How:** 所有类型定义在 Zod schema 中，TypeScript 接口通过 `type X = z.infer<typeof XSchema>` 推断

### Schema 覆盖
- **D-02:** 完整 Claude Code 配置 schema — 覆盖所有配置字段
  - **Why:** 确保完整性验证，防止无效字段进入配置
  - **How:** 定义完整的 settings.json schema，包括 env, model, mcpServers, permissions, hooks

### 验证时机
- **D-03:** 加载时验证 — readJSON 后立即执行 schema 验证
  - **Why:** 安全性最高，拒绝无效配置进入系统
  - **How:** 配置加载流程：readJSON → parse → validate → 返回有效配置或抛出 ValidationError

### Merge 算法
- **D-04:** Deep merge 深层合并 — 嵌套对象（mcpServers, permissions）逐层合并
  - **Why:** 适合配置继承场景，保留各层级的嵌套配置
  - **How:** 实现深度合并算法，处理数组和对象的合并策略

### 错误收集
- **D-05:** 收集全部验证错误 — 返回完整错误列表
  - **Why:** 用户可一次性修复所有问题，减少多次迭代
  - **How:** Zod's `.safeParse()` 返回所有错误，格式化成用户友好消息

### 配置层级
- **D-06:** 三层优先级 — user < project < local
  - **Why:** 符合 Claude Code 级联语义，完整配置继承支持
  - **How:** 定义 ConfigLayer 类型，merge 时按优先级顺序合并

### JSON Schema 导出
- **D-07:** 不导出 JSON Schema — 仅在代码中使用 Zod schema
  - **Why:** 当前无外部工具需求，保持简洁
  - **How:** 如果未来需要，可通过 `zod-to-json-schema` 导出

### 模块组织
- **D-08:** 集中模块 — `src/lib/types/` 目录统一管理所有类型
  - **Why:** 类型定义集中，便于查找和维护
  - **How:** `src/lib/types/index.ts` 导出所有类型，每个主要类型单独文件

### API Provider 类型
- **D-09:** 详细 API 类型 — 包含名称、baseUrl、认证方式
  - **Why:** 供应商模板功能需要完整 API 配置结构
  - **How:** 定义 ApiProviderConfig schema（name, baseUrl, authType, headers）

### Claude's Discretion
- 具体类型命名风格（camelCase/PascalCase）— 遵循 TypeScript 惯例
- Schema 细粒度拆分策略 — 按配置域拆分（base schema + 各 feature schema）
- 默认值定义位置 — 可在 schema 内或 DEFAULT_CONFIG 常量

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Claude Code Configuration
- `.planning/PROJECT.md` §Context — 配置层级说明（user/project/local 优先级）
- `.planning/REQUIREMENTS.md` §Constraints — 配置格式必须是 JSON

### Prior Phase Decisions
- `.planning/STATE.md` — Decisions from Phase 01（TypeScript 6.x, ESM-only, Zod v4.3.6 已安装）
- `.planning/phases/01-foundation-safety/01-01-SUMMARY.md` — 项目结构和技术栈
- `.planning/phases/01-foundation-safety/01-07-SUMMARY.md` — Token 安全设计（settings.local.json）

### Existing Code
- `src/lib/config/version.ts` — CONFIG_VERSION 和 DEFAULT_CONFIG 基础结构
- `src/lib/file-system/json.ts` — JSON 读写操作（已有泛型 `readJSON<T>`）

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/lib/config/version.ts`: CONFIG_VERSION = 1, DEFAULT_CONFIG 骨架 — 可扩展添加类型字段
- `src/lib/file-system/json.ts`: readJSON/writeJSON/JSONParseError — 验证将在 readJSON 后调用
- `src/lib/security/token-check.ts`: isTokenFile/settings.local.json 常量 — 可引用 token 文件定义
- Zod v4.3.6: 已作为依赖安装 — 无需额外安装

### Established Patterns
- ESM module system (type: module, NodeNext resolution)
- Type inference pattern (readJSON<T> 泛型) — 验证后返回推断类型
- JSDoc comments for public APIs — 类型定义文件应包含文档注释
- TDD workflow — 每个 schema 应有对应测试

### Integration Points
- `src/lib/file-system/json.ts`: 验证函数将在此处集成（或创建独立 validate.ts）
- `src/lib/config/version.ts`: DEFAULT_CONFIG 将扩展为完整配置结构
- `src/index.ts`: 最终导出类型供外部使用

</code_context>

<specifics>
## Specific Ideas

- Zod 4.x 使用新 API（`z.object().strict()` 而非 `.noUnknown()`）
- 配置 merge 时，数组字段使用替换策略而非合并
- ValidationError 应继承 Error 并包含 errors 数组
- 类型定义使用 barrel export（index.ts 导出所有）

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 02-types-validation*
*Context gathered: 2026-04-13*