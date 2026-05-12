# cc-switch-config

<p align="center">
  <b>⚡ 秒级切换 · 135 KB 极致轻量 · 交互式 TUI</b><br>
  <sub>轻量化的 Claude Code 项目级 API 配置切换工具</sub>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/cc-switch-config"><img src="https://img.shields.io/npm/v/cc-switch-config" alt="npm version"></a>
  <a href="https://github.com/HosheaLi/cc-switch-config"><img src="https://img.shields.io/github/stars/HosheaLi/cc-switch-config?style=flat" alt="GitHub stars"></a>
  <a href="./LICENSE"><img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License: MIT"></a>
  <a href="https://nodejs.org"><img src="https://img.shields.io/badge/node-%3E%3D18.17-brightgreen" alt="Node.js >= 18.17"></a>
  <a href="https://img.shields.io/npm/dm/cc-switch-config"><img src="https://img.shields.io/npm/dm/cc-switch-config" alt="npm downloads"></a>
</p>

<p align="center">
  <a href="#核心特性">核心特性</a> ·
  <a href="#快速开始">快速开始</a> ·
  <a href="#cli-命令">CLI 命令</a> ·
  <a href="#工作原理">工作原理</a> ·
  <a href="#shell-钩子">Shell 钩子</a> ·
  <a href="#文档">文档</a>
</p>

<p align="center">
  <a href="./README.md">English</a>
</p>

---

## 为什么需要它？

你同时维护多个项目，每个项目需要不同的 Claude Code API 配置：

| 场景 | API 提供商 | 典型配置 |
|------|-----------|---------|
| 🏢 **团队项目** | Anthropic 直连 | 官方 API Key + 默认模型 |
| 🧑‍💻 **个人项目** | 自定义端点 | 自建代理、自定义 Base URL |
| 🤝 **客户项目** | 转发服务 | 第三方 API、不同模型配置 |
| 🔬 **实验项目** | 不同模型 | 在 Sonnet/Opus/Haiku 间切换 |

每次都手动改 `.claude/settings.local.json`？不仅烦，还容易出错。（cc-switch-config 写入的是 `settings.local.json` 文件，Claude Code 读取时该文件优先级高于 `settings.json`。）

**cc-switch-config** 只做一件事：让你一条命令切换整个 Claude Code API 配置。不臃肿，不复杂，装上就能用。

---

## 核心特性

| # | 特性 | 说明 |
|---|------|------|
| ⚡ | **秒级切换** | `cc-config <配置名>` — 一条命令，瞬间完成 |
| 🪶 | **极致轻量** | 仅 **135 KB** 安装体积，8 个运行时依赖，无臃肿依赖树 |
| 🎨 | **交互式 TUI** | 精美的终端仪表盘，支持模糊搜索、diff 预览、向导式操作 |
| 🔒 | **安全第一** | API Key 密码式输入、脱敏显示、永不写入日志和 CLI 参数 |
| 💾 | **自动备份** | 每次变更前自动创建备份，`cc-config undo` 一键恢复 |
| 📦 | **配置复用** | 一次创建提供商模板（`cc-config config add`），任意项目复用 |
| 🔗 | **Shell 钩子** | `cd` 进入项目目录自动切换配置，完全无感 |
| 🗂️ | **两种配置模式** | **统一模式** — 一个模型名自动映射到 6 个模型环境变量。**独立模式** — 逐一指定每个模型环境变量 |
| 🔍 | **批量扫描** | 扫描整个目录树自动发现 `.claude/` 项目，批量注册 |
| 📤 | **导出/导入** | 通过 `export`/`import` 在团队间共享配置，支持合并/覆盖/跳过策略 |
| 🛡️ | **原子写入** | Write-rename 模式确保配置文件永远不会处于中间状态 |

---

## 快速开始

```bash
# 全局安装
npm install -g cc-switch-config

# 启动交互式 TUI 仪表盘（新手推荐）
cc-config

# 一步切换当前项目到配置
cc-config my-anthropic-profile

# 列出所有注册项目
cc-config list
```

