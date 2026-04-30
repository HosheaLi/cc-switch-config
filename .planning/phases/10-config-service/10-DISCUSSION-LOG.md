# Phase 10: Config Service - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-30
**Phase:** 10-config-service
**Areas discussed:** ApiConfig 数据结构, 存储位置, ApiKey 安全处理, 精确字段替换

---

## ApiConfig 数据结构

| Option | Description | Selected |
|--------|-------------|----------|
| 三元组（推荐） | name/apiKey/baseUrl/modelName，ROADMAP定义的术语 | |
| 扩展字段 | 添加 authType/headers 或 createdAt/updatedAt | |
| 混合：modelName存ClaudeSettings | 添加 modelName 字段到 ClaudeSettings.env | |

**User's choice:** 提供真实配置示例，提出两种模式（统一模型 vs 精细配置）

---

## 配置模式

| Option | Description | Selected |
|--------|-------------|----------|
| 统一模型（推荐） | 简化为3字段，apply时填充6个变量 | |
| 精细配置 | 包含所有6个模型变量 + apiKey + baseUrl | |
| 支持两种模式 | ApiConfig 添加 mode 字段，根据模式不同处理 | ✓ |

**User's choice:** 支持两种模式（unified + granular）

**Notes:** 真实需求：有些用户只需统一模型名，有些需要精细控制每个变量

---

## 数据结构设计

| Option | Description | Selected |
|--------|-------------|----------|
| 模式字段 + modelName（推荐） | name/apiKey/baseUrl/mode/modelName | ✓ |
| 两种模式分开字段 | unifiedModelName OR granularModels对象 | |

**User's choice:** 模式字段 + modelName

---

## Granular 模式字段

| Option | Description | Selected |
|--------|-------------|----------|
| granularModels 对象 | 包含6个模型变量的对象 | |
| 完整 env 对象（推荐） | 直接存储 ClaudeSettings.env 格式 | ✓ |

**User's choice:** 完整 env 对象

---

## Name 唯一性

| Option | Description | Selected |
|--------|-------------|----------|
| 全局唯一（推荐） | 跨项目共享，全局配置库 | ✓ |
| 项目内唯一 | 每个项目独立配置库 | |

**User's choice:** 全局唯一

---

## 默认模式

| Option | Description | Selected |
|--------|-------------|----------|
| unified（推荐） | 简化首次配置 | ✓ |
| granular | 完整控制，适合高级用户 | |

**User's choice:** unified

---

## 存储位置

| Option | Description | Selected |
|--------|-------------|----------|
| 全局配置库（推荐） | ~/.claude/api-configs.json，跨项目共享 | ✓ |
| 项目级配置库 | 每个项目独立存储 | |

**User's choice:** 全局配置库

---

## 文件名

| Option | Description | Selected |
|--------|-------------|----------|
| api-configs.json（推荐） | 新文件，与 templates.json 分离 | ✓ |
| 复用 templates.json | 简化迁移，需改名或重构 | |

**User's choice:** api-configs.json

---

## v1.0 TemplateStore 关系

| Option | Description | Selected |
|--------|-------------|----------|
| 新建 + Phase 15 移除旧 | 过渡期间两者共存 | |
| 立即重构 TemplateStore（推荐） | Phase 10 直接重构，不延后 | ✓ |

**User's choice:** 立即重构 TemplateStore

---

## ApiKey 安全措施

| Option | Description | Selected |
|--------|-------------|----------|
| 所有显示 mask | 扩展 maskToken，所有 list/preview/diff 使用 | |
| CLI password-type input | prompts password 类型，auto-clear | |
| 禁止 CLI args 传递（推荐） | 避免 shell history 泄漏 | ✓ |

**User's choice:** 禁止 CLI args 传递

---

## Mask 处理

| Option | Description | Selected |
|--------|-------------|----------|
| 复用 maskToken（推荐） | 显示最后4字符，简单一致 | ✓ |
| 新建 maskApiKey | 可能不同策略 | |

**User's choice:** 复用 maskToken

---

## Password-type input 时机

| Option | Description | Selected |
|--------|-------------|----------|
| Phase 11 实现（推荐） | config add CLI 命令时添加 | ✓ |
| 延后 Phase 11 | Phase 10 先不实现 | |

**User's choice:** Phase 11 实现

---

## 精确字段替换实现

| Option | Description | Selected |
|--------|-------------|----------|
| 新建 replaceEnvModel 函数（推荐） | 只替换 env/model，不修改 deepMergeConfig | ✓ |
| 改造 deepMergeConfig | 添加字段过滤逻辑 | |

**User's choice:** 新建 replaceEnvModel 函数

---

## Env 处理策略

| Option | Description | Selected |
|--------|-------------|----------|
| 完全替换 env/model（推荐） | 不保留旧值，简单明确 | ✓ |
| env 深度合并 | 保留非 API 相关变量 | |

**User's choice:** 完全替换 env/model

---

## Unified 模式 env 生成

| Option | Description | Selected |
|--------|-------------|----------|
| 生成标准 env（推荐） | 6个模型变量 + apiKey + baseUrl | ✓ |
| 最小 env | 只设置 ANTHROPIC_MODEL + apiKey + baseUrl | |

**User's choice:** 生成标准 env

---

## Claude's Discretion

- ApiConfigStore 具体实现细节
- replaceEnvModel 函数内部逻辑
- 数据迁移策略（v1.0 templates → v2.0 api-configs）
- maskToken 扩展边界情况

---

*Discussion log for Phase 10*
*Generated: 2026-04-30*