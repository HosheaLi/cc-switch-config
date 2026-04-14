# Phase 7: Project Management Features - Context

**Gathered:** 2026-04-14
**Status:** Ready for planning

<domain>
## Phase Boundary

项目管理增强功能，提升便利性。

此 phase 在 Core TUI (Phase 06) 基础上构建项目管理增强：
- **Auto-Switch by Directory** (F9): 进入项目目录自动应用对应配置
- **Project Directory Scan** (F10): 自动扫描发现现有项目
- **Import/Export Configs** (F13): 配置备份迁移分享
- **Fuzzy Search** (F14): 已在 Phase 06 实现，无需重复

**Scope anchor:** 增强项目管理的便利性，不改变核心配置管理功能。

</domain>

<decisions>
## Implementation Decisions

### Auto-Switch (F9)

- **D-01:** Shell hook 实现 — 类似 direnv 模式
  - **Why:** 标准 Unix 工具模式，不占用后台资源，用户可控触发时机
  - **How:** 提供 chdir hook 脚本，用户添加到 bashrc/zshrc

- **D-02:** 静默 + 仅切换时输出 — 不干扰正常 shell 操作
  - **Why:** 用户 cd 是常用操作，频繁输出会造成干扰
  - **How:** 只在发生实际配置切换时输出一条消息

- **D-03:** 提示注册新项目 — 发现 .claude 目录时提示
  - **Why:** 自动注册可能意外添加不想管理的目录
  - **How:** 检测当前目录有 .claude/settings.json 但未注册时，提示用户注册

- **D-04:** 参考现有 model-switch.js — 用户已有类似实现
  - **Why:** 保持与现有工作流一致，复用已验证的模式
  - **How:** 参考 ~/.claude/hooks/model-switch.js 的配置层级处理逻辑

### Import/Export (F13)

- **D-05:** 单个项目范围 — 导出当前项目配置
  - **Why:** 单项目导出/导入是最常用场景，简化操作
  - **How:** `export <project-id>` 和 `import <file.json>` 命令

- **D-06:** 单 JSON 文件格式 — 简单可读
  - **Why:** JSON 格式与现有配置一致，可直接编辑查看
  - **How:** 导出文件包含 settings + template + metadata

- **D-07:** 交互式冲突处理 — 检测冲突让用户选择
  - **Why:** 灵活处理各种导入场景，避免意外覆盖
  - **How:** 导入时检测冲突字段，弹出选择界面（合并/覆盖/跳过）

### Scan UI (F10)

- **D-08:** 两种触发方式 — TUI 快捷键 + CLI 命令
  - **Why:** 满足不同使用场景，TUI 方便交互，CLI 方便脚本
  - **How:** TUI 按 S 键触发，CLI `cc-config scan` 命令

- **D-09:** TUI 选择界面 — 扫描后弹出选择列表
  - **Why:** 用户可勾选想注册的项目，避免全部注册
  - **How:** ScanScreen 显示新发现项目列表，已注册项目标记灰色

### Fuzzy Search (F14)

- **已实现:** Phase 06 useFuzzySearch hook，threshold 0.4
- 无需重复实现

### Claude's Discretion

- Shell hook 安装指令的详细文档
- 导出 JSON 文件的具体 schema 结构
- ScanScreen 与 ProjectListScreen 的交互流程
- Import 冲突检测的具体字段比较逻辑
- Auto-Switch 提示注册的时机（首次进入 vs 每次进入）

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Prior Phase Decisions
- `.planning/phases/06-core-tui/06-CONTEXT.md` — TUI screens、hooks、useFuzzySearch
- `.planning/phases/04-services-layer/04-CONTEXT.md` — ProjectService.scanProjects()、scanDirectories
- `.planning/phases/03-data-layer/03-CONTEXT.md` — ProjectIndex、AppState

### Requirements
- `.planning/REQUIREMENTS.md` §F9 — Auto-Switch by Directory
- `.planning/REQUIREMENTS.md` §F10 — Project Directory Scan
- `.planning/REQUIREMENTS.md` §F13 — Import/Export Configs
- `.planning/REQUIREMENTS.md` §F14 — Fuzzy Search (已实现)

### Existing Code Reference
- `~/.claude/hooks/model-switch.js` — 用户已有的模型切换实现，参考配置层级处理逻辑

### Existing Code (Services)
- `src/lib/services/project-service.ts` — scanProjects(), registerProject(), listProjects()
- `src/lib/store/state.ts` — AppState, scanDirectories 字段
- `src/lib/store/project.ts` — ProjectIndex, getByPath(), register()

### Existing Code (TUI)
- `src/tui/screens/ProjectListScreen.tsx` — 项目列表界面
- `src/tui/hooks/useFuzzySearch.ts` — 模糊搜索 hook
- `src/tui/screens/ConfirmScreen.tsx` — 确认界面（可复用）

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/lib/services/project-service.ts`: scanProjects() — 扫描逻辑已实现，需要 TUI 入口
- `src/lib/store/state.ts`: scanDirectories — 扫描目录配置已实现
- `src/tui/hooks/useFuzzySearch.ts`: 模糊搜索 — F14 已实现
- `src/tui/screens/ConfirmScreen.tsx`: 确认界面 — Import 冲突处理可复用
- `src/tui/screens/ProjectListScreen.tsx`: 列表界面 — Scan 结果展示可参考布局

### Established Patterns
- Shell hook 模式 (参考 direnv)
- TUI screen 组件模式 (Phase 06)
- useFuzzySearch hook 模式 (threshold 0.4)
- ConfirmScreen 交互模式 (y/n 确认)
- Services + TUI 集成模式 (Clean Architecture)

### Integration Points
- `src/cli/commands/scan.ts`: 新 CLI scan 命令
- `src/cli/commands/import.ts`: 新 CLI import 命令
- `src/cli/commands/export.ts`: 新 CLI export 命令
- `src/tui/screens/ScanScreen.tsx`: 新 TUI 扫描结果界面
- `src/cli/utils/auto-switch.ts`: Auto-Switch shell hook 逻辑
- `src/lib/services/config-service.ts`: Import/Export 服务层逻辑

### Reference Implementation
- `~/.claude/hooks/model-switch.js`: 用户已有的模型切换脚本
  - 项目级 settings.local.json 写入逻辑
  - 配置层级处理 (project > global)
  - 预定义模板结构 (MODEL_CONFIGS)
  - 命令行参数解析模式

</code_context>

<specifics>
## Specific Ideas

### Auto-Switch Shell Hook
```bash
# 用户添加到 ~/.zshrc 或 ~/.bashrc
function chdir_hook() {
  cc-config auto-check --silent
}
# zsh: add to precmd_functions
# bash: add to PROMPT_COMMAND
```

### Export JSON Structure
```json
{
  "version": "1.0",
  "exportedAt": "2026-04-14T...",
  "project": {
    "id": "...",
    "path": "/path/to/project",
    "name": "My Project"
  },
  "settings": { ... },
  "template": { ... }  // 如果有应用模板
}
```

### Import Conflict Handling
- 检测 settings 中已存在的字段
- 弹出选择界面：Merge (保留现有 + 合入新) / Overwrite / Skip
- 类似 ConfirmScreen 的交互模式

### Scan UI Flow
- TUI: ProjectListScreen 按 S → ScanScreen 显示结果 → 勾选 → ConfirmScreen 确认注册
- CLI: `cc-config scan --root ~/code` → 输出发现列表 → `cc-config register <path>` 手动注册

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 07-project-management-features*
*Context gathered: 2026-04-14*