### 首次设置

```bash
# 1. 创建 API 配置模板
cc-config config add
# → 按提示输入：名称、API Key、Base URL、模型

# 2. 注册你的项目
cc-config register /path/to/your/project

# 3. 应用配置
cc-config switch your-project your-config

# 4. 完成！重启 Claude Code 后新配置生效。
```

### 五分钟上手演示

```bash
# 1. 安装
npm install -g cc-switch-config

# 2. 创建两个配置模板
cc-config config add
# → 名称: "anthropic-direct"
# → API Key: sk-ant-xxxxx
# → Base URL: https://api.anthropic.com
# → 模型: claude-sonnet-4

cc-config config add
# → 名称: "openrouter-custom"
# → API Key: sk-or-xxxxx
# → Base URL: https://openrouter.ai/api/v1
# → 模型: claude-sonnet

# 3. 注册项目并配置
cc-config register ~/work/team-project
cc-config switch team-project anthropic-direct

cc-config register ~/personal/hobby-project
cc-config switch hobby-project openrouter-custom

# 4. 以后进入项目目录，一条命令切换
cd ~/work/team-project
cc-config anthropic-direct            # 切到团队配置

cd ~/personal/hobby-project
cc-config openrouter-custom           # 切到个人配置
```

---

## CLI 命令

### 主入口

```bash
cc-config                           # 启动交互式 TUI 仪表盘
cc-config <config-name>             # 快速切换当前项目（最常用）
cc-config --help                    # 查看帮助
cc-config --version                 # 查看版本
```

### 配置管理

```bash
cc-config config add                # 创建配置模板（统一模式/独立模式可选）
cc-config config list               # 列出所有配置模板
cc-config config list --json        # JSON 格式输出（脚本集成用）
cc-config config remove <name>      # 删除配置
cc-config config remove <name> --force  # 强制删除，不确认
cc-config cfg add                   # config add 的别名
cc-config cfg list                  # config list 的别名
cc-config cfg rm <name>             # config remove 的别名
```

两种配置模式：

```
 统一模式（推荐）                   独立模式（精细控制）
 ┌─────────────────────────────┐   ┌──────────────────────────────┐
 │ 名称: "anthropic-default"   │   │ 名称: "custom-setup"         │
 │ apiKey: "sk-ant-****"       │   │ 模式: "granular"             │
 │ baseUrl: "https://..."      │   │ 环境变量:                     │
 │ modelName: "claude-sonnet"  │   │   ANTHROPIC_MODEL: sonnet    │
 │                             │   │   CLAUDE_CODE_SUBAGENT: haiku│
 │ 一个模型名 → 自动填充        │   │   ... (每个变量独立设置)      │
 │ 6 个模型环境变量             │   │                              │
 └─────────────────────────────┘   └──────────────────────────────┘
```

统一模式自动配置的 6 个环境变量：
- `ANTHROPIC_MODEL` — Claude Code 主模型
- `ANTHROPIC_DEFAULT_SONNET_MODEL` — Sonnet 默认模型
- `ANTHROPIC_DEFAULT_HAIKU_MODEL` — Haiku 默认模型
- `ANTHROPIC_DEFAULT_OPUS_MODEL` — Opus 默认模型
- `ANTHROPIC_REASONING_MODEL` — 推理模型
- `CLAUDE_CODE_SUBAGENT_MODEL` — Subagent 模型

### 项目管理

```bash
cc-config list                      # 列出注册的项目
cc-config list --json               # JSON 格式输出
cc-config register <path>           # 注册项目（需含 .claude/ 目录）
cc-config register <path> -t <tmpl> # 注册并应用配置模板
cc-config unregister <name>         # 取消注册项目
cc-config unregister <name> --force # 强制取消注册
cc-config switch <project> <config> # 为指定项目应用配置
cc-config current                   # 查看当前项目配置
cc-config current --json            # JSON 格式输出
cc-config scan [directory]          # 扫描目录发现 .claude/ 项目
cc-config scan [directory] --register  # 扫描并自动注册
cc-config scan [directory] --tui    # 扫描并进入 TUI 选择
cc-config scan [directory] --json   # 扫描并输出 JSON
```

