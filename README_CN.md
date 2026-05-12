# cc-config

<p align="center">
  <b>⚡ 秒级切换 · 135 KB 极致轻量 · 交互式 TUI</b><br>
  <sub>轻量化的 Claude Code 项目级 API 配置切换工具</sub>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/cc-config"><img src="https://img.shields.io/npm/v/cc-config" alt="npm version"></a>
  <a href="https://github.com/HosheaLi/cc-config"><img src="https://img.shields.io/github/stars/HosheaLi/cc-config?style=flat" alt="GitHub stars"></a>
  <a href="./LICENSE"><img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License: MIT"></a>
  <a href="https://nodejs.org"><img src="https://img.shields.io/badge/node-%3E%3D18.17-brightgreen" alt="Node.js >= 18.17"></a>
  <a href="https://img.shields.io/npm/dm/cc-config"><img src="https://img.shields.io/npm/dm/cc-config" alt="npm downloads"></a>
</p>

<p align="center">
  <a href="./README.md">English</a>
</p>

---

## 为什么选择 cc-config？

每个项目有不同的 API 提供商——团队项目用 Anthropic 直连，个人项目用自定义端点，客户项目走转发代理。你不想每次都手动改 `settings.json`。

**cc-config** 只做一件事：让你在项目之间秒切 API 配置。不臃肿，不复杂，装上就能用。

| 特性 | 说明 |
|------|------|
| ⚡ **秒级切换** | 一条命令切换整个项目的 API 配置，告别手动编辑 |
| 🪶 **极简轻量** | 包体积仅 **135 KB**，无臃肿依赖树，启动即用 |
| 🎨 **交互式 TUI** | 精美的终端仪表盘，模糊搜索、diff 预览、向导式操作 |
| 🔒 **安全第一** | API Key 密码式输入、脱敏显示、绝不写入日志 |
| 💾 **自动备份** | 每次变更前自动创建备份，`cc-config undo` 一键恢复 |
| 📦 **配置复用** | 一次创建提供商模板，所有项目共享复用 |
| 🔗 **Shell 钩子** | `cd` 进入项目目录自动切换配置，完全无感 |

## 快速开始

```bash
# 安装
npm install -g cc-config

# 启动 TUI 仪表盘（引导你完成扫描、配置、切换）
cc-config

# 一步切换当前项目到 my-profile
cc-config my-profile
```

## CLI 命令速览

```bash
cc-config                   # 启动交互式 TUI 仪表盘
cc-config <profile-name>    # 快速切换当前项目配置

# 配置模板管理
cc-config config add        # 创建配置（统一模式/独立模式可选）
cc-config config list       # 列出所有配置模板
cc-config config remove     # 删除配置

# 项目管理
cc-config list              # 列出已注册项目
cc-config register <path>   # 注册新项目
cc-config switch <p> <cfg>  # 为项目应用指定配置
cc-config current [--json]  # 查看当前项目的 API 配置

# 安全与工具
cc-config undo              # 撤销上次变更，恢复备份
cc-config export [--stdout] # 导出配置为 JSON（便于分享）
cc-config scan [--root]     # 扫描目录发现新项目
```

## 工作原理

```
~/.config/cc-config/
  templates.json            ← 你的每套提供商配置模板

<your-project>/.claude/
  settings.json             ← cc-config switch → 精确替换 env/model 字段
  settings.local.json       ← 本地覆盖文件（优先级更高）

~/.local/share/cc-config/
  projects.json             ← 已注册项目索引
  backups/                  ← 自动备份文件，undo 从这里恢复
```

核心设计原则：**只动 `env` 和 `model`，不碰其他配置**。`permissions`、`hooks`、`mcpServers` 等字段完全保留原样。

## 文档

| 文档 | 说明 |
|------|------|
| [使用指南](./USAGE.md) | 命令参考、配置模式、故障排除 |
| [开发指南](./DEVELOPMENT.md) | 架构设计、本地开发、测试说明 |
| [变更日志](./CHANGELOG.md) | 版本历史与变更记录 |

## 许可证

[MIT](./LICENSE)

## 贡献

欢迎提 Issue 和 PR！请先看 [DEVELOPMENT.md](./DEVELOPMENT.md) 配置本地开发环境。
