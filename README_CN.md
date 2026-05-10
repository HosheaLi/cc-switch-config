# CC Config Switch

一个用于管理 Claude Code 项目级 API 提供商配置的 CLI/TUI 工具。

[English](./README.md) | 中文

## 简介

CC Config Switch 帮助你管理不同项目的 API 提供商和模型配置。无需手动编辑每个项目的 `.claude/settings.json` 文件，你可以：

- 创建可复用的提供商模板
- 快速切换配置
- 应用前预览变更
- 导入/导出配置以便备份和分享

## 安装

```bash
npm install cc-config-switch
```

或全局安装：

```bash
npm install -g cc-config-switch
```

## 快速开始

### 启动 TUI

使用 CC Config Switch 最简单的方式是通过交互式 TUI：

```bash
cc-config
```

这将打开一个交互界面，你可以：
- 浏览所有已注册项目
- 选择项目并应用模板
- 应用前预览配置变更
- 查看配置无效时的验证错误

### 快速切换（v0.2+）

最简单的 CLI 用法：

```bash
# 快速切换当前项目配置
cc-config 我的配置名
```

如果当前目录有 `.claude/` 但未注册，会自动注册。

### CLI 命令

如果你更喜欢命令行操作：

```bash
# 列出所有已注册项目
cc-config list

# 显示当前项目配置
cc-config current

# 切换到模板（应用到当前目录）
cc-config switch <项目名> <模板名>

# 注册/注销项目
cc-config register <路径> [-t 模板]
cc-config unregister <名称>

# 撤销上次配置变更
cc-config undo
```

## CLI 命令参考

### `cc-config list`

列出所有已注册项目及其配置状态。

```bash
cc-config list [--json]
```

选项：
- `--json`: 以 JSON 格式输出

### `cc-config current`

显示当前项目的活动配置。

```bash
cc-config current
```

显示内容：
- 项目路径
- 活动模板名称
- 最后修改时间

### `cc-config switch`

将模板应用到指定项目目录。

```bash
cc-config switch <项目名或路径> <模板名>
```

### `cc-config config`

管理 API 提供商配置。

```bash
# 列出所有配置
cc-config config list

# 添加新配置（交互式 CLI）
cc-config config add

# 删除配置
cc-config config remove <名称> [--force]
```

选项：
- `--force`: 跳过删除确认提示

### `cc-config undo`

恢复当前项目配置的最新备份。

```bash
cc-config undo
```

从最新备份文件恢复并显示备份时间戳。

### `cc-config scan`

扫描目录以查找 Claude Code 项目。

```bash
cc-config scan [目录] [--register] [--tui] [--json]
```

选项：
- `--register`: 自动注册找到的项目
- `--tui`: 启动 TUI 多选界面
- `--json`: 以 JSON 格式输出

### `cc-config auto-check`

检查当前目录是否应触发自动切换。

```bash
cc-config auto-check
```

用于 shell 钩子检测项目目录。

### `cc-config import`

从 JSON 文件导入配置。

```bash
cc-config import <文件> [--merge] [--strategy <merge|overwrite|skip>]
```

选项：
- `--merge`: `--strategy merge` 的别名
- `--strategy`: 导入策略（非交互模式）

### `cc-config export`

将配置导出到 JSON 文件。

```bash
cc-config export [项目标识符] [文件] [--stdout]
```

选项：
- `--stdout`: 输出到标准输出而非文件

项目标识符可以是：
- 项目 UUID
- 项目名称
- 项目路径

## TUI 导航

不带参数启动 `cc-config` 时，TUI 会打开。

### 项目列表界面

- **方向键**: 在项目列表中导航
- **j/k**: Vim 风格导航
- **Enter**: 选择项目进行编辑
- **U**: 撤销所选项目的上次变更
- **S**: 扫描新项目
- **/ 或 f**: 启动模糊搜索
- **Escape**: 退出

### 配置编辑界面

- **方向键**: 在模板列表中导航
- **Enter**: 预览并应用模板
- **Escape**: 取消并返回项目列表

### Diff 界面（应用前）

显示应用前的配置变更：
- 红色行: 被移除的值
- 绿色行: 新增的值

- **y**: 确认并应用
- **n 或 Escape**: 取消

### 验证错误界面

如果配置有错误，此界面会阻止后续操作：
- 显示所有验证错误
- **Escape**: 返回修复错误

### 扫描界面

选择新项目进行注册：
- **方向键**: 导航
- **空格**: 切换选择
- **Enter**: 注册所选项目
- **Escape**: 取消

## 功能特性

### 配置 CRUD 操作

配置的完整生命周期管理：
- 创建新的提供商模板
- 读取/列出所有模板
- 更新现有模板
- 删除模板（需确认）

### 交互式 TUI 选择器

可视化界面包含：
- 仪表盘首页（v0.2+），快速概览和操作
- 首次运行向导（v0.2+），引导新用户完成初始设置
- 键盘导航（方向键 + vim j/k）
- 模糊搜索快速过滤
- 实时预览面板

### 配置预览

应用任何模板前：
- 查看变更的统一 diff
- 红色显示移除的值，绿色显示新增的值
- 仅显示变更字段（紧凑视图）

### 模板系统

创建可复用模板用于：
- 不同 API 提供商（Anthropic、OpenRouter 等）
- 不同模型配置
- 自定义环境设置

### 导入/导出

备份和分享配置：
- 导出所有模板到 JSON
- 从 JSON 文件导入
- 导入时可合并或替换

### 验证

配置的 Schema 验证：
- 所有字段的类型检查
- 带路径的友好错误消息
- 阻止无效配置

### 撤销支持

从错误中恢复：
- 每次变更前自动备份
- 单条 undo 命令恢复最新备份
- 显示备份时间戳

### Shell 钩子集成

进入项目目录时自动切换：
- Shell 钜子检测项目变更
- 自动应用配置
- 静默模式最小输出

## 开发

```bash
# 安装依赖
npm install

# 开发模式运行
npm run dev

# 生产构建
npm run build

# 运行测试
npm test

# 运行覆盖率测试
npm run test:coverage

# 运行性能基准测试
npm run bench

# 生成 API 文档
npm run docs
```

## 配置文件

CC Config Switch 管理以下文件：

| 文件 | 位置 | 用途 |
|------|------|------|
| `settings.json` | `<项目>/.claude/` | 项目级 Claude Code 配置 |
| `settings.local.json` | `<项目>/.claude/` | 本地覆盖（不跟踪 git） |
| `templates.json` | `~/.config/cc-config-switch/` | 提供商模板 |
| `projects.json` | `~/.local/share/cc-config-switch/` | 已注册项目 |

## 许可证

MIT

## 贡献

欢迎贡献！请阅读文档并确保测试通过后再提交 PR。