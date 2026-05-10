# CC Config Switch 使用说明

## 安装

```bash
npm install -g cc-config-switch
```

## 快速开始

```bash
# 1. 扫描并注册所有项目
cc-config scan --register

# 2. 启动交互界面
cc-config

# 3. 或直接切换当前项目配置
cc-config switch <模板名>
```

## 命令参考

### 快速切换

```bash
cc-config <配置名>                    # 快速切换当前项目配置（无需 switch 子命令）
```

### 项目管理

```bash
cc-config list [--json]              # 列出已注册项目
cc-config current                    # 显示当前项目配置
cc-config register <path> [-t 模板]   # 手动注册项目目录
cc-config unregister <项目名>         # 注销已注册项目
cc-config scan [目录] [--register] [--tui] [--json]  # 扫描项目
cc-config undo                       # 撤销上次配置变更
```

### 配置管理

```bash
cc-config config add                 # 交互式创建配置（支持统一/独立两种模式）
cc-config config list [-j]           # 列出所有配置（-j JSON 格式）
cc-config config remove <名称> [--force]  # 删除配置
cc-config cfg add/cfg list/cfg rm    # 同上（别名）
```

创建配置时支持两种模式：

- **统一模式 (unified)**：输入一个模型名称，自动应用于全部 6 个模型环境变量 (`ANTHROPIC_MODEL`, `ANTHROPIC_DEFAULT_SONNET_MODEL`, `ANTHROPIC_DEFAULT_HAIKU_MODEL`, `ANTHROPIC_DEFAULT_OPUS_MODEL`, `ANTHROPIC_REASONING_MODEL`)
- **独立模式 (granular)**：分别填写每个模型环境变量，适用于不同模型使用不同名称的场景（如主模型用 `glm-5`，Haiku 用 `glm-5-flash`）

### 配置切换

```bash
cc-config switch <模板名> [--silent]  # 应用模板到当前项目
cc-config auto-check                 # 检查是否需要自动切换
```

### 导入导出

```bash
cc-config export [项目ID] [文件] [--stdout]   # 导出配置
cc-config import <文件> [--merge] [--strategy merge|overwrite|skip]  # 导入配置
```

## TUI 操作

启动 TUI：`cc-config`

| 界面 | 按键 | 功能 |
|------|------|------|
| 项目列表 | `↑/↓` 或 `j/k` | 选择项目 |
| 项目列表 | `Enter` | 进入配置编辑 |
| 项目列表 | `/` 或 `f` | 模糊搜索 |
| 项目列表 | `s` | 扫描新项目 |
| 项目列表 | `u` | 撤销选中项目变更 |
| 项目列表 | `Esc` | 退出 |
| 配置编辑 | `↑/↓` | 选择模板 |
| 配置编辑 | `Enter` | 预览变更 |
| 配置编辑 | `Esc` | 返回列表 |
| Diff 预览 | `y` | 确认应用 |
| Diff 预览 | `n` / `Esc` | 取消 |
| 扫描选择 | `Space` | 切换选中 |
| 扫描选择 | `Enter` | 注册选中项目 |

## 快速切换自动注册

执行 `cc-config <配置名>` 时，如果当前目录未注册但检测到 `.claude/` 目录，会自动注册该项目。

## 典型场景

### 场景一：多项目不同 API 配置

```bash
cd ~/project-a && cc-config switch anthropic
cd ~/project-b && cc-config switch openrouter
```

### 场景二：批量注册项目

```bash
# 自动扫描并注册
cc-config scan ~ --register

# 或 TUI 多选
cc-config scan ~ --tui
```

### 场景三：团队配置共享

```bash
# 导出
cc-config export --stdout > team-config.json

# 队友导入
cc-config import team-config.json --strategy merge
```

### 场景四：Shell 自动切换

在 `.zshrc` 中添加：

```zsh
auto_cc_config() {
  [[ -f .claude/settings.json ]] && cc-config auto-check 2>/dev/null
}
chpwd_functions+=(auto_cc_config)
```

## 配置文件

| 文件 | 路径 | 说明 |
|------|------|------|
| 项目配置 | `<项目>/.claude/settings.json` | Claude Code 项目配置 |
| 本地覆盖 | `<项目>/.claude/settings.local.json` | 本地私有配置（不提交 Git） |
| 模板存储 | `~/.config/cc-config-switch/templates.json` | 所有模板 |
| 项目索引 | `~/.local/share/cc-config-switch/projects.json` | 已注册项目 |
| 配置备份 | `~/.local/share/cc-config-switch/backups/` | 自动备份 |

## 常见问题

| 问题 | 解决 |
|------|------|
| 配置未生效 | Claude Code 需要重启 |
| 项目未找到 | 先执行 `cc-config scan --register` |
| 模板未找到 | `cc-config template list` 查看可用模板 |
| 无法撤销 | 必须有备份，`undo` 只恢复最近一次 |