### 安全与工具

```bash
cc-config undo                      # 恢复最近一次备份
cc-config export                    # 导出配置到文件
cc-config export --stdout           # 导出到标准输出（管道/分享）
cc-config export <project-id>       # 导出指定项目的配置
cc-config import <file>             # 从 JSON 文件导入配置
cc-config import <file> --merge     # 导入并与已有配置合并
cc-config import <file> --strategy overwrite  # 冲突时覆盖
cc-config import <file> --strategy skip       # 冲突时跳过
cc-config auto-check                # Shell 钩子静默检查
```

---

## 工作原理

cc-switch-config 维护两个数据存储——**全局配置模板**和**项目配置索引**——通过精确编辑引擎将它们桥接。

```
全局存储 (~/.config/cc-config/)
└── templates.json           ← 所有保存的配置模板
    ├─ "anthropic-direct"    → { apiKey, baseUrl, modelName }
    ├─ "openrouter-proxy"    → { apiKey, baseUrl, modelName }
    └─ "custom-granular"     → { mode: "granular", env: { ... } }

项目索引 (~/.config/cc-config/projects.json)
└── projects                 ← 已注册项目列表
    ├─ "project-alpha"       → { path, activeConfig }
    └─ "project-beta"        → { path, activeConfig }

备份存储 (~/.local/share/cc-config/)
├── backups/                 ← 自动预操作备份
│   ├─ settings.local.json.20260512T1430.backup
│   └─ settings.local.json.20260512T1502.backup
└── projects.json            ← 项目元数据

目标文件 (<project>/.claude/settings.local.json)
└── { ... "env": { ... }, "model": "...", permissions, hooks, ... }
    ↑ cc-config 精确修改 ONLY 这两个字段
```

cc-switch-config 对项目级配置写入的是 `settings.local.json` 文件，这是项目级覆盖文件——Claude Code 读取时其优先级高于 `settings.json`，因此是项目级 API 配置的正确写入目标。唯一例外是当目标为全局 `~/.claude` 目录本身时，会直接写入 `settings.json`。

### 设计原则：最小修改

执行 `cc-config switch` 时，目标 `.claude/settings.local.json` 中**仅修改两个字段**：

- **`env` 块**：提供商相关的环境变量（API Key、Base URL、模型名映射）
- **`model` 字段**（统一模式）：项目的默认模型

其他所有配置——`permissions`、`hooks`、`mcpServers`、`allowWriteToLocalDirectory`、`respectGitignore` 以及任何自定义字段——**完全保留不动**。

### 安全保障机制

| 机制 | 说明 |
|------|------|
| **原子写入** | 新内容先写入临时文件，再 rename 覆盖目标文件。任何时候进程崩溃，原始文件完好无损 |
| **自动备份** | 每次修改前自动保存当前状态到 `backups/` 目录，含时间戳标识 |
| **一键撤销** | `cc-config undo` 立即恢复最近一次备份 |
| **零密钥泄露** | API Key 不传递为 CLI 参数，不全量回显到终端，不写入日志文件 |

---

## Shell 钩子

添加到 `.zshrc` 或 `.bashrc`，实现进入目录时自动切换：

```zsh
# 进入项目目录时自动切换 Claude Code API 配置
auto_cc_config() {
  [[ -f .claude/settings.local.json ]] && cc-config auto-check 2>/dev/null
}
chpwd_functions+=(auto_cc_config)
```

现在，每次 `cd` 进入包含 `.claude/settings.local.json` 的目录时，cc-switch-config 会自动静默检查当前配置是否正确。只要预先注册了项目并分配了配置，之后你完全不需要操心 API 配置的事情。

---

## TUI 仪表盘

直接运行 `cc-config`（不带参数）启动交互式终端 UI。

