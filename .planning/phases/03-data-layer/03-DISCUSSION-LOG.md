# Phase 3: Data Layer - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-13
**Phase:** 03-data-layer
**Areas discussed:** Repository 模式设计, 数据存储位置, File Watcher 实现, 状态管理方案, 数据结构

---

## Repository 模式设计

| Option | Description | Selected |
|--------|-------------|----------|
| 直接封装 | 直接封装 json.ts/backup.ts 的函数，无需抽象层。简单直接，快速实现。 | ✓ |
| 抽象 Repository 接口 | 定义 Repository 接口（CRUD methods），ConfigRepository、TemplateStore 分别实现。便于测试 mock，扩展性好。 | |
| 分层封装 | json.ts 提供 read/write/exists，Repository 添加 backup 和验证逻辑，混合方案。 | |

**User's choice:** 直接封装 (Recommended)
**Notes:** 现有基础设施已完善，抽象层增加复杂度但收益有限

---

## 数据存储位置

| Option | Description | Selected |
|--------|-------------|----------|
| 分开存储 | templates.json 存 XDG config dir，项目索引存 data dir。config dir 用于配置，data dir 用于数据。 | ✓ |
| 统一存 config dir | 所有数据（templates、projects、state）存 XDG config dir，便于用户查找和备份。 | |
| 项目级 + 全局级 | templates 存项目目录 .claude/templates.json（项目级模板），全局模板存 XDG config dir。 | |

**User's choice:** 分开存储 (Recommended)
**Notes:** 符合 XDG 规范语义，config dir = 配置数据，data dir = 运行时数据

---

## File Watcher 实现

| Option | Description | Selected |
|--------|-------------|----------|
| 监听项目配置 | 监听项目目录 .claude/settings.json 和 settings.local.json，变化时触发回调更新状态。只监听已注册项目的配置文件。 | |
| 全局 + 项目配置 | 同时监听全局 settings.json (~/.claude/) 和所有项目配置。全局变化也会触发更新。 | ✓ |
| 延后到 Phase 06 | Phase 03 不实现 watcher，Phase 06 TUI 开发时再添加。减少当前复杂度。 | |

**User's choice:** 全局 + 项目配置
**Notes:** 监听全局与项目配置，如果全局配置变化则提示由用户选择是否同步到项目

---

## Watcher 交互方式

| Option | Description | Selected |
|--------|-------------|----------|
| TUI 弹窗提示 | 全局配置变化时，在 TUI 中显示提示，用户选择同步/忽略。同步则更新当前项目配置。 | ✓ |
| CLI 消息通知 | 全局配置变化时，CLI 输出警告消息，用户手动运行同步命令。不自动干预。 | |
| 静默回调 | 全局配置变化时，触发回调但不弹出 UI。回调中记录变化，后续操作时检查。 | |

**User's choice:** TUI 弹窗提示
**Notes:** 重要变更需要用户明确确认，避免意外覆盖项目配置

---

## 状态管理方案

| Option | Description | Selected |
|--------|-------------|----------|
| conf 包 | conf 包自动管理 XDG 路径和 JSON 存储，简化状态管理。提供 get/set/has/delete API，自动持久化。 | ✓ |
| 自定义实现 | 使用现有 json.ts + XDG paths 自定义状态管理。完全控制实现细节，无额外依赖。 | |
| 无持久化状态 | 不引入持久化状态，当前项目路径通过 CLI 参数或环境变量获取。Phase 06 TUI 时再考虑。 | |

**User's choice:** conf 包 (Recommended)
**Notes:** conf 自动处理 XDG 路径和 JSON 存储，API 简洁

---

## Template Store 数据结构

| Option | Description | Selected |
|--------|-------------|----------|
| 完整模板定义 | { templates: [{ id, name, provider, model, envOverrides, mcpServers }] } - 完整模板定义，包含所有配置字段 | ✓ |
| 预设 + 覆盖结构 | { templates: [{ id, name, preset, overrides }] } - 简化结构，preset 为基础配置，overrides 为自定义覆盖 | |
| 复用 ClaudeSettings 结构 | { templates: [{ id, name, env, model, ... }] } - 与 ClaudeSettings 相同结构，直接复用现有类型 | |

**User's choice:** 完整模板定义
**Notes:** 模板应包含所有可覆盖字段，应用时直接 merge

---

## Project Index 数据结构

| Option | Description | Selected |
|--------|-------------|----------|
| 完整索引 | { projects: [{ id, path, activeConfig, lastModified }] } - 记录项目路径、激活配置名、最后修改时间 | ✓ |
| 路径为 key 的映射 | { projects: { [path]: { activeConfig, lastModified } } } - 以项目路径为 key，简化查找 | |
| 记录配置路径 | { projects: [{ id, path, settingsPath, localSettingsPath }] } - 记录具体配置文件路径，便于读取 | |

**User's choice:** 完整索引
**Notes:** 状态查询需要完整信息（路径、当前配置、更新时间）

---

## Claude's Discretion

- Repository 函数命名风格
- Template ID 生成策略
- Project ID 生成策略
- chokidar 监听 debounce 时间
- conf 包存储的具体状态字段

---

## Deferred Ideas

None — discussion stayed within phase scope.