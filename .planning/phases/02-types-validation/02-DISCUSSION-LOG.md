# Phase 2: Types & Validation - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-13
**Phase:** 02-types-validation
**Areas discussed:** 类型策略, Schema 范围, 验证时机, Merge 算法, 错误策略, JSON Schema 导出, 配置层级, 模块组织, API 类型

---

## 类型策略

| Option | Description | Selected |
|--------|-------------|----------|
| Zod-first（推荐） | 减少重复定义，类型从 schema 自动推断。Zod 官方推荐模式 | ✓ |
| TypeScript-first | 手动定义 TS 接口，Zod schema 从类型推断 | |
| 分离定义 | 两者独立维护，增加维护成本 | |

**User's choice:** Zod-first（推荐）
**Notes:** 全部选择推荐选项

---

## Schema 覆盖范围

| Option | Description | Selected |
|--------|-------------|----------|
| 完整 schema（推荐） | 全面覆盖所有配置字段，确保完整性验证 | ✓ |
| 核心字段 schema | 只验证核心字段（version, api, model），其他允许扩展 | |
| 分层 schema | 对不同配置文件提供不同 schema 强度 | |

**User's choice:** 完整 schema（推荐)
**Notes:** 全面覆盖确保完整性

---

## 配置验证时机

| Option | Description | Selected |
|--------|-------------|----------|
| 加载时验证（推荐） | 加载时立即验证，拒绝无效配置。安全性最高 | ✓ |
| 保存前验证 | 加载宽松，保存前验证 | |
| 加载宽松+保存严格 | 加载时宽松读取，保存前严格验证 | |

**User's choice:** 加载时验证（推荐)
**Notes:** 安全性优先

---

## 配置合并策略

| Option | Description | Selected |
|--------|-------------|----------|
| Deep merge（推荐） | 深层合并嵌套对象（mcpServers, permissions），适合配置继承 | ✓ |
| Shallow merge | 顶层字段整体替换 | |
| 分层策略 | 不同配置层级使用不同策略 | |

**User's choice:** Deep merge（推荐)
**Notes:** 嵌套对象逐层合并，保留各层级配置

---

## 验证错误收集策略

| Option | Description | Selected |
|--------|-------------|----------|
| 收集全部错误（推荐） | 返回全部验证错误，用户一次性修复所有问题 | ✓ |
| 快速失败 | 遇到首个错误立即停止 | |

**User's choice:** 收集全部错误（推荐)
**Notes:** 减少用户多次迭代

---

## JSON Schema 导出

| Option | Description | Selected |
|--------|-------------|----------|
| 导出 JSON Schema | 导出标准 JSON Schema 格式，可用于外部工具 | |
| 不导出 | 仅在代码中使用 Zod schema | ✓ |

**User's choice:** 不导出
**Notes:** 当前无外部工具需求，保持简洁

---

## 配置优先级层级

| Option | Description | Selected |
|--------|-------------|----------|
| 三层优先级 | user < project < local。符合 Claude Code 级联语义 | ✓ |
| 两层优先级 | 简化为两层，降低复杂度 | |

**User's choice:** 三层优先级
**Notes:** 完整配置继承支持

---

## 类型模块组织

| Option | Description | Selected |
|--------|-------------|----------|
| 集中模块（推荐） | src/lib/types/ 目录，index.ts 导出所有类型 | ✓ |
| 分散模块 | 类型分散到各功能模块就近定义 | |

**User's choice:** 集中模块（推荐)
**Notes:** 集中便于查找和维护

---

## API Provider 类型详细程度

| Option | Description | Selected |
|--------|-------------|----------|
| 详细 API 类型 | 包含 API types（名称、baseUrl、认证方式），供应商模板依赖 | ✓ |
| 最小 API 类型 | 简化为 apiProvider 字段字符串 | |

**User's choice:** 详细 API 类型
**Notes:** 供应商模板功能需要完整 API 配置结构

---

## Claude's Discretion

- 类型命名风格：遵循 TypeScript 惯例（camelCase for properties, PascalCase for types）
- Schema 细粒度拆分：按配置域拆分（base schema + feature schemas）
- 默认值位置：可在 schema 内 `.default()` 或 DEFAULT_CONFIG 常量

---

## Deferred Ideas

None — discussion stayed within phase scope.

---

*Discussion log for: Phase 02-types-validation*
*Date: 2026-04-13*