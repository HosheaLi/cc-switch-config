# cc-switch-config

<p align="center">
  <b>⚡ 秒级切换 · 135 KB 极致轻量 · 交互式 TUI</b><br>
  <sub>Claude Code 项目级 API 配置管理工具</sub>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/cc-switch-config"><img src="https://img.shields.io/npm/v/cc-switch-config" alt="npm version"></a>
  <a href="https://github.com/HosheaLi/cc-switch-config"><img src="https://img.shields.io/github/stars/HosheaLi/cc-switch-config?style=flat" alt="GitHub stars"></a>
  <a href="./LICENSE"><img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License: MIT"></a>
  <a href="https://nodejs.org"><img src="https://img.shields.io/badge/node-%3E%3D18.17-brightgreen" alt="Node.js >= 18.17"></a>
  <a href="https://img.shields.io/npm/dm/cc-switch-config"><img src="https://img.shields.io/npm/dm/cc-switch-config" alt="npm downloads"></a>
</p>

<p align="center">
  <a href="./README_CN.md">中文文档</a>
</p>

---

## 为什么选择 cc-config？

你需要在多个项目之间切换 Claude Code 的 API 提供商——团队项目用 Anthropic API，个人项目用自定义端点，客户项目用转发服务。每次手动改 `settings.json`？太烦了。

**cc-switch-config** 是这个痛点的最简解。

| 特性 | 说明 |
|------|------|
| ⚡ **秒级切换** | 一条命令切换整个项目的 API 配置，无需手动编辑文件 |
| 🪶 **极简轻量** | 包体积仅 **135 KB**，无臃肿依赖树 |
| 🎨 **交互式 TUI** | 精美的终端仪表盘，支持模糊搜索、diff 预览、向导式操作 |
| 🔒 **安全第一** | API Key 密码式输入、脱敏显示、永不写入日志 |
| 💾 **自动备份** | 每次变更前自动创建备份，一条命令回滚 |
| 📦 **配置复用** | 一次创建提供商模板，在任意项目中复用 |
| 🔗 **Shell 钩子** | 进入项目目录自动切换配置，无感知 |

## 快速开始

```bash
# 安装
npm install -g cc-switch-config

# 启动 TUI 仪表盘
cc-config

# 快速切换当前项目到 my-profile
cc-config my-profile

# 列出所有注册项目
cc-config list
```

## CLI 命令速览

```bash
cc-config                   # 启动交互式 TUI 仪表盘
cc-config <profile-name>    # 快速切换当前项目配置

# 配置管理
cc-config config add        # 创建配置（统一模式/独立模式）
cc-config config list       # 列出所有配置模板
cc-config config remove     # 删除配置

# 项目管理
cc-config list              # 列出已注册项目
cc-config register <path>   # 注册新项目
cc-config switch <p> <cfg>  # 为项目应用配置
cc-config current [--json]  # 查看当前项目配置

# 其他
cc-config undo              # 撤销上次变更
cc-config export [--stdout] # 导出配置为 JSON
cc-config scan [--root]     # 扫描目录发现项目
```

## 工作原理

```
~/.config/cc-config/
  templates.json            ← 提供商模板（API Key + Base URL + 模型）

<your-project>/.claude/
  settings.json             ← cc-config switch → 精确替换 env/model 字段
  settings.local.json       ← 本地覆盖（优先）

~/.local/share/cc-config/
  projects.json             ← 已注册项目索引
  backups/                  ← 自动备份，cc-config undo 恢复
```

核心原则：**只修改 `env` 和 `model` 字段**，保留 `permissions`、`hooks`、`mcpServers` 等非 API 配置不变。

## 文档

| 文档 | 说明 |
|------|------|
| [使用指南](./USAGE.md) | 完整 CLI 命令参考、TUI 操作、场景示例 |
| [开发指南](./DEVELOPMENT.md) | 架构设计、本地开发、测试、贡献 |
| [变更日志](./CHANGELOG.md) | 版本历史与变更记录 |

## 许可证

[MIT](./LICENSE)

## 贡献

欢迎贡献！请先阅读 [DEVELOPMENT.md](./DEVELOPMENT.md) 了解本地开发配置。
