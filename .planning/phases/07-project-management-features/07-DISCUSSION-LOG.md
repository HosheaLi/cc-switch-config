# Phase 7: Project Management Features - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-14
**Phase:** 07-project-management-features
**Areas discussed:** Auto-Switch 实现, Import/Export 格式, Scan UI 集成

---

## Auto-Switch 实现

### 检测方式

| Option | Description | Selected |
|--------|-------------|----------|
| Shell hook (推荐) | 用户添加 chdir hook 到 shell（bashrc/zshrc），每次 cd 时调用 cc-config 检查并切换。这是最标准的方案，类似 direnv/fzf 的使用方式。 | ✓ |
| 后台 watcher daemon | 后台 daemon 使用 chokidar 监听目录，当 cwd 变化时自动切换。需要持续运行，有资源开销。 | |
| 手动命令触发 | 手动运行 `cc-config auto` 触发检测并切换当前目录的配置。简单但需手动触发。 | |

**User's choice:** Shell hook (推荐)
**Notes:** 标准 Unix 工具模式，类似 direnv，用户可控触发时机，不占用后台资源

---

### Shell 输出行为

| Option | Description | Selected |
|--------|-------------|----------|
| 静默 + 仅切换时输出 (推荐) | 只在发生切换时输出一条消息（如 "Switched to template X"），其他情况完全安静。不干扰正常 shell 操作。 | ✓ |
| 始终显示状态 | 每次 cd 都输出当前状态（即使不切换），让用户始终知道当前配置。可能有点干扰。 | |
| 完全静默 | 完全不输出任何内容，切换完全静默。用户需手动运行 `current` 查看状态。 | |

**User's choice:** 静默 + 仅切换时输出 (推荐)
**Notes:** 用户 cd 是常用操作，频繁输出会造成干扰，只在切换时反馈

---

### 未注册目录处理

| Option | Description | Selected |
|--------|-------------|----------|
| 提示注册新项目 | 检查当前目录是否有 .claude/settings.json，如果有则提示用户注册。静默处理无配置目录。 | ✓ |
| 完全静默 (推荐) | 不做任何提示，完全静默。用户需手动运行 `scan` 或 `register` 命令。 | |
| 自动注册 | 自动注册发现的 .claude 项目，无需用户确认。可能意外注册不想管理的目录。 | |

**User's choice:** 提示注册新项目
**Notes:** 发现 .claude 目录时提示用户注册，避免意外添加不想管理的目录

---

### 参考实现

**参考文件:** `~/.claude/hooks/model-switch.js`
**内容:** 用户已有的模型切换脚本，提供配置层级处理、预定义模板结构、settings.local.json 写入逻辑等参考

---

## Import/Export 格式

### 导出范围

| Option | Description | Selected |
|--------|-------------|----------|
| 单个项目 (推荐) | 导出当前项目的 settings.json + templates。适合单独备份或分享单个项目配置。 | ✓ |
| 全部项目 | 导出所有注册项目 + 所有模板 + AppState。适合完整备份或迁移整个配置系统。 | |
| 仅模板 | 只导出模板定义（不含项目配置）。适合分享模板给他人。 | |

**User's choice:** 单个项目 (推荐)
**Notes:** 单项目导出/导入是最常用场景，简化操作

---

### 文件格式

| Option | Description | Selected |
|--------|-------------|----------|
| 单 JSON 文件 (推荐) | 导出为 JSON 文件，包含 settings + template 信息。简单可读，可直接编辑。 | ✓ |
| 压缩包 | 打包为 zip/tar，包含 settings.json + templates.json + metadata。保留完整结构，适合备份。 | |
| 两种格式支持 | 支持 JSON 和压缩包两种格式，用户导出时可选择 --zip 参数。 | |

**User's choice:** 单 JSON 文件 (推荐)
**Notes:** JSON 格式与现有配置一致，可直接编辑查看

---

### 导入冲突处理

| Option | Description | Selected |
|--------|-------------|----------|
| Deep merge 合并 (推荐) | 导入的配置与现有配置合并（deep merge），保留用户未覆盖的字段。避免意外丢失现有配置。 | |
| 完全覆盖 | 导入的配置完全覆盖现有配置。适合恢复完整备份，但会丢失现有设置。 | |
| 交互式冲突处理 | 导入时检测冲突，让用户选择合并/覆盖/跳过。灵活但交互复杂。 | ✓ |

**User's choice:** 交互式冲突处理
**Notes:** 灵活处理各种导入场景，检测冲突字段，弹出选择界面

---

## Scan UI 集成

### 触发方式

| Option | Description | Selected |
|--------|-------------|----------|
| TUI 快捷键触发 (推荐) | 在项目列表界面按 S 触发扫描。扫描后显示新发现的项目列表，用户选择注册。 | |
| CLI 命令触发 | CLI 命令 `cc-config scan` 触发，结果直接输出到终端。简单但需要手动执行。 | |
| 两种方式支持 | 同时支持 TUI 快捷键和 CLI 命令，用户可选择方式。 | ✓ |

**User's choice:** 两种方式支持
**Notes:** 满足不同使用场景，TUI 方便交互，CLI 方便脚本

---

### 扫描结果处理

| Option | Description | Selected |
|--------|-------------|----------|
| TUI 选择界面 (推荐) | 扫描后弹出选择界面，显示新发现的项目，用户选择注册哪些。已注册项目标记为灰色。 | ✓ |
| 自动全部注册 | 扫描后直接注册所有新发现的项目，无需确认。快速但可能注册不想管理的目录。 | |
| 输出列表 + 手动注册 | 扫描结果输出到终端，用户手动执行 `register` 命令注册特定项目。 | |

**User's choice:** TUI 选择界面 (推荐)
**Notes:** 用户可勾选想注册的项目，避免全部注册，已注册项目标记灰色

---

## Claude's Discretion

以下方面由 Claude 在规划/实现时自主决定：
- Shell hook 安装指令的详细文档
- 导出 JSON 文件的具体 schema 结构
- ScanScreen 与 ProjectListScreen 的交互流程
- Import 冲突检测的具体字段比较逻辑
- Auto-Switch 提示注册的时机（首次进入 vs 每次进入）

---

## Deferred Ideas

None — discussion stayed within phase scope.

---

*Discussion log for: Phase 07*
*Date: 2026-04-14*