| 界面 | 操作 | 功能 |
|------|------|------|
| **项目列表** | `↑/↓` 或 `j/k` | 导航选择项目 |
| | `Enter` | 编辑/切换选中项目的配置 |
| | `/` 或 `f` | 模糊搜索项目 |
| | `s` | 扫描新项目 |
| | `u` | 撤销选中项目的上次变更 |
| | `Esc` / `q` | 退出 |
| **配置选择** | `↑/↓` | 浏览可用配置 |
| | `Enter` | 预览变更的 diff |
| | `Esc` | 返回项目列表 |
| **Diff 预览** | `y` | 确认并应用变更 |
| | `n` / `Esc` | 取消 |
| **扫描结果** | `Space` | 切换项目选中状态 |
| | `Enter` | 注册选中的项目 |

---

## 常见场景

### 场景 1：每个项目不同的 API

```bash
cd ~/work/team-project
cc-config switch anthropic-direct    # 团队项目用官方 Anthropic

cd ~/personal/hobby-project
cc-config switch openrouter-proxy    # 个人项目走代理

cd ~/clients/acme-corp
cc-config switch acme-custom         # 客户项目用自定义端点
```

### 场景 2：批量导入项目

```bash
# 扫描整个代码目录，一次注册所有项目
cc-config scan ~/code --register

# 然后批量应用配置
cc-config switch project-a default
cc-config switch project-b default
```

### 场景 3：团队共享配置

```bash
# 导出你的配置（API Key 会自动脱敏）
cc-config export --stdout > team-config.json

# 分享文件给同事，对方导入：
cc-config import team-config.json --strategy merge
```

### 场景 4：快速切换模型实验

```bash
# 为同一提供商创建不同模型的配置
cc-config config add    # "sonnet-testing" → claude-sonnet-4
cc-config config add    # "haiku-testing"  → claude-haiku-3.5
cc-config config add    # "opus-testing"   → claude-opus-4

# 秒切模型
cc-config sonnet-testing   # ↔ cc-config haiku-testing
```

### 场景 5：故障排除

| 问题 | 解决方法 |
|------|---------|
| 配置不生效 | 重启 Claude Code 会话 |
| 项目找不到 | 先执行 `cc-config scan --register` |
| 配置找不到 | `cc-config config list` 查看可用配置 |
| 撤销失败 | 需要之前有备份，只能撤销最近一次变更 |
| 想修改已有配置 | 删除后重新创建，或直接编辑全局模板文件 |
| 想清空所有数据 | 删除 `~/.config/cc-config/` 和 `~/.local/share/cc-config/` 目录 |

---

## 文档

| 文档 | 说明 |
|------|------|
| [使用指南](./USAGE.md) | 完整 CLI 命令参考、TUI 操作、场景示例 |
| [开发指南](./DEVELOPMENT.md) | 架构设计、本地开发、测试说明 |
| [变更日志](./CHANGELOG.md) | 版本历史与变更记录 |

---

## 技术栈

| 层级 | 技术 |
|------|------|
| 运行时 | Node.js >= 18.17（ESM） |
| 语言 | TypeScript 6.x（严格模式、ES2022 目标、NodeNext 模块） |
| 构建 | tsup → 单文件 `dist/index.js` |
| CLI 框架 | commander 14.x |
| TUI | prompts、picocolors、cli-table3 |
| 数据验证 | zod 4.x |
| 测试 | vitest 3.x + v8 覆盖 |
| 配置存储 | conf 15.x（文件系统后端 JSON） |

---

## 许可证

[MIT](./LICENSE) © HosheaLi

---

## 参与贡献

欢迎贡献代码！以下是快速入门：

1. **搭建环境**：`npm install && npm link`
2. **开发模式**：`npm run dev`（tsx watch 热重载）
3. **运行测试**：`npm test`（所有测试必须通过）
4. **类型检查**：`npm run typecheck`（无报错）
5. **构建**：`npm run build`（提交前）
6. **提 PR**：描述清楚变更内容

详细贡献指南请阅读 [DEVELOPMENT.md](./DEVELOPMENT.md)。
