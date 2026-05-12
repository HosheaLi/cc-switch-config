# CC Config Switch

[![npm version](https://img.shields.io/npm/v/cc-config-switch)](https://www.npmjs.com/package/cc-config-switch)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

一个用于管理 Claude Code 项目级 API 提供商配置的 CLI/TUI 工具。

[English](./README.md) | 中文

---

## 特性

- **配置 CRUD** — 创建、列出、更新和删除 API 提供商模板
- **快速切换** — 一条命令将配置应用到任意项目
- **交互式 TUI** — 仪表盘、模糊搜索、差异预览、首次运行向导
- **导入/导出** — JSON 格式的配置备份和分享
- **撤销** — 每次变更自动备份，一条命令回滚
- **Shell 钩子** — 进入项目目录时自动切换配置
- **验证** — Schema 验证 + 友好的错误消息
- **安全** — 密码式输入、脱敏显示、API Key 不记录日志

## 安装

```bash
npm install -g cc-config-switch
```

需要 Node.js >= 18.17。

## 快速开始

### 启动 TUI

```bash
cc-config
```

交互式仪表盘会引导你完成项目扫描、配置管理和切换。

### CLI 示例

```bash
# 快速切换当前项目配置
cc-config my-config-name

# 列出已注册项目
cc-config list

# 应用配置
cc-config switch <project> <config>

# 添加新配置（交互式）
cc-config config add

# 撤销上次变更
cc-config undo
```

## 文档

| 资源 | 说明 |
|------|------|
| [使用指南](./USAGE.md) | 完整 CLI 命令参考和 TUI 导航 |
| [开发指南](./DEVELOPMENT.md) | 架构、本地开发、测试和贡献 |
| [变更日志](./CHANGELOG.md) | 版本历史 |
| [API 文档](./docs/api/) | TypeDoc 生成的 API 文档 |

## 配置文件

| 文件 | 位置 | 用途 |
|------|------|------|
| `settings.json` | `<项目>/.claude/` | 项目级 Claude Code 配置 |
| `settings.local.json` | `<项目>/.claude/` | 本地覆盖（不跟踪 Git） |
| `templates.json` | `~/.config/cc-config-switch/` | 提供商模板 |
| `projects.json` | `~/.local/share/cc-config-switch/` | 已注册项目 |
| `backups/` | `~/.local/share/cc-config-switch/` | 自动备份 |

## 许可证

[MIT](./LICENSE)

## 贡献

欢迎贡献！请参阅 [DEVELOPMENT.md](./DEVELOPMENT.md) 了解本地开发设置。
