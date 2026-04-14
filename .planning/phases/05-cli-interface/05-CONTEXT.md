# Phase 5: CLI Interface - Context

**Gathered:** 2026-04-14
**Status:** Ready for planning

<domain>
## Phase Boundary

实现 CLI 入口和命令路由，提供快速操作入口和帮助文档。

此 phase 在 Services Layer (Phase 04) 基础上构建 CLI 界面：
- **CLI Entry Point**: commander 设置、shebang、bin 入口
- **Core Commands**: list, switch, current, template
- **Help Documentation**: 自动生成 --help、命令参考
- **Error Handling**: stderr 输出、exit code、友好消息
- **TUI Integration**: 无参数默认启动 TUI

**Scope anchor:** CLI 提供快速操作入口，TUI 提供交互式管理。CLI 调用 Services 而不直接操作 Repositories。

</domain>

<decisions>
## Implementation Decisions

### 命令结构设计
- **D-01:** 混合风格 — 短选项 + 明确子命令
  - **Why:** 兼顾快速操作和清晰语义，如 `-l` 快捷 + `list` 明确
  - **How:** commander 注册别名，如 `.command('list').alias('ls')`

### TUI 触发策略
- **D-02:** 智能模式 — 无参数启动 TUI，--help 显示帮助
  - **Why:** 符合用户直觉（直接运行进交互界面），同时保留标准 CLI 帮助
  - **How:** 检测参数数量，无参数调用 TUI 入口

### 错误呈现方式
- **D-03:** 混合模式 — stderr + exit code + 颜色友好提示
  - **Why:** 脚本可解析 exit code，用户看到友好消息
  - **How:** 使用 chalk 添加颜色，console.error 输出，process.exit(code)

### 核心命令集
- **D-04:** Phase 5 实现 4 个核心命令
  - `list` (ls): 显示项目列表及配置状态
  - `switch` (sw): 切换配置模板
  - `current` (cur): 显示当前激活配置
  - `template` (tpl): 模板管理 CRUD

### 输出格式
- **D-05:** 彩色表格输出
  - **Why:** 信息密度高，美观可读，chalk 支持颜色
  - **How:** 使用 cli-table3 或自定义格式化函数

### switch 参数设计
- **D-06:** 可选参数 + TUI fallback
  - **Why:** 有模板名快速切换，无模板名进 TUI 选择
  - **How:** 参数可选，检测缺失时调用 TUI 选择界面

### template 子命令设计
- **D-07:** 混合风格 — tpl list/create/delete + -l/-c/-d 别名
  - **Why:** 与主命令风格一致，子命令清晰 + 快捷选项
  - **How:** commander 子命令 + 别名注册

### 代码结构
- **D-08:** src/cli/ 目录组织
  - **Why:** CLI 代码独立于 Services 和 Types，便于维护
  - **How:** `src/cli/index.ts` 入口 + `src/cli/commands/*.ts` 各命令实现

### Claude's Discretion
- 具体命令别名命名 (ls vs l, sw vs s)
- 影响表格显示的具体列和字段
- 命令文件拆分粒度
- commander version 显示策略
- 是否添加 --json 输出选项

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Prior Phase Decisions
- `.planning/phases/04-services-layer/04-CONTEXT.md` — Services 层架构、依赖注入模式
- `.planning/phases/02-types-validation/02-CONTEXT.md` — 类型系统、验证框架

### Requirements
- `.planning/REQUIREMENTS.md` §F5 — Quick Switch Command
- `.planning/REQUIREMENTS.md` §F6 — Current Status Display
- `.planning/REQUIREMENTS.md` §U4 — Help Documentation (command reference)

### Existing Code (Services)
- `src/lib/services/index.ts` — Services barrel export
- `src/lib/services/project-service.ts` — ProjectService (listProjects, getProject)
- `src/lib/services/template-service.ts` — TemplateService (applyTemplate, getAll)
- `src/lib/services/config-service.ts` — ConfigService (readConfig, writeConfig)
- `src/lib/services/provider-service.ts` — ProviderService (defaults, connectivity)

### Existing Code (State)
- `src/lib/store/state.ts` — AppState (current project, settings)

### Dependencies (package.json)
- `commander` (14.0.3) — CLI framework
- `chalk` (5.6.2) — Output formatting
- `ink` (7.0.0) — TUI framework (Phase 06)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/lib/services/index.ts`: Services barrel — CLI 直接导入调用
- `src/lib/services/project-service.ts`: listProjects — list 命令核心
- `src/lib/services/template-service.ts`: getAll, applyTemplate — switch/template 命令核心
- `src/lib/services/config-service.ts`: readConfig — current 命令核心
- `src/lib/store/state.ts`: AppState — 获取当前激活项目

### Established Patterns
- ESM module system (type: module)
- Commander 已安装 (14.0.3)
- Services 构造函数注入 (Phase 04 D-01)
- Services 抛出 Error (Phase 04 D-02)
- Barrel export pattern

### Integration Points
- `src/cli/`: 新目录存放 CLI 实现
- `src/cli/index.ts`: CLI 入口，替换现有 src/index.ts skeleton
- `src/cli/commands/`: 各命令实现文件
- `package.json` bin: `cc-config` → `./dist/index.js`

</code_context>

<specifics>
## Specific Ideas

- CLI 入口检测参数：无参数调用 TUI，有参数执行命令
- list 输出彩色表格：项目名、路径、当前配置、状态图标
- switch 无模板名时弹出 TUI 模板选择列表
- current 显示当前项目路径和激活的模板名
- template create 需要交互式输入模板名和配置内容（可调用 TUI 表单）

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 05-cli-interface*
*Context gathered: 2026-04-14*