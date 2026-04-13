# Phase 3: Data Layer - Context

**Gathered:** 2026-04-13
**Status:** Ready for planning

<domain>
## Phase Boundary

实现数据持久化层，建立 Repository 模式。

此 phase 不添加用户可见功能，而是为后续 phases 建立数据基础设施：
- ConfigRepository（配置 CRUD + 层级合并）
- TemplateStore（模板存储管理）
- ProjectIndex（项目索引管理）
- FileWatcher（文件监听 + 全局同步提示）
- 状态管理框架（conf 包集成）

**Scope anchor:** 所有数据持久化逻辑在此 phase 定义，后续 phases 通过 Repository API 访问数据。

</domain>

<decisions>
## Implementation Decisions

### Repository 模式
- **D-01:** 直接封装现有函数 — 无需抽象 Repository 接口层
  - **Why:** 现有 json.ts/backup.ts 已提供完整 CRUD，封装增加复杂度但收益有限
  - **How:** 在 src/lib/store/ 目录创建封装函数，直接调用 json.ts + 验证 + backup

### 数据存储位置
- **D-02:** 分开存储 — templates.json 存 config dir, projects.json 存 data dir
  - **Why:** 符合 XDG 规范语义（config = 配置数据，data = 运行时数据）
  - **How:** templates.json → getConfigDir()/templates.json, projects.json → getDataDir()/projects.json

### File Watcher
- **D-03:** 监听全局 + 项目配置 — 全局变化时提示用户选择是否同步
  - **Why:** 用户可能有全局偏好需要同步到项目，提供交互选择更灵活
  - **How:** chokidar 监听 ~/.claude/settings.json 和所有已注册项目的 .claude/settings.json

- **D-04:** TUI 弹窗提示 — 全局配置变化时弹出确认框
  - **Why:** 重要变更需要用户明确确认，避免意外覆盖项目配置
  - **How:** watcher 回调触发 TUI 状态更新，显示同步/忽略选项

### 状态管理
- **D-05:** 使用 conf 包 — 管理持久化状态（当前激活项目、UI 状态）
  - **Why:** conf 自动处理 XDG 路径和 JSON 存储，API 简洁
  - **How:** npm install conf, 在 src/lib/store/state.ts 创建 AppState 类

### 数据结构
- **D-06:** 完整模板定义 — templates.json 包含完整配置字段
  - **Why:** 模板应包含所有可覆盖字段，应用时直接 merge
  - **How:** `{ templates: [{ id, name, provider, model, envOverrides, mcpServers }] }`

- **D-07:** 完整项目索引 — projects.json 记录路径、激活配置、修改时间
  - **Why:** 状态查询需要完整信息（路径、当前配置、更新时间）
  - **How:** `{ projects: [{ id, path, activeConfig, lastModified }] }`

### Claude's Discretion
- Repository 函数命名风格（readConfig/writeConfig vs configRead/configWrite）
- Template ID 生成策略（UUID vs 自增 vs 用户定义名称）
- Project ID 生成策略（UUID vs 路径 hash）
- chokidar 监听 debounce 时间
- conf 包存储的具体状态字段

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Claude Code Configuration
- `.planning/PROJECT.md` §Context — 配置层级说明（user/project/local 优先级）
- `.planning/REQUIREMENTS.md` §Constraints — 配置格式必须是 JSON

### Prior Phase Decisions
- `.planning/STATE.md` — Decisions from Phase 01 & 02（atomic writes, Zod schema, deep merge）
- `.planning/phases/02-types-validation/02-CONTEXT.md` — 类型系统和验证框架决策

### Existing Code
- `src/lib/file-system/json.ts` — readJSON/writeJSON 基础 CRUD
- `src/lib/file-system/backup.ts` — createBackup/restoreBackup 备份系统
- `src/lib/types/config.ts` — ClaudeSettingsSchema 完整 schema
- `src/lib/types/merge.ts` — deepMergeConfig 合并算法
- `src/lib/types/validation.ts` — ValidationError 验证错误类
- `src/lib/paths/xdg.ts` — getConfigDir/getDataDir 跨平台路径

### Recommended Libraries (ROADMAP)
- chokidar — File watching
- conf — Global state management

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/lib/file-system/json.ts`: readJSON/writeJSON/exists — Repository 的基础 CRUD
- `src/lib/file-system/backup.ts`: createBackup/restoreBackup/listBackups — 配置修改前自动备份
- `src/lib/types/config.ts`: ClaudeSettingsSchema — 验证配置数据
- `src/lib/types/merge.ts`: deepMergeConfig/mergeConfigLayers — 三层配置合并
- `src/lib/types/validation.ts`: validateConfig/ValidationError — 加载时验证
- `src/lib/paths/xdg.ts`: getConfigDir/getDataDir — 数据存储路径

### Established Patterns
- ESM module system (type: module, NodeNext resolution)
- Atomic write pattern (temp file + rename)
- Backup before modification
- Zod schema validation
- TDD workflow — 每个模块应有对应测试

### Integration Points
- `src/lib/store/`: 新目录存放 Repository 和 Store 实现
- `src/lib/store/config.ts`: ConfigRepository 封装
- `src/lib/store/template.ts`: TemplateStore 实现
- `src/lib/store/project.ts`: ProjectIndex 实现
- `src/lib/store/watcher.ts`: FileWatcher (chokidar) 实现
- `src/lib/store/state.ts`: AppState (conf) 实现

</code_context>

<specifics>
## Specific Ideas

- Repository 封装应调用 backup.ts 的 createBackup 在每次 write 前
- Template 应用时使用 deepMergeConfig 与现有配置合并
- ProjectIndex 支持按路径查找（getByPath 方法）
- Watcher 回调应 debounce 避免频繁触发
- 全局配置变化同步提示只在 TUI 运行时弹出（CLI 模式静默）

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 03-data-layer*
*Context gathered: 2026-04-13*